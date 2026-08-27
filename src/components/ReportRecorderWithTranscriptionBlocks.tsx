/**
 * ReportRecorderWithTranscriptionBlocks
 * Version améliorée de ReportRecorder qui utilise les blocs de transcription temps réel
 * au lieu d'enregistrer l'audio directement
 */

import { useState, useCallback, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle, X, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import { API_CONFIG, createApiUrl, createAuthHeaders } from '../config/api.config';

interface ReportRecorderProps {
  meetingId: string;
  meetingTitle: string;
  currentDoctorName: string;
  onClose: () => void;
  onSuccess?: (data: ReportResult) => void;
}

interface ReportResult {
  reportId: string;
  pdfUrl: string;
  title: string;
  summary: string;
  structuredData: any;
}

// Flow amélioré:
// idle → fetching-blocks → review → generating → success | error
type Stage = 'idle' | 'fetching-blocks' | 'review' | 'generating' | 'success' | 'error';

const C = {
  bg: '#111827',
  card: '#1f2937',
  border: '#374151',
  borderLight: '#4b5563',
  white: '#f9fafb',
  gray: '#9ca3af',
  grayDark: '#6b7280',
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
};

export function ReportRecorderWithTranscriptionBlocks({
  meetingId,
  meetingTitle,
  currentDoctorName,
  onClose,
  onSuccess,
}: ReportRecorderProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [transcription, setTranscription] = useState('');
  const [blockCount, setBlockCount] = useState(0);
  const [speakerMap, setSpeakerMap] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);

  const token = localStorage.getItem('onco_collab_token');

  // ── ÉTAPE 1 : Récupérer les blocs de transcription ─────────────────────────
  const fetchTranscriptionBlocks = useCallback(async () => {
    try {
      setError(null);
      setStage('fetching-blocks');

      if (!token) throw new Error("Token d'authentification manquant");

      console.log('[ReportRecorder] 📖 Récupération des blocs de transcription...');

      // 1. Récupérer les blocs
      const blocksRes = await fetch(
        createApiUrl(`/meetings/${meetingId}/transcription/blocks`),
        { method: 'GET', headers: createAuthHeaders(token, false) },
      );

      if (!blocksRes.ok) {
        throw new Error(`Erreur récupération blocs: ${blocksRes.status}`);
      }

      const blocksData = await blocksRes.json();
      const blocks = blocksData.blocks || [];

      if (blocks.length === 0) {
        throw new Error('Aucun bloc de transcription trouvé. Veuillez d\'abord enregistrer une transcription.');
      }

      console.log(`[ReportRecorder] ✅ ${blocks.length} blocs récupérés`);

      // 2. Fusionner les blocs
      const fusedRes = await fetch(
        createApiUrl(`/meetings/${meetingId}/transcription/fuse`),
        { method: 'POST', headers: createAuthHeaders(token, false) },
      );

      if (!fusedRes.ok) {
        throw new Error(`Erreur fusion blocs: ${fusedRes.status}`);
      }

      const fusedData = await fusedRes.json();
      const fullTranscription = fusedData.fullTranscription || '';

      console.log('[ReportRecorder] ✅ Transcription fusionnée:', fullTranscription.length, 'caractères');

      setTranscription(fullTranscription);
      setBlockCount(fusedData.blockCount || 0);
      setSpeakerMap(fusedData.speakerMap || {});
      setStage('review');
    } catch (err) {
      console.error('[ReportRecorder] ❌ Erreur récupération blocs:', err);
      setError((err as Error).message);
      setStage('error');
    }
  }, [meetingId, token]);

  // ── ÉTAPE 2 : Génération du rapport depuis la transcription ─────
  const generateReport = useCallback(async () => {
    try {
      setStage('generating');
      setError(null);
      if (!token) throw new Error("Token d'authentification manquant");

      console.log('[ReportRecorder] 📤 Génération rapport (Gemini + PDF)...');
      const res = await fetch(
        createApiUrl(`/meetings/${meetingId}/generate-from-transcript`),
        {
          method: 'POST',
          headers: createAuthHeaders(token, true),
          body: JSON.stringify({ transcription }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur génération ${res.status}`);
      }

      const data = await res.json();
      console.log('[ReportRecorder] ✅ Rapport généré:', data.reportId);

      const report: ReportResult = {
        reportId: data.reportId,
        pdfUrl: data.pdfUrl,
        title: data.title,
        summary: data.summary || data.structuredData?.summary || '',
        structuredData: data.structuredData,
      };

      setResult(report);
      setStage('success');
      onSuccess?.(report);
    } catch (err) {
      console.error('[ReportRecorder] ❌ Génération échouée:', err);
      setError((err as Error).message);
      setStage('error');
    }
  }, [meetingId, transcription, token, onSuccess]);

  const openPdf = useCallback(() => {
    if (!result?.pdfUrl) return;
    const url = result.pdfUrl.startsWith('/')
      ? `${API_CONFIG.BASE_URL}${result.pdfUrl}`
      : result.pdfUrl;
    window.open(url, '_blank');
  }, [result]);

  const reset = useCallback(() => {
    setStage('idle');
    setError(null);
    setTranscription('');
    setResult(null);
    setBlockCount(0);
    setSpeakerMap({});
  }, []);

  const stageColor: Record<Stage, string> = {
    idle: C.blue,
    'fetching-blocks': C.orange,
    review: C.blue,
    generating: C.orange,
    success: C.green,
    error: C.red,
  };

  const stageLabel: Record<Stage, string> = {
    idle: 'Prêt à générer le rapport',
    'fetching-blocks': 'Récupération des blocs de transcription...',
    review: 'Relisez la transcription puis générez le rapport',
    generating: 'Génération du rapport (Gemini + PDF)...',
    success: '✅ Rapport généré avec succès',
    error: '❌ Erreur',
  };

  const isProcessing = stage === 'fetching-blocks' || stage === 'generating';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: C.bg,
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '560px',
          width: '95%',
          border: `1px solid ${C.border}`,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ color: C.white, margin: 0, fontSize: '18px', fontWeight: 700 }}>
              📋 Générer un Rapport
            </h2>
            <p style={{ color: C.gray, fontSize: '13px', margin: '4px 0 0' }}>
              {meetingTitle} · {currentDoctorName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'none',
              border: 'none',
              color: C.gray,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Bar */}
        <div
          style={{
            backgroundColor: C.card,
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: stageColor[stage],
              flexShrink: 0,
            }}
          />
          <span style={{ color: C.white, fontSize: '13px', fontWeight: 600, flex: 1 }}>
            {stageLabel[stage]}
          </span>
          {isProcessing && <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: C.blue }} />}
        </div>

        {/* Stats */}
        {stage === 'review' && blockCount > 0 && (
          <div
            style={{
              backgroundColor: C.card,
              borderRadius: '10px',
              padding: '12px 16px',
              border: `1px solid ${C.border}`,
              fontSize: '12px',
              color: C.gray,
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>📊 Blocs: <strong style={{ color: C.white }}>{blockCount}</strong></div>
            <div>👥 Speakers: <strong style={{ color: C.white }}>{Object.keys(speakerMap).join(', ')}</strong></div>
          </div>
        )}

        {/* Error Alert */}
        {error && stage === 'error' && (
          <div
            style={{
              backgroundColor: '#7f1d1d',
              borderRadius: '10px',
              padding: '12px 16px',
              border: '1px solid #991b1b',
              color: '#fecaca',
              fontSize: '13px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Transcription Preview */}
        {stage === 'review' && transcription && (
          <div
            style={{
              backgroundColor: C.card,
              borderRadius: '10px',
              padding: '12px 16px',
              border: `1px solid ${C.border}`,
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '12px',
              color: C.gray,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {transcription.substring(0, 500)}
            {transcription.length > 500 && '...'}
          </div>
        )}

        {/* Success Result */}
        {stage === 'success' && result && (
          <div
            style={{
              backgroundColor: C.card,
              borderRadius: '10px',
              padding: '16px',
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} style={{ color: C.green }} />
              <div>
                <div style={{ color: C.white, fontWeight: 600, fontSize: '13px' }}>
                  Rapport généré avec succès
                </div>
                <div style={{ color: C.gray, fontSize: '12px', marginTop: '2px' }}>
                  {result.title}
                </div>
              </div>
            </div>

            {result.summary && (
              <div
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  color: C.gray,
                  lineHeight: '1.5',
                }}
              >
                <div style={{ color: C.white, fontWeight: 600, marginBottom: '6px', fontSize: '11px' }}>
                  Résumé:
                </div>
                {result.summary.substring(0, 200)}
                {result.summary.length > 200 && '...'}
              </div>
            )}

            <button
              onClick={openPdf}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: C.blue,
                color: C.white,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.blue)}
            >
              <ExternalLink size={16} />
              Ouvrir le PDF
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {stage === 'idle' && (
            <>
              <button
                onClick={fetchTranscriptionBlocks}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: C.blue,
                  color: C.white,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                Récupérer transcription
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  backgroundColor: 'transparent',
                  color: C.gray,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Annuler
              </button>
            </>
          )}

          {stage === 'review' && (
            <>
              <button
                onClick={generateReport}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: C.green,
                  color: C.white,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Générer le rapport
              </button>
              <button
                onClick={reset}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  backgroundColor: 'transparent',
                  color: C.gray,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                }}
              >
                Recommencer
              </button>
            </>
          )}

          {stage === 'error' && (
            <>
              <button
                onClick={fetchTranscriptionBlocks}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: C.blue,
                  color: C.white,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={14} style={{ marginRight: '6px' }} />
                Réessayer
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  backgroundColor: 'transparent',
                  color: C.gray,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Fermer
              </button>
            </>
          )}

          {stage === 'success' && (
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: C.blue,
                color: C.white,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Fermer
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
