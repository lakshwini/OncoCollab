/**
 * TranscriptionDisplay
 * Affiche les blocs de transcription en temps réel pendant la visio
 */

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, RotateCcw } from 'lucide-react';
import { useTranscription } from '../contexts/TranscriptionContext';
import { speechCoreService, TranscriptionMessage } from '../services/speechcore.service';

const C = {
  bg: '#1a1a1a',
  bgCard: '#2a2a2a',
  bgCardHover: '#333333',
  border: '#333333',
  textWhite: '#ffffff',
  textGray: '#9ca3af',
  textGrayLight: '#d1d5db',
  blue: '#3b82f6',
  blueDark: '#1d4ed8',
  green: '#22c55e',
  red: '#ef4444',
  redDark: '#dc2626',
  orange: '#f97316',
  purple: '#a855f7',
};

interface TranscriptionDisplayProps {
  meetingTitle?: string;
  engine?: 'whisper' | 'vosk' | 'gladia' | 'groq';
  onTranscriptionUpdate?: (transcription: string) => void;
}

export function TranscriptionDisplay({
  meetingTitle = 'RCP',
  engine = 'whisper',
  onTranscriptionUpdate,
}: TranscriptionDisplayProps) {
  const transcription = useTranscription();
  const [localText, setLocalText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<string[]>(['Médecin 1', 'Médecin 2', 'Médecin 3']);
  const blocksEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le dernier bloc
  useEffect(() => {
    blocksEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription.blocks]);

  // Gérer les messages WebSocket
  const handleWebSocketMessage = (msg: TranscriptionMessage) => {
    console.log('[TranscriptionDisplay] 📨 Message reçu:', msg.type);

    if (msg.type === 'status') {
      console.log('[TranscriptionDisplay] ℹ️', msg.message);
    } else if (msg.type === 'result') {
      // Résultat final de la transcription
      setLocalText(msg.transcription_complete || '');
      transcription.addTextToCurrentBlock(msg.transcription_complete || '');
      onTranscriptionUpdate?.(msg.transcription_complete || '');
    } else if (msg.type === 'error') {
      setError(msg.message || 'Erreur transcription');
      console.error('[TranscriptionDisplay] ❌', msg.message);
    }
  };

  const handleWebSocketError = (err: Error) => {
    setError(err.message);
    console.error('[TranscriptionDisplay] ❌ Erreur WebSocket:', err);
  };

  const handleWebSocketOpen = () => {
    console.log('[TranscriptionDisplay] ✅ WebSocket connecté');
    setError(null);
    setIsConnecting(false);
  };

  const handleWebSocketClose = () => {
    console.log('[TranscriptionDisplay] 🔌 WebSocket fermé');
  };

  // Enregistrer les listeners
  useEffect(() => {
    speechCoreService.on('message', handleWebSocketMessage);
    speechCoreService.on('error', handleWebSocketError);
    speechCoreService.on('open', handleWebSocketOpen);
    speechCoreService.on('close', handleWebSocketClose);
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      setLocalText('');
      transcription.startRecording();

      await speechCoreService.startTranscription({
        engine,
        config_whisper: 'cpu_rapide',
        methode_bruit: 'false',
        type_environnement: '2',
        nb_locuteurs: 2,
      });
    } catch (err) {
      setError((err as Error).message);
      transcription.stopRecording();
    }
  };

  const stopRecording = async () => {
    try {
      speechCoreService.stop();

      // Sauvegarder le bloc si du texte existe
      if (localText.trim().length > 0) {
        await transcription.stopRecording();
        setLocalText('');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const clearAllBlocks = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous les blocs?')) {
      try {
        await transcription.deleteAllBlocks();
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  const stats = transcription.getBlockStats();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: C.bg,
        borderRadius: '12px',
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.bgCard,
        }}
      >
        <h3 style={{ color: C.textWhite, margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>
          🎙️ Transcription Temps Réel — {meetingTitle}
        </h3>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <button
            onClick={transcription.isRecording ? stopRecording : startRecording}
            disabled={isConnecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: transcription.isRecording ? C.red : C.blue,
              color: C.textWhite,
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = transcription.isRecording ? C.redDark : C.blueDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = transcription.isRecording ? C.red : C.blue;
            }}
          >
            {transcription.isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            {transcription.isRecording ? 'Arrêter' : 'Démarrer'}
          </button>

          {/* Speaker Selection */}
          <select
            value={transcription.currentSpeaker}
            onChange={(e) => transcription.setCurrentSpeaker(e.target.value)}
            disabled={transcription.isRecording}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${C.border}`,
              backgroundColor: C.bgCard,
              color: C.textWhite,
              fontSize: '13px',
              cursor: transcription.isRecording ? 'not-allowed' : 'pointer',
            }}
          >
            {speakers.map((speaker) => (
              <option key={speaker} value={speaker}>
                {speaker}
              </option>
            ))}
            <option value="Autre">Autre...</option>
          </select>

          {/* Clear Button */}
          <button
            onClick={clearAllBlocks}
            disabled={transcription.blocks.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${C.border}`,
              backgroundColor: C.bgCard,
              color: C.textGray,
              cursor: transcription.blocks.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
            }}
          >
            <RotateCcw size={14} />
            Réinitialiser
          </button>

          {/* Status */}
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: transcription.isRecording ? C.red : C.textGray,
            }}
          >
            {transcription.isRecording && (
              <>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: C.red,
                    animation: 'pulse 1s infinite',
                  }}
                />
                🔴 Enregistrement...
              </>
            )}
            {isConnecting && '⏳ Connexion...'}
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#1f2937',
            borderRadius: '6px',
            fontSize: '12px',
            color: C.textGray,
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>📊 Blocs: <strong style={{ color: C.textWhite }}>{stats.totalBlocks}</strong></div>
          <div>📝 Mots: <strong style={{ color: C.textWhite }}>{stats.totalWords}</strong></div>
          <div>👥 Speakers: <strong style={{ color: C.textWhite }}>{stats.speakers.join(', ') || 'Aucun'}</strong></div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#7f1d1d',
              borderRadius: '6px',
              color: '#fecaca',
              fontSize: '12px',
            }}
          >
            ❌ {error}
          </div>
        )}
      </div>

      {/* Transcription Blocks */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {transcription.blocks.map((block, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: C.bgCard,
              borderLeft: `3px solid ${C.blue}`,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.bgCardHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = C.bgCard;
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <strong style={{ color: C.blue, fontSize: '13px' }}>
                {block.speakerName}
              </strong>
              {block.timestampSeconds && (
                <span style={{ fontSize: '11px', color: C.textGray }}>
                  {Math.floor(block.timestampSeconds / 60)}:{String(block.timestampSeconds % 60).padStart(2, '0')}
                </span>
              )}
            </div>
            <p style={{ margin: '0', color: C.textWhite, fontSize: '13px', lineHeight: '1.5' }}>
              {block.text}
            </p>
          </div>
        ))}

        {/* Current Block (en cours) */}
        {transcription.isRecording && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#1e40af',
              borderLeft: `3px solid ${C.green}`,
              opacity: 0.7,
            }}
          >
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ color: C.green, fontSize: '13px' }}>
                🎙️ {transcription.currentSpeaker} (en cours...)
              </strong>
            </div>
            <p
              style={{
                margin: '0',
                color: C.textWhite,
                fontSize: '13px',
                lineHeight: '1.5',
                fontStyle: localText ? 'normal' : 'italic',
              }}
            >
              {localText || '(écoute...)'}
            </p>
          </div>
        )}

        {transcription.blocks.length === 0 && !transcription.isRecording && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.textGray,
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            👂 Cliquez sur "Démarrer" pour commencer la transcription
          </div>
        )}

        <div ref={blocksEndRef} />
      </div>

      {/* Full Transcription Preview */}
      {transcription.blocks.length > 0 && (
        <div
          style={{
            padding: '12px',
            borderTop: `1px solid ${C.border}`,
            backgroundColor: C.bgCard,
            maxHeight: '120px',
            overflowY: 'auto',
            fontSize: '11px',
            color: C.textGray,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <div style={{ color: C.textGrayLight, marginBottom: '6px', fontWeight: 600 }}>
            📄 Transcription complète (aperçu):
          </div>
          {transcription.getFullTranscription()}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
