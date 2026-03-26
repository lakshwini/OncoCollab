import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Volume2,
  Check,
  Phone,
  Speaker,
  X,
  ChevronDown,
  Camera,
  Headphones,
  Ban,
  Sparkles,
  Building2,
  Trees,
  Palette,
} from 'lucide-react';
import { useLanguage } from '../i18n';
import { useVideo } from '../contexts/VideoContext';

interface PreMeetingSetupProps {
  meetingTitle: string;
  patientName?: string;
  userName: string;
  userInitials: string;
  onJoin: (settings: MeetingSettings) => void;
  onCancel: () => void;
}

export interface MeetingSettings {
  micEnabled: boolean;
  videoEnabled: boolean;
  selectedMicrophone: string;
  selectedCamera: string;
  selectedSpeaker: string;
  backgroundEffect: BackgroundEffect;
  micVolume: number;
  audioMode: 'computer' | 'phone' | 'room' | 'none';
}

export type BackgroundEffect = 'none' | 'blur' | 'office' | 'nature' | 'abstract';

interface MediaDevice {
  deviceId: string;
  label: string;
}

type AudioMode = 'computer' | 'phone' | 'room' | 'none';

export function PreMeetingSetup({
  meetingTitle,
  patientName,
  userName,
  userInitials,
  onJoin,
  onCancel,
}: PreMeetingSetupProps) {
  const { language } = useLanguage();
  const {
    stream,
    isMicOn,
    isCameraOn,
    setMicOn,
    setCameraOn,
  } = useVideo();
  const [audioMode, setAudioMode] = useState<AudioMode>('computer');
  const [speakerVolume, setSpeakerVolume] = useState(75);
  const [backgroundEffect, setBackgroundEffect] = useState<BackgroundEffect>('none');
  const [showBackgrounds, setShowBackgrounds] = useState(false);

  // Device lists
  const [microphones, setMicrophones] = useState<MediaDevice[]>([]);
  const [cameras, setCameras] = useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = useState<MediaDevice[]>([]);

  // Selected devices
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');

  // Dropdown states
  const [showMicDropdown, setShowMicDropdown] = useState(false);
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastCameraRef = useRef<string | null>(null);
  const lastMicrophoneRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Initialize devices
  useEffect(() => {
    const initDevices = async () => {
      try {
        if (isCameraOn) {
          await setCameraOn(true);
        }
        if (isMicOn) {
          await setMicOn(true);
        }

        const devices = await navigator.mediaDevices.enumerateDevices();

        const mics = devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}` }));
        setMicrophones(mics);
        if (mics.length > 0) setSelectedMicrophone(mics[0].deviceId);

        const cams = devices
          .filter(d => d.kind === 'videoinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 8)}` }));
        setCameras(cams);
        if (cams.length > 0) setSelectedCamera(cams[0].deviceId);

        const spks = devices
          .filter(d => d.kind === 'audiooutput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 8)}` }));
        setSpeakers(spks);
        if (spks.length > 0) setSelectedSpeaker(spks[0].deviceId);

        setIsLoading(false);
        setPermissionError(null);
      } catch (err: any) {
        console.error('Error accessing devices:', err);
        setIsLoading(false);
        if (err.name === 'NotAllowedError') {
          setPermissionError(language === 'fr'
            ? "Acces aux peripheriques refuse. Veuillez autoriser l'acces a la camera et au microphone."
            : 'Device access denied. Please allow camera and microphone access.');
        } else {
          setPermissionError(err.message);
        }
      }
    };

    initDevices();
  }, [language, isCameraOn, isMicOn, setCameraOn, setMicOn]);

  useEffect(() => {
    if (!selectedMicrophone) {
      return;
    }

    const shouldForce = selectedMicrophone !== lastMicrophoneRef.current;
    lastMicrophoneRef.current = selectedMicrophone;
    if (isMicOn) {
      setMicOn(true, selectedMicrophone);
    }
  }, [selectedMicrophone, isMicOn, setMicOn]);

  // Video preview - attach shared stream to video element
  // ✅ Ne PAS appeler setCameraOn ici — le toggle et le changement de device sont gérés séparément
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = isCameraOn && stream ? stream : null;
    }
  }, [isCameraOn, stream]);

  // Changement de caméra via dropdown uniquement
  useEffect(() => {
    if (!selectedCamera || selectedCamera === lastCameraRef.current) return;
    lastCameraRef.current = selectedCamera;
    if (isCameraOn) {
      setCameraOn(true, selectedCamera);
    }
  }, [selectedCamera, isCameraOn, setCameraOn]);

  // Canvas-based background effect rendering
  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current);

    if (!isCameraOn || !stream || backgroundEffect === 'none') {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgGradients: Record<string, string[]> = {
      office: ['#1e3a5f', '#2563eb', '#1e40af'],
      nature: ['#064e3b', '#16a34a', '#15803d'],
      abstract: ['#7c2d12', '#f97316', '#ea580c'],
    };

    const drawFrame = () => {
      if (!video || video.videoWidth === 0) {
        animFrameRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      if (backgroundEffect === 'blur') {
        ctx.filter = 'blur(14px)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';

        const cx = canvas.width / 2;
        const cy = canvas.height * 0.45;
        const rx = canvas.width * 0.30;
        const ry = canvas.height * 0.48;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else if (bgGradients[backgroundEffect]) {
        const colors = bgGradients[backgroundEffect];

        ctx.restore();
        ctx.save();
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.5, colors[1]);
        grad.addColorStop(1, colors[2]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.45;
        const rx = canvas.width * 0.30;
        const ry = canvas.height * 0.48;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.filter = 'blur(6px)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        ctx.filter = 'none';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.88, ry * 0.88, 0, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(drawFrame);
    };

    animFrameRef.current = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [backgroundEffect, isCameraOn, stream]);

  // Audio level monitoring - using RMS
  useEffect(() => {
    if (!isMicOn || audioMode !== 'computer' || !stream) {
      setAudioLevel(0);
      return;
    }

    let animationId: number;
    let audioCtx: AudioContext | null = null;
    let isMounted = true;

    const startAudio = async () => {
      try {
        audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.3;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);

        const update = () => {
          if (!isMounted) return;

          analyser.getFloatTimeDomainData(dataArray);

          let sumSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            sumSquares += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sumSquares / bufferLength);
          const level = Math.min(100, rms * 300);
          setAudioLevel(level);

          animationId = requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.error('Audio error:', err);
      }
    };

    startAudio();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      if (audioCtx) audioCtx.close();
    };
  }, [isMicOn, audioMode, stream]);

  const handleJoin = () => {
    onJoin({
      micEnabled: audioMode === 'computer' ? isMicOn : false,
      videoEnabled: isCameraOn,
      selectedMicrophone,
      selectedCamera,
      selectedSpeaker,
      backgroundEffect,
      micVolume: speakerVolume,
      audioMode,
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMicDropdown(false);
      setShowCameraDropdown(false);
      setShowSpeakerDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const t = {
    title: language === 'fr' ? 'Choisissez vos options video et audio' : 'Choose your video and audio options',
    meetingInfo: language === 'fr' ? 'Reunion' : 'Meeting',
    cameraOff: language === 'fr' ? 'Votre camera est desactivee' : 'Your camera is turned off',
    computerAudio: language === 'fr' ? "Audio de l'ordinateur" : 'Computer audio',
    phoneAudio: language === 'fr' ? 'Audio du telephone' : 'Phone audio',
    roomAudio: language === 'fr' ? 'Audio de la salle' : 'Room audio',
    noAudio: language === 'fr' ? "Ne pas utiliser l'audio" : "Don't use audio",
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    joinNow: language === 'fr' ? 'Rejoindre maintenant' : 'Join now',
    backgroundFilters: language === 'fr' ? 'Effets et arriere-plans' : 'Effects and backgrounds',
    microphone: language === 'fr' ? 'Microphone' : 'Microphone',
    camera: language === 'fr' ? 'Camera' : 'Camera',
    speaker: language === 'fr' ? 'Haut-parleur' : 'Speaker',
    noDevices: language === 'fr' ? 'Aucun peripherique trouve' : 'No devices found',
    micLevel: language === 'fr' ? 'Niveau du microphone' : 'Microphone level',
    goodSignal: language === 'fr' ? 'Bon signal' : 'Good signal',
    speaking: language === 'fr' ? 'Parole detectee' : 'Speaking detected',
    bgNone: language === 'fr' ? 'Aucun' : 'None',
    bgBlur: language === 'fr' ? 'Flou' : 'Blur',
    bgOffice: language === 'fr' ? 'Bureau' : 'Office',
    bgNature: language === 'fr' ? 'Nature' : 'Nature',
    bgAbstract: language === 'fr' ? 'Abstrait' : 'Abstract',
  };

  // Background options
  const backgroundOptions: { id: BackgroundEffect; label: string; icon: any; color: string; gradient: string }[] = [
    { id: 'none', label: t.bgNone, icon: Ban, color: '#6b7280', gradient: 'transparent' },
    { id: 'blur', label: t.bgBlur, icon: Sparkles, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { id: 'office', label: t.bgOffice, icon: Building2, color: '#3b82f6', gradient: 'linear-gradient(135deg, #2563eb, #1e40af)' },
    { id: 'nature', label: t.bgNature, icon: Trees, color: '#22c55e', gradient: 'linear-gradient(135deg, #16a34a, #15803d)' },
    { id: 'abstract', label: t.bgAbstract, icon: Palette, color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
  ];

  // Device dropdown component
  const DeviceDropdown = ({
    label,
    icon: Icon,
    devices,
    selectedDevice,
    onSelect,
    isOpen,
    onToggle
  }: {
    label: string;
    icon: any;
    devices: MediaDevice[];
    selectedDevice: string;
    onSelect: (deviceId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
  }) => {
    const selectedLabel = devices.find(d => d.deviceId === selectedDevice)?.label || label;

    return (
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onToggle}
          style={{
            width: '100%',
            backgroundColor: '#3d3d3d',
            padding: '10px 14px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4d4d4d')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3d3d3d')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon size={16} color="#9ca3af" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#9ca3af', fontSize: '10px', marginBottom: '1px' }}>{label}</div>
              <div style={{ color: 'white', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedLabel}
              </div>
            </div>
          </div>
          <ChevronDown size={14} color="#9ca3af" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#2d2d2d',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            zIndex: 100,
            overflow: 'hidden',
          }}>
            {devices.length === 0 ? (
              <div style={{ padding: '10px 14px', color: '#9ca3af', fontSize: '12px' }}>
                {t.noDevices}
              </div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => { onSelect(device.deviceId); onToggle(); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: selectedDevice === device.deviceId ? '#464775' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (selectedDevice !== device.deviceId) e.currentTarget.style.backgroundColor = '#3d3d3d';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = selectedDevice === device.deviceId ? '#464775' : 'transparent';
                  }}
                >
                  <span style={{ color: 'white', fontSize: '12px', maxWidth: '230px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {device.label}
                  </span>
                  {selectedDevice === device.deviceId && <Check size={14} color="#5b5fc7" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Audio level bar segments for visual indicator
  const AudioLevelBars = () => {
    const bars = 20;
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '24px', marginTop: '12px' }}>
        {Array.from({ length: bars }).map((_, i) => {
          const threshold = (i / bars) * 100;
          const isActive = audioLevel > threshold;
          let color = '#3d3d3d';
          if (isActive) {
            if (threshold < 40) color = '#22c55e';
            else if (threshold < 70) color = '#eab308';
            else color = '#ef4444';
          }
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${40 + (i / bars) * 60}%`,
                backgroundColor: color,
                borderRadius: '2px',
                transition: 'background-color 0.08s',
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#1f1f1f',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid #3d3d3d',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px',
            backgroundColor: '#5b5fc7', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Video size={16} color="white" />
          </div>
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>OncoCollab</span>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>{meetingTitle}</div>
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px', overflow: 'auto',
      }}>
        {permissionError && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '8px', padding: '16px', marginBottom: '24px',
            maxWidth: '500px', textAlign: 'center',
          }}>
            <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>{permissionError}</p>
          </div>
        )}

        <h1 style={{ color: 'white', fontSize: '20px', marginBottom: '6px', fontWeight: 400 }}>
          {t.title}
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '28px' }}>
          {patientName && `${t.meetingInfo}: ${patientName}`}
        </p>

        <div style={{
          display: 'flex', gap: '32px', maxWidth: '1000px', width: '100%',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {/* LEFT COLUMN: Video Preview + Backgrounds */}
          <div style={{ flex: '1 1 440px', minWidth: '320px' }}>
            {/* Video preview */}
            <div style={{
              backgroundColor: '#292929', borderRadius: '12px',
              aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
              border: '2px solid #3d3d3d',
            }}>
              {isCameraOn && stream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay muted playsInline
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      transform: 'scaleX(-1)',
                      position: backgroundEffect !== 'none' ? 'absolute' : 'relative',
                      opacity: backgroundEffect !== 'none' ? 0 : 1,
                      pointerEvents: backgroundEffect !== 'none' ? 'none' : 'auto',
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      display: backgroundEffect !== 'none' ? 'block' : 'none',
                    }}
                  />
                  {backgroundEffect !== 'none' && (
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '6px',
                      padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <Sparkles size={12} color="#a78bfa" />
                      <span style={{ color: '#a78bfa', fontSize: '11px' }}>
                        {backgroundOptions.find(b => b.id === backgroundEffect)?.label}
                      </span>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: '10px', left: '10px',
                    backgroundColor: 'rgba(0,0,0,0.6)', padding: '5px 10px',
                    borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <div style={{ width: '7px', height: '7px', backgroundColor: '#22c55e', borderRadius: '50%' }} />
                    <span style={{ color: 'white', fontSize: '12px' }}>{userName}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    backgroundColor: '#5b5fc7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '12px',
                  }}>
                    <span style={{ color: 'white', fontSize: '24px', fontWeight: 500 }}>{userInitials}</span>
                  </div>
                  <VideoOff size={28} color="#6b7280" />
                  <p style={{ color: '#9ca3af', marginTop: '10px', fontSize: '13px' }}>{t.cameraOff}</p>
                </div>
              )}
            </div>

            {/* Video controls */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '12px', marginTop: '12px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: '#292929', padding: '6px 14px', borderRadius: '8px',
              }}>
                <VideoOff size={18} color={isCameraOn ? '#6b7280' : 'white'} />
                <button
                  onClick={() => setCameraOn(!isCameraOn)}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px',
                    backgroundColor: isCameraOn ? '#5b5fc7' : '#4b5563',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white',
                    position: 'absolute', top: '2px',
                    left: isCameraOn ? '20px' : '2px', transition: 'left 0.2s',
                  }} />
                </button>
                <Video size={18} color={isCameraOn ? 'white' : '#6b7280'} />
              </div>
            </div>

            {/* Background effects section */}
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => setShowBackgrounds(!showBackgrounds)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer',
                  backgroundColor: showBackgrounds ? '#464775' : '#292929',
                  color: showBackgrounds ? 'white' : '#9ca3af',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} />
                  <span style={{ fontSize: '13px' }}>{t.backgroundFilters}</span>
                </div>
                <ChevronDown size={14} style={{ transform: showBackgrounds ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {showBackgrounds && (
                <div style={{
                  display: 'flex', gap: '8px', marginTop: '10px',
                  flexWrap: 'wrap',
                }}>
                  {backgroundOptions.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setBackgroundEffect(bg.id)}
                      style={{
                        width: '72px', height: '72px', borderRadius: '10px',
                        border: backgroundEffect === bg.id ? '2px solid #5b5fc7' : '2px solid transparent',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '4px',
                        background: bg.id === 'none' ? '#292929' : bg.gradient,
                        transition: 'all 0.2s', position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {backgroundEffect === bg.id && (
                        <div style={{
                          position: 'absolute', top: '4px', right: '4px',
                          width: '16px', height: '16px', borderRadius: '50%',
                          backgroundColor: '#5b5fc7', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Check size={10} color="white" />
                        </div>
                      )}
                      <bg.icon size={20} color="white" />
                      <span style={{ color: 'white', fontSize: '9px', fontWeight: 500 }}>{bg.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Camera Selection */}
            <div style={{ marginTop: '12px' }}>
              <DeviceDropdown
                label={t.camera}
                icon={Camera}
                devices={cameras}
                selectedDevice={selectedCamera}
                onSelect={setSelectedCamera}
                isOpen={showCameraDropdown}
                onToggle={() => {
                  setShowCameraDropdown(!showCameraDropdown);
                  setShowMicDropdown(false);
                  setShowSpeakerDropdown(false);
                }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Audio Options */}
          <div style={{ flex: '1 1 380px', minWidth: '300px' }}>
            {[
              { id: 'computer' as AudioMode, label: t.computerAudio, icon: <Monitor size={18} />, desc: language === 'fr' ? 'Micro pc et haut-parleurs' : 'PC mic and speakers' },
              { id: 'phone' as AudioMode, label: t.phoneAudio, icon: <Phone size={18} />, desc: language === 'fr' ? "Utiliser le telephone pour l'audio" : 'Use phone for audio' },
              { id: 'room' as AudioMode, label: t.roomAudio, icon: <Speaker size={18} />, desc: language === 'fr' ? 'Peripherique de salle' : 'Room device' },
              { id: 'none' as AudioMode, label: t.noAudio, icon: <MicOff size={18} />, desc: language === 'fr' ? 'Rejoindre sans audio' : 'Join without audio' },
            ].map((option) => (
              <div
                key={option.id}
                onClick={() => setAudioMode(option.id)}
                style={{
                  padding: '14px 16px', marginBottom: '6px', borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: audioMode === option.id ? '#464775' : '#292929',
                  border: audioMode === option.id ? '2px solid #5b5fc7' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: audioMode === option.id ? 'white' : '#9ca3af' }}>{option.icon}</span>
                    <div>
                      <span style={{ color: audioMode === option.id ? 'white' : '#d1d5db', fontWeight: 500, fontSize: '14px' }}>
                        {option.label}
                      </span>
                      {audioMode === option.id && (
                        <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>{option.desc}</div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    border: `2px solid ${audioMode === option.id ? '#5b5fc7' : '#6b7280'}`,
                    backgroundColor: audioMode === option.id ? '#5b5fc7' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {audioMode === option.id && <Check size={12} color="white" />}
                  </div>
                </div>

                {/* Expanded controls for computer audio */}
                {option.id === 'computer' && audioMode === 'computer' && (
                  <div style={{ marginTop: '14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ marginBottom: '10px' }}>
                      <DeviceDropdown
                        label={t.microphone} icon={Mic}
                        devices={microphones} selectedDevice={selectedMicrophone}
                        onSelect={setSelectedMicrophone} isOpen={showMicDropdown}
                        onToggle={() => { setShowMicDropdown(!showMicDropdown); setShowCameraDropdown(false); setShowSpeakerDropdown(false); }}
                      />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <DeviceDropdown
                        label={t.speaker} icon={Headphones}
                        devices={speakers} selectedDevice={selectedSpeaker}
                        onSelect={setSelectedSpeaker} isOpen={showSpeakerDropdown}
                        onToggle={() => { setShowSpeakerDropdown(!showSpeakerDropdown); setShowMicDropdown(false); setShowCameraDropdown(false); }}
                      />
                    </div>

                    {/* Mic toggle + volume */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                      <button
                        onClick={() => setMicOn(!isMicOn)}
                        style={{
                          padding: '7px', borderRadius: '8px', border: 'none',
                          backgroundColor: isMicOn ? '#3d3d3d' : 'rgba(239, 68, 68, 0.2)',
                          color: isMicOn ? 'white' : '#ef4444', cursor: 'pointer',
                        }}
                      >
                        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>

                      <button
                        onClick={() => setMicOn(!isMicOn)}
                        style={{
                          width: '40px', height: '22px', borderRadius: '11px',
                          backgroundColor: isMicOn ? '#5b5fc7' : '#4b5563',
                          border: 'none', cursor: 'pointer', position: 'relative',
                        }}
                      >
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          backgroundColor: 'white', position: 'absolute', top: '2px',
                          left: isMicOn ? '20px' : '2px', transition: 'left 0.2s',
                        }} />
                      </button>

                      <Volume2 size={18} color="#9ca3af" />

                      <input
                        type="range" min="0" max="100"
                        value={speakerVolume}
                        onChange={e => setSpeakerVolume(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#5b5fc7', height: '4px' }}
                      />
                      <span style={{ color: '#9ca3af', fontSize: '11px', minWidth: '28px' }}>{speakerVolume}%</span>
                    </div>

                    {/* Audio level indicator */}
                    {isMicOn && (
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#9ca3af', fontSize: '11px' }}>{t.micLevel}</span>
                          <span style={{
                            color: audioLevel > 15 ? '#22c55e' : '#9ca3af',
                            fontSize: '11px', fontWeight: audioLevel > 15 ? 500 : 400,
                          }}>
                            {audioLevel > 40 ? t.speaking : audioLevel > 15 ? t.goodSignal : ''}
                          </span>
                        </div>
                        <AudioLevelBars />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '16px',
        padding: '20px 24px', borderTop: '1px solid #3d3d3d',
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: '11px 36px', borderRadius: '6px',
            border: '1px solid #6b7280', backgroundColor: 'transparent',
            color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3d3d3d'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {t.cancel}
        </button>
        <button
          onClick={handleJoin}
          disabled={isLoading}
          style={{
            padding: '11px 36px', borderRadius: '6px',
            border: 'none',
            backgroundColor: isLoading ? '#4b5563' : '#5b5fc7',
            color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: 500, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#4f52b8'; }}
          onMouseLeave={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#5b5fc7'; }}
        >
          {isLoading
            ? (language === 'fr' ? 'Chargement...' : 'Loading...')
            : t.joinNow}
        </button>
      </div>
    </div>
  );
}