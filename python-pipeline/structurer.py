"""
OncoCollab — Structuration du transcript via Google Gemini.
Prompt adapté au contexte RCP (Réunion de Concertation Pluridisciplinaire) en oncologie.
"""

import os
import json
import logging
from typing import Optional

import google.generativeai as genai

logger = logging.getLogger(__name__)


# Prompt orienté RCP / oncologie / contexte médical français.
# On demande à Gemini de produire un JSON propre, exploitable côté backend
# pour : génération PDF, recherche sémantique Qdrant, et indexation Postgres.
ONCOLOGY_PROMPT_TEMPLATE = """\
Tu es un assistant médical IA spécialisé dans la rédaction de comptes-rendus de
Réunions de Concertation Pluridisciplinaire (RCP) en oncologie.

À partir de la transcription brute ci-dessous, produis un JSON structuré, exploitable
pour générer un compte-rendu professionnel destiné à des médecins.

Règles importantes :
- Reste fidèle au contenu, n'invente AUCUNE information clinique non présente.
- Anonymise les patients : utilise "Patient A", "Patient B", etc. SAUF si un identifiant
  non nominatif (ex: numéro de dossier, initiales) est explicitement mentionné.
- Si une information n'est pas disponible, mets une chaîne vide ou un tableau vide,
  PAS d'information inventée.
- Réponds STRICTEMENT en JSON valide, sans aucun texte avant ou après, sans markdown.

Schéma JSON attendu :
{{
  "meeting_metadata": {{
    "type": "RCP",
    "specialty": "spécialité concernée si mentionnée (ex: oncologie thoracique, sénologie, digestif...)",
    "duration_estimate": "estimation en minutes"
  }},
  "participants": [
    "Dr Nom (spécialité) si mentionné, sinon rôle générique"
  ],
  "summary": "Résumé médical synthétique de la RCP en 3-5 phrases",
  "patients_discussed": [
    {{
      "label": "Patient A",
      "context": "âge, sexe, antécédents, diagnostic principal si mentionnés",
      "discussion": "résumé de la discussion clinique le concernant",
      "decision": "décision thérapeutique retenue",
      "next_steps": "prochaines étapes / examens / RDV planifiés"
    }}
  ],
  "sections": [
    {{
      "title": "Titre de section (ex: Ouverture, Cas patient A, Discussion thérapeutique, Clôture)",
      "content": "Contenu rédigé de la section"
    }}
  ],
  "key_points": [
    "Point clé médical 1",
    "Point clé médical 2"
  ],
  "action_items": [
    {{
      "task": "tâche concrète à accomplir",
      "responsible": "personne responsable si identifiable",
      "deadline": "échéance si mentionnée"
    }}
  ],
  "decisions": [
    "Décision thérapeutique ou organisationnelle 1"
  ]
}}

Type de réunion : {meeting_type}
Spécialité supposée : oncologie / RCP

Transcription brute :
\"\"\"
{transcription}
\"\"\"

Retourne UNIQUEMENT le JSON, sans markdown ni texte additionnel.
"""


class MeetingTextStructurer:
    """
    Wrapper Gemini. La clé API est obligatoire (passée en paramètre ou via env GEMINI_API_KEY).
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY manquante. Passer api_key ou définir la variable d'environnement."
            )

        genai.configure(api_key=self.api_key)
        # gemini-1.5-flash = rapide et gratuit dans les limites du free tier
        # gemini-1.5-pro = meilleure qualité mais plus coûteux
        self.model_name = model_name
        self.model = genai.GenerativeModel(model_name)
        logger.info(f"Gemini initialisé (modèle={model_name})")

    def structure(self, raw_transcription: str, meeting_type: str = "RCP") -> dict:
        if not raw_transcription or not raw_transcription.strip():
            return {"success": False, "error": "Transcription vide"}

        prompt = ONCOLOGY_PROMPT_TEMPLATE.format(
            meeting_type=meeting_type,
            transcription=raw_transcription,
        )

        try:
            logger.info("Appel Gemini en cours...")
            response = self.model.generate_content(prompt)
            response_text = (response.text or "").strip()

            structured = self._parse_json(response_text)

            return {
                "success": True,
                "structured_data": structured,
                "raw_response": response_text,
            }
        except Exception as e:
            logger.exception("Erreur Gemini")
            return {"success": False, "error": f"Erreur Gemini: {e}"}

    def _parse_json(self, response_text: str) -> dict:
        """Extrait le JSON, en tolérant les blocs markdown ```json ... ```."""
        text = response_text.strip()
        if "```json" in text:
            start = text.find("```json") + len("```json")
            end = text.rfind("```")
            text = text[start:end].strip()
        elif text.startswith("```"):
            start = text.find("```") + 3
            end = text.rfind("```")
            text = text[start:end].strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"Impossible de parser le JSON Gemini: {e}")
            return {
                "_parse_error": True,
                "raw_text": response_text,
                "summary": response_text[:500],
                "sections": [{"title": "Contenu brut", "content": response_text}],
                "patients_discussed": [],
                "participants": [],
                "key_points": [],
                "action_items": [],
                "decisions": [],
                "meeting_metadata": {"type": "RCP"},
            }
