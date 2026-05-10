"""
OncoCollab — Microservice FastAPI orchestrant le pipeline :
    audio → Whisper → Gemini → ReportLab (PDF) → embeddings

Endpoints :
    GET  /health
    POST /transcribe       (upload audio → texte brut)
    POST /generate-report  (upload audio + meeting_id → PDF + JSON structuré + embedding)
    POST /embed            (texte → embedding pour Qdrant)

Le service est appelé uniquement par le backend NestJS (réseau Docker interne).
Pas d'auth applicative ici : la sécurité est gérée par le backend NestJS qui filtre
toutes les requêtes utilisateur via JWT avant de relayer vers ce service.
"""

import os
import json
import logging
import tempfile
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from transcriber import MeetingTranscriber
from structurer import MeetingTextStructurer
from pdf_generator import MeetingReportPDF
from embedder import TextEmbedder

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("oncocollab.pipeline")

# ─── Configuration ──────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
ORG_NAME = os.getenv("ORGANIZATION_NAME", "OncoCollab")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/data/reports")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Composants (lazy init) ─────────────────────────────────────
transcriber = MeetingTranscriber(model_size=WHISPER_MODEL)
structurer: Optional[MeetingTextStructurer] = None
pdf_gen = MeetingReportPDF(organization_name=ORG_NAME)
embedder = TextEmbedder()


def get_structurer() -> MeetingTextStructurer:
    global structurer
    if structurer is None:
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY non configurée côté microservice Python.",
            )
        structurer = MeetingTextStructurer(api_key=GEMINI_API_KEY, model_name=GEMINI_MODEL)
    return structurer


# ─── App ────────────────────────────────────────────────────────
app = FastAPI(
    title="OncoCollab Pipeline",
    description="Whisper + Gemini + ReportLab pour la génération automatique de comptes-rendus RCP.",
    version="1.0.0",
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "whisper_model": WHISPER_MODEL,
        "gemini_model": GEMINI_MODEL,
        "embedding_dim": embedder.dimension,
        "gemini_configured": bool(GEMINI_API_KEY),
    }


# ─── /transcribe ────────────────────────────────────────────────
@app.post("/transcribe")
async def transcribe_endpoint(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("fr"),
):
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = transcriber.transcribe(tmp_path, language=language)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))

    return {
        "transcription": result["transcription"],
        "language": result.get("language"),
        "segments": result.get("segments", []),
    }


# ─── /generate-report ───────────────────────────────────────────
class GenerateReportFromTextPayload(BaseModel):
    transcription: str
    meeting_id: str
    meeting_title: Optional[str] = "Compte-rendu de RCP"
    meeting_type: Optional[str] = "RCP"


@app.post("/generate-report")
async def generate_report(
    audio: UploadFile = File(...),
    meeting_id: str = Form(...),
    meeting_title: str = Form("Compte-rendu de RCP"),
    meeting_type: str = Form("RCP"),
    language: Optional[str] = Form("fr"),
):
    """
    Pipeline complet : audio → Whisper → Gemini → PDF + embedding.
    Retourne JSON avec chemin local du PDF (à uploader ensuite vers Supabase côté NestJS).
    """
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 1. Whisper
        logger.info(f"[{meeting_id}] Étape 1/3 — Whisper")
        tr = transcriber.transcribe(tmp_path, language=language)
        if not tr.get("success"):
            raise HTTPException(status_code=500, detail=f"Whisper: {tr.get('error')}")
        transcription = tr["transcription"]

        # 2. Gemini
        logger.info(f"[{meeting_id}] Étape 2/3 — Gemini")
        st = get_structurer().structure(transcription, meeting_type=meeting_type)
        if not st.get("success"):
            raise HTTPException(status_code=500, detail=f"Gemini: {st.get('error')}")
        structured = st["structured_data"]

        # 3. PDF
        logger.info(f"[{meeting_id}] Étape 3/3 — PDF")
        report_id = str(uuid.uuid4())
        pdf_filename = f"rcp_{meeting_id}_{report_id}.pdf"
        pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
        pdf_gen.generate(
            structured_data=structured,
            output_path=pdf_path,
            report_title=meeting_title or "Compte-rendu de RCP",
            meeting_id=meeting_id,
            meeting_date=datetime.now().strftime("%d/%m/%Y"),
        )

        # 4. Embedding (résumé + concat)
        embed_text = _build_embedding_text(structured, transcription)
        embedding = embedder.embed(embed_text)

        return JSONResponse(
            {
                "success": True,
                "report_id": report_id,
                "pdf_path": pdf_path,
                "pdf_filename": pdf_filename,
                "transcription": transcription,
                "language": tr.get("language"),
                "structured_data": structured,
                "embedding": embedding,
                "embedding_dim": len(embedding),
                "embedding_text": embed_text[:500],  # preview pour debug
            }
        )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ─── /generate-report-from-text (skip Whisper) ──────────────────
@app.post("/generate-report-from-text")
async def generate_report_from_text(payload: GenerateReportFromTextPayload):
    st = get_structurer().structure(payload.transcription, meeting_type=payload.meeting_type or "RCP")
    if not st.get("success"):
        raise HTTPException(status_code=500, detail=f"Gemini: {st.get('error')}")
    structured = st["structured_data"]

    report_id = str(uuid.uuid4())
    pdf_filename = f"rcp_{payload.meeting_id}_{report_id}.pdf"
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
    pdf_gen.generate(
        structured_data=structured,
        output_path=pdf_path,
        report_title=payload.meeting_title or "Compte-rendu de RCP",
        meeting_id=payload.meeting_id,
        meeting_date=datetime.now().strftime("%d/%m/%Y"),
    )

    embed_text = _build_embedding_text(structured, payload.transcription)
    embedding = embedder.embed(embed_text)

    return {
        "success": True,
        "report_id": report_id,
        "pdf_path": pdf_path,
        "pdf_filename": pdf_filename,
        "structured_data": structured,
        "embedding": embedding,
        "embedding_dim": len(embedding),
    }


# ─── /pdf/{filename} (le backend NestJS récupère le PDF binaire) ──
@app.get("/pdf/{filename}")
def get_pdf(filename: str):
    """
    Permet au backend NestJS de récupérer le binaire du PDF généré
    pour ensuite l'uploader vers Supabase Storage.
    Sécurité : on n'autorise que les noms de fichiers générés par le service.
    """
    if "/" in filename or ".." in filename or not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Nom de fichier invalide")
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="PDF introuvable")
    return FileResponse(path, media_type="application/pdf", filename=filename)


# ─── /embed (utilitaire pour réindexer un texte) ────────────────
class EmbedPayload(BaseModel):
    text: str


@app.post("/embed")
def embed_text(payload: EmbedPayload):
    vec = embedder.embed(payload.text)
    return {"embedding": vec, "dim": len(vec)}


# ─── Helpers ────────────────────────────────────────────────────
def _build_embedding_text(structured: dict, transcription: str) -> str:
    """
    Construit un texte concaténé représentatif du rapport pour embedding
    (utilisé par Qdrant pour la recherche sémantique).
    """
    parts = []
    if structured.get("summary"):
        parts.append(str(structured["summary"]))
    for p in structured.get("patients_discussed") or []:
        parts.append(
            " ".join(
                str(p.get(k, "")) for k in ("label", "context", "discussion", "decision")
            )
        )
    for s in structured.get("sections") or []:
        parts.append(str(s.get("content", "")))
    for d in structured.get("decisions") or []:
        parts.append(str(d))
    for k in structured.get("key_points") or []:
        parts.append(str(k))

    text = " | ".join(p for p in parts if p)
    if not text.strip():
        text = transcription[:2000]
    # Limiter pour éviter de faire exploser le modèle d'embedding (qui tronquera de toute façon)
    return text[:8000]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
