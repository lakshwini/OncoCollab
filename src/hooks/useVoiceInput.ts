import { useState, useRef, useCallback } from 'react';

export function useVoiceInput() {
  const [voiceFieldKey, setVoiceFieldKey] = useState<string | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  /**
   * Dictée continue.
   * Auto-restart sur silence (Web Speech API coupe après quelques secondes de silence
   * même en mode continuous — on redémarre si le stop n'est pas intentionnel).
   */
  const startVoice = useCallback((
    fieldKey: string,
    initialValue: string,
    onUpdate: (text: string) => void,
  ) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('[useVoiceInput] Web Speech API non disponible (utilisez Chrome ou Safari)');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';
    recognitionRef.current = recognition;

    let accumulated = initialValue;

    recognition.onresult = (event: any) => {
      let newFinal = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) newFinal += t;
        else interim += t;
      }
      if (newFinal) accumulated = (accumulated + (accumulated ? ' ' : '') + newFinal).trim();
      const display = (accumulated + (interim ? (accumulated ? ' ' : '') + interim : '')).trim();
      onUpdate(display);
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'aborted') return;
      // no-speech = silence trop long → redémarrer
      if (e.error === 'no-speech' && recognitionRef.current === recognition) {
        try { recognition.start(); return; } catch {}
      }
      console.warn('[useVoiceInput] error:', e.error);
      setIsVoiceRecording(false);
      setVoiceFieldKey(null);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      // Si recognitionRef pointe encore sur cette instance, le stop n'est pas intentionnel
      // → redémarrer (Web Speech API a une limite de durée)
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
          return;
        } catch {
          // Impossible de redémarrer
        }
      }
      setIsVoiceRecording(false);
      setVoiceFieldKey(null);
    };

    setVoiceFieldKey(fieldKey);
    setIsVoiceRecording(true);
    recognition.start();
  }, []);

  /**
   * Prise unique — date/heure. Pas d'auto-restart.
   */
  const startVoiceSingle = useCallback((
    fieldKey: string,
    onResult: (transcript: string) => void,
  ) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fr-FR';
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      onResult(event.results[0][0].transcript);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'aborted') console.warn('[useVoiceInput] single error:', e.error);
      setIsVoiceRecording(false);
      setVoiceFieldKey(null);
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
      setVoiceFieldKey(null);
    };

    setVoiceFieldKey(fieldKey);
    setIsVoiceRecording(true);
    recognition.start();
  }, []);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      // Mettre à null AVANT .stop() pour que onend sache que c'est intentionnel
      const r = recognitionRef.current;
      recognitionRef.current = null;
      try { r.stop(); } catch {}
    }
    setIsVoiceRecording(false);
    setVoiceFieldKey(null);
  }, []);

  return { voiceFieldKey, isVoiceRecording, startVoice, startVoiceSingle, stopVoice };
}
