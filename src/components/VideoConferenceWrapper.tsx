import { useState, useCallback, useEffect } from 'react';
import { PreMeetingSetup, MeetingSettings } from './PreMeetingSetup';
import { VideoConferenceAdvanced } from './VideoConferenceAdvanced';
import { User } from '../App';
import { API_CONFIG, createApiUrl, createAuthHeaders } from '../config/api.config';

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
  meetingTitle = "RCP",
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

  // Générer un roomId basé sur le titre de la réunion si non fourni
  const effectiveRoomId = roomId || meetingTitle.replace(/\s+/g, '-').toLowerCase();

  // Créer ou récupérer la room dans la base de données
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
        console.log('✅ Room créée/trouvée dans la DB:', room);
        setDbRoomId(room.roomId);
      } else {
        console.warn('⚠️ Impossible de créer la room en DB, utilisation du roomId local');
        setDbRoomId(effectiveRoomId);
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la création de la room:', error);
      // En cas d'erreur, on continue avec le roomId local
      setDbRoomId(effectiveRoomId);
    } finally {
      setIsCreatingRoom(false);
    }
  }, [effectiveRoomId, meetingTitle, authToken]);

  const handleJoinMeeting = useCallback(async (settings: MeetingSettings) => {
    // S'assurer que la room existe dans la DB avant de rejoindre
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
