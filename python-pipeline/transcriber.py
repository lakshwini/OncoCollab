"""
OncoCollab — Module Speech-to-Text basé sur OpenAI Whisper (local).
Adapté pour le contexte RCP (Réunion de Concertation Pluridisciplinaire) en oncologie.
"""

import os
import logging
from typing import Optional

import whisper

logger = logging.getLogger(__name__)


class MeetingTranscriber:
    """
    Transcripteur audio Whisper. Modèle chargé en lazy.
    Pour des réunions médicales en français, le modèle 'small' ou 'medium'
    donne un bon compromis précision/perf. 'base' suffit pour démarrer.
    """

    def __init__(self, model_size: str = "base", device: str = "auto"):
        self.model_size = model_size
        self.device = device
        self._model = None
        logger.info(f"Transcriber initialisé (modèle={model_size}, device={device})")

    def _load_model(self):
        if self._model is None:
            logger.info(f"Chargement du modèle Whisper '{self.model_size}'...")
            self._model = whisper.load_model(
                self.model_size,
                device=None if self.device == "auto" else self.device,
            )
            logger.info("Modèle Whisper chargé.")
        return self._model

    def transcribe(
        self,
        audio_file_path: str,
        language: Optional[str] = "fr",
    ) -> dict:
        """
        Transcrit un fichier audio. Retourne {success, transcription, language, segments?}.

        Par défaut on force la langue 'fr' car les RCP OncoCollab sont en français.
        Mettre language=None pour laisser Whisper détecter automatiquement.
        """
        if not os.path.exists(audio_file_path):
            return {"success": False, "error": f"Fichier audio introuvable: {audio_file_path}"}

        try:
            model = self._load_model()
            options = {"task": "transcribe"}
            if language:
                options["language"] = language

            logger.info(f"Transcription en cours: {audio_file_path}")
            result = model.transcribe(audio_file_path, **options)

            transcription = (result.get("text") or "").strip()
            detected_language = result.get("language", "unknown")

            segments = []
            for seg in result.get("segments", []) or []:
                segments.append(
                    {
                        "start": seg.get("start", 0),
                        "end": seg.get("end", 0),
                        "text": (seg.get("text") or "").strip(),
                    }
                )

            logger.info(
                f"Transcription OK ({len(transcription)} chars, "
                f"{len(segments)} segments, langue={detected_language})"
            )

            return {
                "success": True,
                "transcription": transcription,
                "language": detected_language,
                "segments": segments,
            }
        except Exception as e:
            logger.exception("Erreur Whisper")
            return {"success": False, "error": f"Erreur Whisper: {e}"}
