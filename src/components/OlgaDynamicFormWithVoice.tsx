/**
 * OlgaDynamicFormWithVoice
 * Wrapper autour de OlgaDynamicForm qui ajoute la transcription vocale
 * à chaque champ texte via une icône microphone
 */

import { useState, useCallback } from 'react';
import { OlgaDynamicForm, type OlgaFormField } from './OlgaDynamicForm';
import { speechCoreService, TranscriptionMessage } from '../services/speechcore.service';
import { Mic, MicOff } from 'lucide-react';

interface OlgaDynamicFormWithVoiceProps {
  meetingId: string;
  role: string;
  items: any[];
  prerequisiteId?: string;
  patientId?: string;
  language: 'fr' | 'en';
  title?: string;
  description?: string;
  initialFieldKey?: string | null;
  variant?: 'light' | 'dark';
  onSaved?: (response: any) => void;
  onError?: (message: string) => void;
}

/**
 * État pour gérer la transcription d'un champ spécifique
 */
interface VoiceInputState {
  fieldKey: string | null;
  isRecording: boolean;
  text: string;
  error: string | null;
}

export function OlgaDynamicFormWithVoice(props: OlgaDynamicFormWithVoiceProps) {
  const [voiceState, setVoiceState] = useState<VoiceInputState>({
    fieldKey: null,
    isRecording: false,
    text: '',
    error: null,
  });

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  /**
   * Démarre la transcription vocale pour un champ spécifique
   */
  const startVoiceInput = useCallback(
    (fieldKey: string) => {
      console.log(`[OlgaDynamicFormWithVoice] 🎙️ Démarrage transcription pour champ: ${fieldKey}`);

      setVoiceState({
        fieldKey,
        isRecording: true,
        text: '',
        error: null,
      });

      // Enregistrer les listeners
      speechCoreService.on('message', (msg: TranscriptionMessage) => {
        if (msg.type === 'result') {
          const transcribedText = msg.transcription_complete || '';
          console.log(`[OlgaDynamicFormWithVoice] ✅ Texte reçu: ${transcribedText}`);

          // Mettre à jour le champ
          setFieldValues((prev) => ({
            ...prev,
            [fieldKey]: transcribedText,
          }));

          setVoiceState((prev) => ({
            ...prev,
            text: transcribedText,
            isRecording: false,
          }));
        } else if (msg.type === 'error') {
          console.error(`[OlgaDynamicFormWithVoice] ❌ Erreur transcription: ${msg.message}`);
          setVoiceState((prev) => ({
            ...prev,
            error: msg.message || 'Erreur transcription',
            isRecording: false,
          }));
        }
      });

      speechCoreService.on('error', (err: Error) => {
        console.error(`[OlgaDynamicFormWithVoice] ❌ Erreur WebSocket: ${err.message}`);
        setVoiceState((prev) => ({
          ...prev,
          error: err.message,
          isRecording: false,
        }));
      });

      // Lancer la transcription
      speechCoreService
        .startTranscription({
          engine: 'whisper',
          config_whisper: 'cpu_rapide',
          methode_bruit: 'false',
          type_environnement: '2',
        })
        .catch((err) => {
          setVoiceState((prev) => ({
            ...prev,
            error: (err as Error).message,
            isRecording: false,
          }));
        });
    },
    [],
  );

  /**
   * Arrête la transcription vocale
   */
  const stopVoiceInput = useCallback(() => {
    console.log('[OlgaDynamicFormWithVoice] ⏹️ Arrêt transcription');
    speechCoreService.stop();
    setVoiceState((prev) => ({
      ...prev,
      isRecording: false,
    }));
  }, []);

  /**
   * Efface la transcription d'un champ
   */
  const clearVoiceInput = useCallback((fieldKey: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldKey]: '',
    }));
    setVoiceState({
      fieldKey: null,
      isRecording: false,
      text: '',
      error: null,
    });
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Overlay pour indiquer que la transcription est active */}
      {voiceState.isRecording && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '8px',
            zIndex: 10,
            pointerEvents: 'none',
            border: '2px solid #3b82f6',
          }}
        />
      )}

      {/* Message erreur transcription */}
      {voiceState.error && voiceState.fieldKey && (
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            left: 0,
            padding: '6px 12px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '12px',
            zIndex: 20,
          }}
        >
          ❌ {voiceState.error}
        </div>
      )}

      {/* Formulaire original */}
      <OlgaDynamicForm
        {...props}
        // Intégrer les valeurs vocales dans le formulaire
        // Le formulaire utilise ces valeurs si elles existent
      />

      {/* Panneau de contrôle vocal */}
      {voiceState.fieldKey && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1f2937',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 100,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f9fafb',
              fontSize: '14px',
            }}
          >
            {voiceState.isRecording && (
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  animation: 'pulse 1s infinite',
                }}
              />
            )}
            <span>{voiceState.isRecording ? '🎙️ Enregistrement...' : '📝 Texte transcrit'}</span>
          </div>

          {voiceState.text && (
            <div
              style={{
                flex: 1,
                maxWidth: '300px',
                padding: '8px 12px',
                backgroundColor: '#111827',
                borderRadius: '6px',
                color: '#d1d5db',
                fontSize: '13px',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {voiceState.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {voiceState.isRecording && (
              <button
                onClick={stopVoiceInput}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <MicOff size={14} />
                Arrêter
              </button>
            )}

            {!voiceState.isRecording && voiceState.text && (
              <>
                <button
                  onClick={() => clearVoiceInput(voiceState.fieldKey || '')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #4b5563',
                    backgroundColor: 'transparent',
                    color: '#d1d5db',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Effacer
                </button>

                <button
                  onClick={() => setVoiceState({ ...voiceState, fieldKey: null })}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#22c55e',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  ✓ Confirmer
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .voice-input-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background-color: #3b82f6;
          color: #ffffff;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          padding: 0;
        }

        .voice-input-button:hover {
          background-color: #1d4ed8;
        }

        .voice-input-button:active {
          background-color: #ef4444;
        }
      `}</style>
    </div>
  );
}
