-- ============================================================
-- Migration 001 — Tables pour la génération automatique de
-- comptes-rendus de RCP (audio → Whisper → Gemini → PDF)
-- ============================================================
-- À exécuter dans la base PostgreSQL OncoCollab.
-- Compatible avec init.sql existant (uuid-ossp + gen_random_uuid()).
--
-- Lancement manuel :
--   docker exec -i oncocollab_postgres psql -U <user> -d OncoCollab \
--     < rest-api/migrations/001_meeting_reports.sql
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- 1. meeting_transcripts
--    Stocke la transcription brute Whisper d'une réunion
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    raw_transcript TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'fr',
    duration_seconds INTEGER,
    created_by UUID REFERENCES doctors(doctorid),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting_id
    ON meeting_transcripts(meeting_id);

-- ─────────────────────────────────────────────
-- 2. meeting_reports
--    Compte-rendu généré (PDF stocké dans Supabase + JSON structuré + lien Qdrant)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    transcript_id UUID REFERENCES meeting_transcripts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Compte-rendu de RCP',
    summary TEXT,
    structured_data JSONB,            -- JSON Gemini complet
    pdf_url TEXT,                     -- URL publique Supabase Storage
    pdf_filename VARCHAR(255),
    pdf_size_bytes INTEGER,
    qdrant_point_id VARCHAR(64),      -- ID du point dans la collection Qdrant
    status VARCHAR(20) DEFAULT 'ready',
        -- pending | processing | ready | failed
    error_message TEXT,
    generated_by UUID REFERENCES doctors(doctorid),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_reports_meeting_id
    ON meeting_reports(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_reports_generated_by
    ON meeting_reports(generated_by);

-- ─────────────────────────────────────────────
-- 3. doctor_personal_files
--    Espace personnel de chaque docteur : liste des fichiers
--    (rapports RCP) accessibles depuis sa session
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_personal_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(doctorid) ON DELETE CASCADE,
    report_id UUID REFERENCES meeting_reports(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    file_type VARCHAR(50) DEFAULT 'pdf',     -- pdf, image, doc, etc.
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, report_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_personal_files_doctor_id
    ON doctor_personal_files(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_personal_files_report_id
    ON doctor_personal_files(report_id);

COMMIT;
