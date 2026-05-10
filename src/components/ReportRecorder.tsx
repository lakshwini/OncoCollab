import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic, MicOff, Loader, CheckCircle, AlertCircle, X,
  ExternalLink, FileText, Edit3, RefreshCw,
} from 'lucide-react';
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

// Flow 2-étapes :
//  idle → recording → transcribing → review → generating → success | error
type Stage =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'review'
  | 'generating'
  | 'success'
  | 'error';

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

export function ReportRecorder({
  meetingId,
  meetingTitle,
  currentDoctorName,
  onClose,
  onSuccess,
}: ReportRecorderProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const token = localStorage.getItem('onco_collab_token');

  // ── ÉTAPE 1 : Démarrage enregistrement ─────────────────────────
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        audioBlobRef.current = blob;
        console.log('[ReportRecorder] Audio blob:', blob.size, 'bytes');
        await sendToTranscribe(blob, mimeType);
      };

      recorder.start();
      setStage('recording');
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      setError(`Accès microphone refusé : ${(err as Error).message}`);
      setStage('error');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setStage('transcribing');
    }
  }, []);

  // ── ÉTAPE 1b : Envoi audio → Whisper ───────────────────────────
  const sendToTranscribe = useCallback(async (blob: Blob, mimeType: string) => {
    try {
      setStage('transcribing');
      if (!token) throw new Error("Token d'authentification manquant");

      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData();
      formData.append('audio', blob, `recording.${ext}`);

      console.log('[ReportRecorder] 📤 Transcription via Whisper...');
      const res = await fetch(
        createApiUrl(`/meetings/${meetingId}/transcribe`),
        { method: 'POST', headers: createAuthHeaders(token, false), body: formData },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur transcription ${res.status}`);
      }

      const data = await res.json();
      console.log('[ReportRecorder] ✅ Transcription OK:', data.transcription?.length, 'chars');
      setTranscription(data.transcription || '');
      setStage('review');
    } catch (err) {
      console.error('[ReportRecorder] ❌ Transcription échouée:', err);
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
    setRecordingTime(0);
    chunksRef.current = [];
    audioBlobRef.current = null;
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Helpers UI ──────────────────────────────────────────────────
  const stageColor: Record<Stage, string> = {
    idle: C.blue,
    recording: C.red,
    transcribing: C.orange,
    review: C.blue,
    generating: C.orange,
    success: C.green,
    error: C.red,
  };

  const stageLabel: Record<Stage, string> = {
    idle: 'Prêt à enregistrer',
    recording: `Enregistrement en cours — ${formatTime(recordingTime)}`,
    transcribing: 'Transcription Whisper en cours...',
    review: 'Relisez la transcription puis générez le rapport',
    generating: 'Génération du rapport (Gemini + PDF)...',
    success: '✅ Rapport généré avec succès',
    error: '❌ Erreur',
  };

  const isProcessing = stage === 'transcribing' || stage === 'generating';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
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
              Générer un Rapport
            </h2>
            <p style={{ color: C.gray, fontSize: '13px', margin: '4px 0 0' }}>
              {meetingTitle} · {currentDoctorName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'none', border: 'none', color: C.gray, cursor: isProcessing ? 'not-allowed' : 'pointer',
              padding: '4px', borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Indicateur d'étape */}
        <StepIndicator stage={stage} />

        {/* Barre de statut */}
        <div style={{
          backgroundColor: C.card,
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: `1px solid ${C.border}`,
        }}>
          {stage === 'recording' && (
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              backgroundColor: C.red, flexShrink: 0,
              animation: 'rcpPulse 1s ease-in-out infinite',
            }} />
          )}
          {isProcessing && <Loader size={18} color={C.orange} style={{ flexShrink: 0, animation: 'rcpSpin 1s linear infinite' }} />}
          {stage === 'success' && <CheckCircle size={18} color={C.green} style={{ flexShrink: 0 }} />}
          {stage === 'error' && <AlertCircle size={18} color={C.red} style={{ flexShrink: 0 }} />}
          {(stage === 'idle' || stage === 'review') && <Mic size={18} color={stageColor[stage]} style={{ flexShrink: 0 }} />}

          <p style={{ color: stageColor[stage], fontSize: '14px', fontWeight: 500, margin: 0 }}>
            {stageLabel[stage]}
          </p>
        </div>

        {/* Zone erreur */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: `1px solid rgba(239,68,68,0.4)`,
            borderRadius: '10px',
            padding: '12px 16px',
          }}>
            <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Zone de transcription — visible en review et success */}
        {(stage === 'review' || stage === 'success') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ color: C.gray, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {stage === 'review' ? 'Transcription (modifiable avant génération)' : 'Transcription utilisée'}
              </label>
              {stage === 'review' && (
                <span style={{ color: C.grayDark, fontSize: '11px' }}>
                  <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Vous pouvez corriger le texte
                </span>
              )}
            </div>
            <textarea
              value={transcription}
              onChange={e => setTranscription(e.target.value)}
              readOnly={stage !== 'review'}
              rows={8}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: `1px solid ${stage === 'review' ? C.borderLight : C.border}`,
                backgroundColor: stage === 'review' ? '#111827' : C.card,
                color: C.white,
                fontSize: '13px',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              placeholder="La transcription apparaîtra ici..."
            />
            <p style={{ color: C.grayDark, fontSize: '11px', margin: 0 }}>
              {transcription.length} caractères
            </p>
          </div>
        )}

        {/* Zone résumé — visible en success */}
        {stage === 'success' && result?.summary && (
          <div style={{
            backgroundColor: 'rgba(34,197,94,0.08)',
            border: `1px solid rgba(34,197,94,0.3)`,
            borderRadius: '10px',
            padding: '14px 16px',
          }}>
            <p style={{ color: C.gray, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
              Résumé généré par l'IA
            </p>
            <p style={{ color: '#86efac', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
              {result.summary}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {stage === 'idle' && (
            <button onClick={startRecording} style={btnStyle(C.blue, true)}>
              <Mic size={16} />
              Démarrer l'enregistrement
            </button>
          )}

          {stage === 'recording' && (
            <button onClick={stopRecording} style={btnStyle(C.red, true)}>
              <MicOff size={16} />
              Arrêter l'enregistrement
            </button>
          )}

          {isProcessing && (
            <div style={{ ...btnStyle('#374151', true), cursor: 'not-allowed', opacity: 0.7 }}>
              <Loader size={16} style={{ animation: 'rcpSpin 1s linear infinite' }} />
              {stage === 'transcribing' ? 'Transcription en cours...' : 'Génération en cours...'}
            </div>
          )}

          {stage === 'review' && (
            <>
              <button
                onClick={generateReport}
                disabled={!transcription.trim()}
                style={btnStyle(transcription.trim() ? C.green : '#374151', true)}
              >
                <FileText size={16} />
                Générer le rapport PDF
              </button>
              <button onClick={reset} style={btnStyle('#374151', false)}>
                <RefreshCw size={14} />
                Recommencer
              </button>
            </>
          )}

          {stage === 'success' && (
            <>
              {result?.pdfUrl && (
                <button onClick={openPdf} style={btnStyle(C.blue, true)}>
                  <ExternalLink size={16} />
                  Ouvrir le PDF
                </button>
              )}
              <button onClick={onClose} style={btnStyle(C.green, false)}>
                <CheckCircle size={16} />
                Fermer (disponible dans l'onglet Documents)
              </button>
            </>
          )}

          {stage === 'error' && (
            <>
              <button onClick={reset} style={btnStyle(C.blue, true)}>
                <RefreshCw size={16} />
                Réessayer
              </button>
              <button onClick={onClose} style={btnStyle('#374151', false)}>
                Fermer
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rcpPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes rcpSpin  { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Indicateur d'étape ──────────────────────────────────────────
function StepIndicator({ stage }: { stage: Stage }) {
  const steps = [
    { id: 'record', label: 'Enregistrement', stages: ['idle', 'recording'] },
    { id: 'transcribe', label: 'Transcription', stages: ['transcribing', 'review'] },
    { id: 'generate', label: 'Génération PDF', stages: ['generating', 'success'] },
  ];

  const currentStep = (() => {
    if (['idle', 'recording'].includes(stage)) return 0;
    if (['transcribing', 'review'].includes(stage)) return 1;
    return 2;
  })();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const color = done ? '#22c55e' : active ? '#3b82f6' : '#4b5563';
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: done ? '#22c55e' : active ? '#3b82f6' : '#1f2937',
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: done || active ? '#fff' : '#6b7280',
                flexShrink: 0,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ color, fontSize: '10px', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: '2px', margin: '0 6px',
                backgroundColor: done ? '#22c55e' : '#374151',
                marginBottom: '16px',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function btnStyle(bg: string, primary: boolean): React.CSSProperties {
  return {
    flex: primary ? 1 : 'none',
    padding: '11px 16px',
    backgroundColor: bg,
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: primary ? '0' : '120px',
  };
}
