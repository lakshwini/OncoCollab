import { useState, useCallback } from 'react';
import { PreMeetingSetup, MeetingSettings } from './PreMeetingSetup';
import { VideoConferenceAdvanced } from './VideoConferenceAdvanced';
import { User } from '../App';
import { createApiUrl, createAuthHeaders } from '../config/api.config';

interface VideoConferenceWrapperProps {
  onClose: () => void;
  patientName?: string;
  meetingTitle?: string;
  authToken?: string | null;
  roomId?: string;
  serverUrl?: string;
  currentUser?: User | null;
}

export function VideoConferenceWrapper({
  onClose,
  patientName,
  meetingTitle = 'RCP',
  authToken,
  roomId,
  serverUrl,
  currentUser,
}: VideoConferenceWrapperProps) {
  const [showPreMeeting, setShowPreMeeting] = useState(true);
  const [meetingSettings, setMeetingSettings] = useState<MeetingSettings | null>(null);
  const [dbRoomId, setDbRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // User info
  const userName = currentUser?.name || 'Docteur';
  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'DR';

  // Generer un roomId base sur le titre de la reunion si non fourni
  const effectiveRoomId = roomId || meetingTitle.replace(/\s+/g, '-').toLowerCase();

  // Creer ou recuperer la room dans la base de donnees
  const ensureRoomExists = useCallback(async () => {
    if (!effectiveRoomId) return;

    setIsCreatingRoom(true);
    try {
      const response = await fetch(createApiUrl('/rooms/find-or-create'), {
        method: 'POST',
        headers: createAuthHeaders(authToken || null),
        body: JSON.stringify({
          roomId: effectiveRoomId,
          name: meetingTitle,
        }),
      });

      if (response.ok) {
        const room = await response.json();
        console.log('Room creee/trouvee dans la DB:', room);
        setDbRoomId(room.roomId);
      } else {
        console.warn('Impossible de creer la room en DB, utilisation du roomId local');
        setDbRoomId(effectiveRoomId);
      }
    } catch (error) {
      console.warn('Erreur lors de la creation de la room:', error);
      setDbRoomId(effectiveRoomId);
    } finally {
      setIsCreatingRoom(false);
    }
  }, [effectiveRoomId, meetingTitle, authToken]);

  const handleJoinMeeting = useCallback(async (settings: MeetingSettings) => {
    await ensureRoomExists();
    setMeetingSettings(settings);
    setShowPreMeeting(false);
  }, [ensureRoomExists]);

  const handleLeaveMeeting = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCancelPreMeeting = useCallback(() => {
    onClose();
  }, [onClose]);

  if (showPreMeeting) {
    return (
      <PreMeetingSetup
        meetingTitle={meetingTitle}
        patientName={patientName}
        userName={userName}
        userInitials={userInitials}
        onJoin={handleJoinMeeting}
        onCancel={handleCancelPreMeeting}
      />
    );
  }

  return (
    <VideoConferenceAdvanced
      onClose={handleLeaveMeeting}
      patientName={patientName}
      meetingTitle={meetingTitle}
      authToken={authToken}
      roomId={dbRoomId || effectiveRoomId}
      serverUrl={serverUrl}
      currentUser={currentUser}
      initialSettings={meetingSettings || undefined}
    />
  );
}