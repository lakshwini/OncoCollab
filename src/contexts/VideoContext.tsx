import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface VideoContextType {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isInMeeting: boolean;
  setCameraOn: (enabled: boolean, deviceId?: string) => Promise<void>;
  setMicOn: (enabled: boolean, deviceId?: string) => Promise<void>;
  replaceVideoTrack: (newTrack: MediaStreamTrack) => void;
  setInMeeting: (inMeeting: boolean) => void;
  stopAllMedia: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

const buildVideoConstraints = (deviceId?: string) => {
  if (deviceId) {
    return { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } };
  }
  return { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };
};

const buildAudioConstraints = (deviceId?: string) => {
  if (deviceId) {
    return {
      deviceId: { exact: deviceId },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };
  }
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
};

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [preferredCameraId, setPreferredCameraId] = useState<string | undefined>(undefined);
  const [preferredMicId, setPreferredMicId] = useState<string | undefined>(undefined);

  const setStreamSafe = useCallback((next: MediaStream | null, reason: string) => {
    streamRef.current = next;
    setStream(next);
    if (next) {
      console.log(`[Video] ✅ Stream actif (${reason}) - tracks=${next.getTracks().length}`);
    } else {
      console.log(`[Video] 🧹 Stream nettoye (${reason})`);
    }
  }, []);

  const setCameraOn = useCallback(async (enabled: boolean, deviceId?: string) => {
    console.log(`[Video] 📹 ========== setCameraOn(${enabled}) APPELÉ ==========`);
    // ⭐ SMART: Créer le stream SI NÉCESSAIRE, sinon juste update l'état
    const current = streamRef.current;
    console.log('[Video] 📹 Stream actuel:', current ? 'EXISTS' : 'NULL');
    
    if (enabled) {
      // ❌ PAS de stream? Créer un nouveau
      if (!current) {
        try {
          console.log('[Video] 📹 Pas de stream → création stream initial');
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: buildVideoConstraints(deviceId),
            audio: buildAudioConstraints(preferredMicId),
          });
          setStreamSafe(newStream, 'camera-on-init');
          setIsCameraOn(true);
          if (deviceId) setPreferredCameraId(deviceId);
          console.log('[Video] ✅ Stream créé et caméra activée');
          return;
        } catch (error) {
          console.error('[Video] ❌ Erreur création stream caméra:', error);
          setIsCameraOn(false);
          return;
        }
      }
      
      // 🎥 CAMERA ON avec deviceId → vérifier si même device avant de recréer
      if (deviceId && current) {
        // ✅ Vérifier si le device est le même — pas besoin de recréer
        const existingTrack = current.getVideoTracks()[0];
        if (existingTrack && existingTrack.readyState !== 'ended') {
          const currentDeviceId = existingTrack.getSettings().deviceId;
          if (currentDeviceId === deviceId) {
            // Même device — juste réactiver la track
            existingTrack.enabled = true;
            setIsCameraOn(true);
            setPreferredCameraId(deviceId);
            console.log('[Video] ✅ Même caméra — track.enabled = true (pas de recréation)');
            return;
          }
        }

        // Device différent — recréer la track
        try {
          console.log('[Video] 📹 Changement caméra vers:', deviceId);
          const videoTrack = await navigator.mediaDevices.getUserMedia({
            video: buildVideoConstraints(deviceId),
          });
          const newVideoTrack = videoTrack.getVideoTracks()[0];

          // Arrêter l'ancienne track video
          const oldVideoTracks = current.getVideoTracks();
          oldVideoTracks.forEach(track => {
            try {
              track.stop();
              console.log('[Video] 📹 Ancienne track vidéo arrêtée');
            } catch (e) {}
          });

          // Créer le nouveau stream avec l'audio existant et la nouvelle vidéo
          const audioTracks = current.getAudioTracks();
          const mergedStream = new MediaStream([...audioTracks, newVideoTrack]);
          setStreamSafe(mergedStream, 'camera-device-change');
          setPreferredCameraId(deviceId);
          console.log('[Video] ✅ Track caméra remplacée avec succès');
          return;
        } catch (error) {
          console.error('[Video] ❌ Erreur changement caméra:', error);
        }
      }
      
      // ✅ Stream existe + caméra disabled? Re-enable la track
      const videoTrack = current.getVideoTracks()[0];
      console.log('[Video] 📹 VideoTrack trouvé:', !!videoTrack);
      if (videoTrack) {
        console.log('[Video] 📹 Activation track existant');
        videoTrack.enabled = true;
      }
      setIsCameraOn(true);
      console.log('[Video] ✅ Caméra activée (track.enabled = true)');
    } else {
      // Désactiver: trouver la track et la disable
      if (current) {
        const videoTrack = current.getVideoTracks()[0];
        console.log('[Video] 📹 VideoTrack trouvé:', !!videoTrack);
        if (videoTrack) {
          console.log('[Video] 📹 Désactivation track');
          videoTrack.enabled = false;
        }
      }
      setIsCameraOn(false);
      console.log('[Video] ✅ Caméra désactivée (track.enabled = false)');
    }
  }, [preferredMicId, setStreamSafe, setPreferredCameraId]);

  const setMicOn = useCallback(async (enabled: boolean, deviceId?: string) => {
    console.log(`[Video] 🎤 ========== setMicOn(${enabled}) APPELÉ ==========`);
    // ⭐ SMART: Créer le stream SI NÉCESSAIRE, sinon juste update l'état
    const current = streamRef.current;
    console.log('[Video] 🎤 Stream actuel:', current ? 'EXISTS' : 'NULL');
    
    if (enabled) {
      // ❌ PAS de stream? Créer un nouveau
      if (!current) {
        try {
          console.log('[Video] 🎤 Pas de stream → création stream initial');
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: buildAudioConstraints(deviceId),
            video: buildVideoConstraints(preferredCameraId),
          });
          setStreamSafe(newStream, 'mic-on-init');
          setIsMicOn(true);
          if (deviceId) setPreferredMicId(deviceId);
          console.log('[Video] ✅ Stream créé et micro activé');
          return;
        } catch (error) {
          console.error('[Video] ❌ Erreur création stream micro:', error);
          setIsMicOn(false);
          return;
        }
      }
      
      // 🎤 MIC ON avec deviceId → vérifier si même device avant de recréer
      if (deviceId && current) {
        // ✅ Vérifier si le device est le même — pas besoin de recréer
        const existingTrack = current.getAudioTracks()[0];
        if (existingTrack && existingTrack.readyState !== 'ended') {
          const currentDeviceId = existingTrack.getSettings().deviceId;
          if (currentDeviceId === deviceId) {
            // Même micro — juste réactiver la track
            existingTrack.enabled = true;
            setIsMicOn(true);
            setPreferredMicId(deviceId);
            console.log('[Video] ✅ Même micro — track.enabled = true (pas de recréation)');
            return;
          }
        }

        // Device différent — recréer la track
        try {
          console.log('[Video] 🎤 Changement microphone vers:', deviceId);
          const audioTrack = await navigator.mediaDevices.getUserMedia({
            audio: buildAudioConstraints(deviceId),
          });
          const newAudioTrack = audioTrack.getAudioTracks()[0];

          // Arrêter l'ancienne track audio
          const oldAudioTracks = current.getAudioTracks();
          oldAudioTracks.forEach(track => {
            try {
              track.stop();
              console.log('[Video] 🎤 Ancienne track audio arrêtée');
            } catch (e) {}
          });

          // Créer le nouveau stream avec la vidéo existante et le nouvel audio
          const videoTracks = current.getVideoTracks();
          const mergedStream = new MediaStream([newAudioTrack, ...videoTracks]);
          setStreamSafe(mergedStream, 'mic-device-change');
          setPreferredMicId(deviceId);
          console.log('[Video] ✅ Track micro remplacée avec succès');
          return;
        } catch (error) {
          console.error('[Video] ❌ Erreur changement microphone:', error);
        }
      }
      
      // ✅ Stream existe + micro disabled? Re-enable la track
      const audioTrack = current.getAudioTracks()[0];
      console.log('[Video] 🎤 AudioTrack trouvé:', !!audioTrack);
      if (audioTrack) {
        console.log('[Video] 🎤 Activation track existant');
        audioTrack.enabled = true;
      }
      setIsMicOn(true);
      console.log('[Video] ✅ Micro activé (track.enabled = true)');
    } else {
      // Désactiver: trouver la track et la disable
      if (current) {
        const audioTrack = current.getAudioTracks()[0];
        console.log('[Video] 🎤 AudioTrack trouvé:', !!audioTrack);
        if (audioTrack) {
          console.log('[Video] 🎤 Désactivation track');
          audioTrack.enabled = false;
        }
      }
      setIsMicOn(false);
      console.log('[Video] ✅ Micro désactivé (track.enabled = false)');
    }
  }, [preferredCameraId, setStreamSafe, setPreferredMicId]);

  const replaceVideoTrack = useCallback((newTrack: MediaStreamTrack) => {
    if (!newTrack) return;

    const current = streamRef.current;
    const audioTracks = current ? current.getAudioTracks() : [];
    const oldVideoTracks = current ? current.getVideoTracks() : [];

    oldVideoTracks.forEach(track => {
      if (track !== newTrack) {
        try {
          track.stop();
        } catch (e) {}
      }
    });

    const updatedStream = new MediaStream([...audioTracks, newTrack]);
    setStreamSafe(updatedStream, 'replace-video');
    if (!isCameraOn) {
      console.log('[Video] 📹 Track remplacee (camera off)');
    }
  }, [isCameraOn, setStreamSafe]);

  const stopAllMedia = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
    }
    setStreamSafe(null, 'stop-all');
    setIsCameraOn(false);
    setIsMicOn(false);
  }, [setStreamSafe]);

  const value = useMemo<VideoContextType>(() => ({
    stream,
    isCameraOn,
    isMicOn,
    isInMeeting,
    setCameraOn,
    setMicOn,
    replaceVideoTrack,
    setInMeeting: setIsInMeeting,
    stopAllMedia,
  }), [stream, isCameraOn, isMicOn, isInMeeting, setCameraOn, setMicOn, replaceVideoTrack, stopAllMedia]);

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within VideoProvider');
  }
  return context;
}
