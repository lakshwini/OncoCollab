import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, FileText, Edit2, Trash2, Check, X } from 'lucide-react';
import { useTranscription } from '../contexts/TranscriptionContext';
import { useWebRTC } from '../contexts/WebRTCContext';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { createApiUrl, createAuthHeaders } from '../config/api.config';

const C = {
  bg: '#1a1a1a', bgCard: '#252525', bgCardHover: '#2f2f2f',
  border: '#333333', borderLight: '#444444',
  textWhite: '#ffffff', textGray: '#9ca3af', textGrayDark: '#6b7280',
  blue: '#3b82f6', green: '#22c55e', greenDark: '#16a34a',
  red: '#ef4444', purple: '#a855f7',
};

interface Speaker { id: string; name: string; isCurrentUser: boolean; doctorId?: string; }
interface FloorHolder { socketId: string; speakerName: string; }

interface SpeechBlocksPanelProps {
  meetingId: string;
  speakers: Speaker[];
  onGenerateReport: () => void;
  onRegisterStartCallback?: (fn: () => void) => void;
}

export function SpeechBlocksPanel({ meetingId, speakers, onGenerateReport, onRegisterStartCallback }: SpeechBlocksPanelProps) {
  const transcription  = useTranscription();
  const { mySocketId, lastTranscriptionBlock, lastLiveText, lastFloorEvent, emitToRoom } = useWebRTC();
  const { voiceFieldKey, isVoiceRecording, startVoice, stopVoice } = useVoiceInput();

  // Participant sélectionné dans la liste déroulante
  const [selectedSpeakerId,   setSelectedSpeakerId]   = useState('');
  const [selectedSpeakerName, setSelectedSpeakerName] = useState('');

  const [floorHolder,    setFloorHolder]    = useState<FloorHolder | null>(null);
  const [floorOfferName, setFloorOfferName] = useState('');
  const [liveText,       setLiveText]       = useState('');
  const [voiceError,     setVoiceError]     = useState<string | null>(null);
  const [editingIdx,     setEditingIdx]     = useState<number | null>(null);
  const [editText,       setEditText]       = useState('');

  const liveTextRef            = useRef('');
  const activeSpeakerRef       = useRef('');
  const activeSpeakerIdRef     = useRef('');
  const iAmRecordingRef        = useRef(false);
  const floorOfferNameRef      = useRef('');
  const selectedSpeakerNameRef = useRef('');
  const speakersRef            = useRef<Speaker[]>(speakers);
  const blocksEndRef           = useRef<HTMLDivElement>(null);

  const iAmRecording = isVoiceRecording && voiceFieldKey === 'speech_block';

  useEffect(() => { iAmRecordingRef.current        = iAmRecording;       }, [iAmRecording]);
  useEffect(() => { floorOfferNameRef.current      = floorOfferName;     }, [floorOfferName]);
  useEffect(() => { selectedSpeakerNameRef.current = selectedSpeakerName;}, [selectedSpeakerName]);
  useEffect(() => { speakersRef.current            = speakers;           }, [speakers]);

  // Initialiser la sélection dès que la liste est disponible, et la
  // re-synchroniser si l'id sélectionné devient invalide (ex: "local"
  // tant que mySocketId n'est pas encore connu, remplacé ensuite par
  // le vrai socketId — sinon le <select> pointe vers un id fantôme et
  // "Donner la parole" à soi-même ne fait plus rien).
  useEffect(() => {
    if (!speakers.length) return;
    const stillValid = speakers.some(s => s.id === selectedSpeakerId);
    if (!stillValid) {
      const first = speakers[0];
      setSelectedSpeakerId(first.id);
      setSelectedSpeakerName(first.name);
    }
  }, [speakers]);

  // ── meetingId → contexte ──
  useEffect(() => {
    if (meetingId) transcription.setMeetingId(meetingId);
  }, [meetingId]);

  // ── Chargement initial des blocs (PostgreSQL) ──
  useEffect(() => {
    if (!meetingId) return;
    const token = localStorage.getItem('onco_collab_token');
    fetch(createApiUrl(`/meetings/${meetingId}/transcription/blocks`), {
      headers: createAuthHeaders(token),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.blocks?.length > 0) {
          transcription.setInitialBlocks(
            data.blocks.map((b: any) => ({
              id: b.id,
              speakerName: b.speakerName || b.speaker_name || 'Inconnu',
              text: b.text,
              blockOrder: b.blockOrder ?? b.block_order ?? 0,
              timestampSeconds: b.timestampSeconds ?? b.timestamp_seconds,
              source: b.source || 'speechcore',
            }))
          );
        }
      })
      .catch(() => {});
  }, [meetingId]);

  // ── Bloc reçu depuis un autre participant (Socket.IO) ──
  useEffect(() => {
    if (!lastTranscriptionBlock) return;
    if (lastTranscriptionBlock.meetingId !== meetingId) return;
    const already = transcription.blocks.some(
      b => b.id === lastTranscriptionBlock.id ||
        (b.blockOrder === lastTranscriptionBlock.blockOrder && b.speakerName === lastTranscriptionBlock.speakerName)
    );
    if (!already) {
      transcription.setInitialBlocks([
        ...transcription.blocks,
        {
          id:               lastTranscriptionBlock.id,
          speakerName:      lastTranscriptionBlock.speakerName,
          text:             lastTranscriptionBlock.text,
          blockOrder:       lastTranscriptionBlock.blockOrder,
          timestampSeconds: lastTranscriptionBlock.timestampSeconds,
          source:           (lastTranscriptionBlock.source as any) || 'speechcore',
        },
      ]);
    }
  }, [lastTranscriptionBlock]);

  // ── Événements floor ──
  useEffect(() => {
    if (!lastFloorEvent) return;

    if (lastFloorEvent.type === 'given') {
      setFloorHolder({ socketId: lastFloorEvent.holderId, speakerName: lastFloorEvent.holderName || 'Inconnu' });

      if (lastFloorEvent.holderId === mySocketId && !iAmRecordingRef.current) {
        // Quelqu'un m'a donné la parole → mettre à jour la ref IMMÉDIATEMENT
        // (pas via state→useEffect pour éviter la race condition avec le bouton "Démarrer" du modal)
        const offerName = lastFloorEvent.holderName || 'Vous';
        floorOfferNameRef.current = offerName;
        setFloorOfferName(offerName);
      }

      if (lastFloorEvent.holderId !== mySocketId && iAmRecordingRef.current) {
        // Quelqu'un d'autre a pris la parole alors que j'enregistrais → sauvegarder et arrêter
        stopVoice();
        const text = liveTextRef.current.trim();
        const name = activeSpeakerRef.current;
        const speakerId = activeSpeakerIdRef.current || undefined;
        liveTextRef.current = '';
        setLiveText('');
        activeSpeakerIdRef.current = '';
        if (text && name) {
          transcription.saveBlock({
            speakerName: name, speakerId, text,
            blockOrder: transcription.blocks.length,
            timestampSeconds: Math.floor(Date.now() / 1000),
            source: 'speechcore',
          }).catch(console.error);
        }
      }
    } else {
      // floor-revoked → arrêter si je suis en train d'enregistrer, sinon juste reset
      setFloorHolder(null);
      floorOfferNameRef.current = '';
      setFloorOfferName('');
      if (iAmRecordingRef.current) {
        stopVoice();
        const text = liveTextRef.current.trim();
        const name = activeSpeakerRef.current;
        const speakerId = activeSpeakerIdRef.current || undefined;
        liveTextRef.current = '';
        setLiveText('');
        activeSpeakerRef.current = '';
        activeSpeakerIdRef.current = '';
        if (text && name) {
          transcription.saveBlock({
            speakerName: name, speakerId, text,
            blockOrder: transcription.blocks.length,
            timestampSeconds: Math.floor(Date.now() / 1000),
            source: 'speechcore',
          }).catch(console.error);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFloorEvent]);

  // ── Scroll auto ──
  useEffect(() => {
    blocksEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription.blocks.length, liveText]);

  // ──────────────────────────────────────────────────────────────────
  // Démarrer l'enregistrement — DOIT être dans un handler de clic (user gesture)
  // ──────────────────────────────────────────────────────────────────
  const startRecording = useCallback((speakerName: string, speakerId?: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError('Votre navigateur ne supporte pas la reconnaissance vocale (Chrome ou Safari requis).');
      return;
    }
    setVoiceError(null);
    activeSpeakerRef.current = speakerName;
    activeSpeakerIdRef.current = speakerId || '';
    liveTextRef.current = '';
    setLiveText('');
    transcription.setCurrentSpeaker(speakerName);
    startVoice('speech_block', '', (text) => {
      setLiveText(text);
      liveTextRef.current = text;
      emitToRoom('transcription:live', { roomId: meetingId, speakerName, text });
    });
  }, [startVoice, emitToRoom, meetingId, transcription]);

  // ── Expose startRecording au parent (pour le modal VideoConferenceAdvanced) ──
  // Utilise refs pour toujours avoir les valeurs fraîches sans re-register le callback
  useEffect(() => {
    if (!onRegisterStartCallback) return;
    onRegisterStartCallback(() => {
      // floorOfferName en priorité (donné par l'événement floor), sinon sélection courante
      const name = floorOfferNameRef.current || selectedSpeakerNameRef.current;
      // L'enregistrement démarre toujours pour SOI (le destinataire de la parole)
      const me = speakersRef.current.find(s => s.isCurrentUser);
      if (name) startRecording(name, me?.doctorId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterStartCallback]);

  // ── Donner la parole au participant sélectionné dans la liste déroulante ──
  // Si current user → enregistrement immédiat (user gesture ✓ depuis le clic bouton)
  // Sinon → floor-given → popup chez le destinataire → il clique "Démarrer"
  const handleGiveFloor = useCallback(() => {
    const speaker = speakers.find(s => s.id === selectedSpeakerId);
    if (!speaker) return;

    const name     = speaker.name;
    const holderId = speaker.id;

    emitToRoom('transcription:floor-given', {
      roomId:     meetingId,
      holderId,
      holderName: name,
      giverId:    mySocketId || 'local',
    });

    if (speaker.isCurrentUser) {
      setFloorHolder({ socketId: mySocketId || 'local', speakerName: name });
      startRecording(name, speaker.doctorId);
    }
  }, [speakers, selectedSpeakerId, mySocketId, emitToRoom, meetingId, startRecording]);

  // ── Arrêter la prise de parole ──
  const handleRevokeFloor = useCallback(async () => {
    stopVoice();
    const text = liveTextRef.current.trim();
    const name = activeSpeakerRef.current;
    const speakerId = activeSpeakerIdRef.current || undefined;
    liveTextRef.current = '';
    setLiveText('');
    setFloorHolder(null);
    activeSpeakerRef.current = '';
    activeSpeakerIdRef.current = '';

    emitToRoom('transcription:floor-revoked', { roomId: meetingId, holderId: mySocketId || '' });
    emitToRoom('transcription:live',          { roomId: meetingId, speakerName: name, text: '' });

    if (text) {
      await transcription.saveBlock({
        speakerName: name, speakerId, text,
        blockOrder: transcription.blocks.length,
        timestampSeconds: Math.floor(Date.now() / 1000),
        source: 'speechcore',
      }).catch(console.error);
    }
  }, [stopVoice, mySocketId, emitToRoom, meetingId, transcription]);

  const handleEditSave = () => {
    if (editingIdx !== null) { transcription.updateBlock(editingIdx, editText.trim()); setEditingIdx(null); }
  };

  const stats      = transcription.getBlockStats();
  const remoteLive = (!iAmRecording && lastLiveText?.text?.trim()) ? lastLiveText : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.bg, overflow: 'hidden' }}>

      {/* Bandeau "qui parle" */}
      {(floorHolder || iAmRecording) && (
        <div style={{
          padding: '7px 12px', flexShrink: 0,
          backgroundColor: iAmRecording ? 'rgba(34,197,94,0.12)' : 'rgba(168,85,247,0.12)',
          borderBottom: `1px solid ${iAmRecording ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.3)'}`,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: iAmRecording ? C.green : C.purple, animation: 'pulse 1s infinite', flexShrink: 0 }} />
          <span style={{ color: iAmRecording ? C.green : C.purple, fontSize: '12px', fontWeight: 700, flex: 1 }}>
            🎤 {iAmRecording
              ? `${activeSpeakerRef.current} — vous enregistrez`
              : `${floorHolder?.speakerName} parle...`}
          </span>
        </div>
      )}

      {/* Erreur navigateur */}
      {voiceError && (
        <div style={{ margin: '8px 12px 0', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '12px', flexShrink: 0 }}>
          ⚠️ {voiceError}
        </div>
      )}

      {/* ── Contrôles ── */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {iAmRecording ? (
          /* ─ État 1 : JE suis en train d'enregistrer ─ */
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.red, animation: 'pulse 0.8s infinite' }} />
              <span style={{ color: C.textWhite, fontSize: '13px', fontWeight: 600 }}>
                {activeSpeakerRef.current} — transcription active
              </span>
            </div>
            <button
              onClick={handleRevokeFloor}
              style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', backgroundColor: C.red, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, boxShadow: '0 0 0 3px rgba(239,68,68,0.3)' }}
            >
              <MicOff size={14} /> Arrêter
            </button>
          </div>
        ) : floorHolder ? (
          /* ─ État 2 : Quelqu'un d'autre parle — le modérateur peut forcer l'arrêt ─ */
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: C.purple, animation: 'pulse 1s infinite', flexShrink: 0 }} />
              <span style={{ color: C.purple, fontSize: '13px', fontWeight: 600 }}>
                {floorHolder.speakerName} parle...
              </span>
            </div>
            <button
              onClick={handleRevokeFloor}
              style={{ padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', backgroundColor: '#374151', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
              title="Mettre fin à la prise de parole (modérateur)"
            >
              <MicOff size={13} /> Mettre fin
            </button>
          </div>
        ) : (
          /* ─ État 3 : Personne ne parle — sélection + attribution ─ */
          <div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={selectedSpeakerId}
                onChange={e => {
                  const s = speakers.find(sp => sp.id === e.target.value);
                  if (s) { setSelectedSpeakerId(s.id); setSelectedSpeakerName(s.name); }
                }}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: '6px',
                  border: `1px solid ${C.border}`, backgroundColor: '#2a2a2a',
                  color: C.textWhite, fontSize: '13px', outline: 'none', cursor: 'pointer',
                }}
              >
                {speakers.length === 0 && <option value="">En attente de participants...</option>}
                {speakers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.isCurrentUser ? ' (vous)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGiveFloor}
                disabled={!selectedSpeakerId}
                style={{
                  padding: '8px 12px', border: 'none', borderRadius: '6px', flexShrink: 0,
                  cursor: selectedSpeakerId ? 'pointer' : 'not-allowed',
                  fontWeight: 700, fontSize: '12px',
                  backgroundColor: selectedSpeakerId ? C.green : '#374151',
                  color: '#fff', display: 'flex', alignItems: 'center', gap: '5px',
                  opacity: selectedSpeakerId ? 1 : 0.5,
                }}
              >
                <Mic size={13} /> Donner la parole
              </button>
            </div>

            {/* Stats */}
            <div style={{ marginTop: '8px', fontSize: '11px', color: C.textGrayDark, display: 'flex', gap: '12px' }}>
              <span><strong style={{ color: C.textGray }}>{stats.totalBlocks}</strong> bloc{stats.totalBlocks !== 1 ? 's' : ''}</span>
              <span><strong style={{ color: C.textGray }}>{stats.totalWords}</strong> mots</span>
              {stats.speakers.length > 0 && <span><strong style={{ color: C.textGray }}>{stats.speakers.length}</strong> interv.</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Blocs ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>

        {transcription.blocks.map((block, idx) => (
          <div key={`${idx}-${block.id}`}
            style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: C.bgCard, borderLeft: `3px solid ${C.blue}`, flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.bgCardHover; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.bgCard; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ color: C.blue, fontSize: '12px', fontWeight: 600 }}>{block.speakerName}</span>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {block.timestampSeconds && <span style={{ color: C.textGrayDark, fontSize: '10px', marginRight: '6px' }}>{fmtTs(block.timestampSeconds)}</span>}
                {editingIdx !== idx && (
                  <>
                    <button onClick={() => { setEditingIdx(idx); setEditText(block.text); }} style={{ background: 'none', border: 'none', color: C.textGray, cursor: 'pointer', padding: '2px 5px', borderRadius: '4px' }} title="Modifier"><Edit2 size={11} /></button>
                    <button onClick={() => transcription.deleteBlock(idx)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', padding: '2px 5px', borderRadius: '4px' }} title="Supprimer"><Trash2 size={11} /></button>
                  </>
                )}
              </div>
            </div>
            {editingIdx === idx ? (
              <div>
                <textarea value={editText} onChange={e => setEditText(e.target.value)} autoFocus rows={3}
                  style={{ width: '100%', padding: '7px', borderRadius: '5px', border: `1px solid ${C.borderLight}`, backgroundColor: C.bg, color: C.textWhite, fontSize: '13px', lineHeight: 1.5, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button onClick={handleEditSave} style={{ padding: '4px 12px', backgroundColor: C.blue, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> Valider</button>
                  <button onClick={() => setEditingIdx(null)} style={{ padding: '4px 10px', backgroundColor: '#333', color: C.textGray, border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={12} /> Annuler</button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: C.textWhite, fontSize: '13px', lineHeight: 1.6 }}>{block.text}</p>
            )}
          </div>
        ))}

        {/* Live — ce navigateur */}
        {iAmRecording && (
          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderLeft: '3px solid #22c55e', flexShrink: 0 }}>
            <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: C.green, animation: 'pulse 1s infinite' }} />
              <span style={{ color: C.green, fontSize: '12px', fontWeight: 600 }}>{activeSpeakerRef.current} — en cours</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: liveText ? C.textWhite : C.textGrayDark, fontStyle: liveText ? 'normal' : 'italic' }}>
              {liveText || 'Parlez maintenant...'}
            </p>
          </div>
        )}

        {/* Live — autre navigateur */}
        {remoteLive && (
          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderLeft: `3px solid ${C.purple}`, flexShrink: 0 }}>
            <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: C.purple, animation: 'pulse 1s infinite' }} />
              <span style={{ color: C.purple, fontSize: '12px', fontWeight: 600 }}>{remoteLive.speakerName}</span>
            </div>
            <p style={{ margin: 0, color: C.textWhite, fontSize: '13px', lineHeight: 1.6, fontStyle: 'italic' }}>{remoteLive.text}</p>
          </div>
        )}

        {transcription.blocks.length === 0 && !iAmRecording && !remoteLive && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textGrayDark, fontSize: '13px', textAlign: 'center', padding: '32px 16px', gap: '10px' }}>
            <Mic size={32} color={C.textGrayDark} />
            <span>Cliquez sur "Parole" pour<br />démarrer la transcription</span>
          </div>
        )}

        <div ref={blocksEndRef} />
      </div>

      {/* Rapport final */}
      {transcription.blocks.length > 0 && (
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onGenerateReport}
            style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: C.green, color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.greenDark; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.green; }}
          >
            <FileText size={15} /> Générer le rapport final
          </button>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}`}</style>
    </div>
  );
}

function fmtTs(s: number): string {
  return new Date(s * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
