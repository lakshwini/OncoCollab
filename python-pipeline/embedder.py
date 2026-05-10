"""
OncoCollab — Génération d'embeddings pour Qdrant.
Utilise sentence-transformers avec un modèle multilingue (FR + EN).
Le modèle est chargé en lazy au premier appel.
"""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


class TextEmbedder:
    """
    Wrapper sentence-transformers. Modèle par défaut :
    'paraphrase-multilingual-MiniLM-L12-v2' — 384 dims, multilingue, léger.
    """

    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        self.model_name = model_name
        self._model = None
        self._dim: Optional[int] = None

    def _load(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            logger.info(f"Chargement du modèle d'embeddings '{self.model_name}'...")
            self._model = SentenceTransformer(self.model_name)
            self._dim = int(self._model.get_sentence_embedding_dimension())
            logger.info(f"Embeddings prêts (dim={self._dim})")
        return self._model

    @property
    def dimension(self) -> int:
        self._load()
        return int(self._dim or 384)

    def embed(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.dimension
        model = self._load()
        vec = model.encode(text, normalize_embeddings=True)
        return [float(x) for x in vec.tolist()]

    def embed_many(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        model = self._load()
        vecs = model.encode(texts, normalize_embeddings=True)
        return [[float(x) for x in v.tolist()] for v in vecs]
