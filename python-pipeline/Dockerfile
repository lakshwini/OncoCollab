# Microservice OncoCollab Pipeline (Whisper + Gemini + ReportLab)
FROM python:3.11-slim

# Dépendances système : ffmpeg (Whisper) + libs natives pour Whisper
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Optimiser le cache Docker en installant les deps avant le code
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Préchargement du modèle Whisper (évite un téléchargement au 1er appel)
ARG WHISPER_MODEL=base
ENV WHISPER_MODEL=${WHISPER_MODEL}
RUN python -c "import whisper; whisper.load_model('${WHISPER_MODEL}')"

# Préchargement du modèle d'embeddings
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

COPY . /app

# Volume pour les PDFs générés
RUN mkdir -p /data/reports
VOLUME ["/data/reports"]

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
