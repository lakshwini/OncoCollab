/**
 * VideoConferenceWithTranscription
 * Wrapper autour de VideoConferenceAdvanced qui ajoute le TranscriptionProvider
 * et intègre le TranscriptionDisplay dans la visio
 */

import { useState, useEffect } from 'react';
import { User } from '../App';
import { TranscriptionProvider, useTranscription } from '../contexts/TranscriptionContext';
import { VideoConferenceAdvanced } from './VideoConferenceAdvanced';
import { TranscriptionDisplay } from './TranscriptionDisplay';

interface VideoConferenceWithTranscriptionProps {
  onClose: () => void;
  patientName?: string;
  meetingTitle?: string;
  meetingId?: string;
  authToken?: string | null;
  roomId?: string;
  serverUrl?: string;
  currentUser?: User | null;
  initialSettings?: any;
  showTranscription?: boolean;
}

/**
 * Composant interne qui utilise le context
 */
function VideoConferenceContent({
  onClose,
  patientName,
  meetingTitle = 'RCP',
  meetingId,
  authToken,
  roomId,
  serverUrl,
  currentUser,
  initialSettings,
  showTranscription = true,
}: VideoConferenceWithTranscriptionProps) {
  const transcription = useTranscription();
  const [showTranscriptionPanel, setShowTranscriptionPanel] = useState(showTranscription);

  // Initialiser le meeting ID dans le context
  useEffect(() => {
    if (meetingId) {
      transcription.setMeetingId(meetingId);
    }
  }, [meetingId]);

  return (
    <div style={{ display: 'flex', height: '100%', gap: '12px' }}>
      {/* VideoConference */}
      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        <VideoConferenceAdvanced
          onClose={onClose}
          patientName={patientName}
          meetingTitle={meetingTitle}
          authToken={authToken}
          roomId={roomId}
          serverUrl={serverUrl}
          currentUser={currentUser}
          initialSettings={initialSettings}
        />
      </div>

      {/* Transcription Panel */}
      {showTranscriptionPanel && (
        <div
          style={{
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <TranscriptionDisplay
            meetingTitle={meetingTitle}
            engine="whisper"
            onTranscriptionUpdate={(text) => {
              console.log('[VideoConferenceWithTranscription] Transcription mise à jour');
            }}
          />
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setShowTranscriptionPanel(!showTranscriptionPanel)}
        style={{
          position: 'absolute',
          right: '16px',
          top: '100px',
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          zIndex: 1000,
        }}
        title={showTranscriptionPanel ? 'Masquer transcription' : 'Afficher transcription'}
      >
        {showTranscriptionPanel ? '◀' : '▶'}
      </button>
    </div>
  );
}

/**
 * Composant wrapper avec TranscriptionProvider
 */
export function VideoConferenceWithTranscription(props: VideoConferenceWithTranscriptionProps) {
  return (
    <TranscriptionProvider>
      <VideoConferenceContent {...props} />
    </TranscriptionProvider>
  );
}
