import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createApiUrl, createAuthHeaders } from '../config/api.config';

export interface TranscriptionBlock {
  id?: string;
  speakerId?: string;
  speakerName: string;
  text: string;
  blockOrder: number;
  timestampSeconds?: number;
  source?: 'speechcore' | 'whisper' | 'manual';
}

interface TranscriptionContextType {
  blocks: TranscriptionBlock[];
  currentBlock: TranscriptionBlock | null;
  isRecording: boolean;
  currentSpeaker: string;
  meetingId: string | null;

  setMeetingId: (id: string) => void;
  setCurrentSpeaker: (speaker: string) => void;
  startRecording: () => void;
  stopRecording: () => Promise<void>;
  addTextToCurrentBlock: (text: string) => void;
  saveBlock: (block: TranscriptionBlock) => Promise<void>;
  updateBlock: (index: number, text: string) => void;
  deleteBlock: (index: number) => void;
  setInitialBlocks: (blocks: TranscriptionBlock[]) => void;
  deleteAllBlocks: () => Promise<void>;
  getFullTranscription: () => string;
  getBlockStats: () => {
    totalBlocks: number;
    totalWords: number;
    totalCharacters: number;
    speakers: string[];
  };
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

export function TranscriptionProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState<TranscriptionBlock[]>([]);
  const [currentBlock, setCurrentBlock] = useState<TranscriptionBlock | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState('Inconnu');
  const [meetingId, setMeetingId] = useState<string | null>(null);

  const startRecording = useCallback(() => {
    const nextOrder = blocks.length;
    setCurrentBlock({
      speakerName: currentSpeaker,
      text: '',
      blockOrder: nextOrder,
      source: 'speechcore',
    });
    setIsRecording(true);
  }, [blocks.length, currentSpeaker]);

  const saveBlock = useCallback(
    async (block: TranscriptionBlock) => {
      // Ajouter localement immédiatement — indépendamment du backend
      setBlocks((prev) => {
        const alreadyExists = block.id && prev.some(b => b.id === block.id);
        if (alreadyExists) return prev;
        return [...prev, block];
      });

      // Persister côté backend (best-effort)
      if (!meetingId) return;
      try {
        const token = localStorage.getItem('onco_collab_token');
        const response = await fetch(
          createApiUrl(`/meetings/${meetingId}/transcription/block`),
          {
            method: 'POST',
            headers: createAuthHeaders(token),
            body: JSON.stringify({
              text: block.text,
              speakerName: block.speakerName,
              speakerId: block.speakerId,
              blockOrder: block.blockOrder,
              timestampSeconds: block.timestampSeconds,
              source: block.source || 'speechcore',
            }),
          },
        );
        if (response.ok) {
          const data = await response.json();
          // Mettre à jour l'id du bloc si le backend en retourne un
          setBlocks((prev) =>
            prev.map((b) =>
              b === block || (b.blockOrder === block.blockOrder && b.speakerName === block.speakerName)
                ? { ...b, id: data.block?.id || b.id }
                : b
            )
          );
        }
      } catch {
        // Bloc déjà ajouté localement — pas de perte de données
      }
    },
    [meetingId],
  );

  const stopRecording = useCallback(async () => {
    if (currentBlock && currentBlock.text.trim().length > 0) {
      await saveBlock(currentBlock);
    }
    setCurrentBlock(null);
    setIsRecording(false);
  }, [currentBlock, saveBlock]);

  const addTextToCurrentBlock = useCallback((text: string) => {
    setCurrentBlock((prev) =>
      prev ? { ...prev, text: text.trim() } : null,
    );
  }, []);

  const updateBlock = useCallback((index: number, text: string) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, text } : b))
    );
  }, []);

  const deleteBlock = useCallback((index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const setInitialBlocks = useCallback((incoming: TranscriptionBlock[]) => {
    setBlocks(incoming);
  }, []);

  const deleteAllBlocks = useCallback(async () => {
    setBlocks([]);
    if (!meetingId) return;
    try {
      const token = localStorage.getItem('onco_collab_token');
      await fetch(createApiUrl(`/meetings/${meetingId}/transcription/blocks`), {
        method: 'DELETE',
        headers: createAuthHeaders(token),
      });
    } catch {
      // blocs déjà effacés localement
    }
  }, [meetingId]);

  const getFullTranscription = useCallback(() => {
    return blocks
      .map((block) => `[${block.speakerName}] ${block.text}`)
      .join('\n');
  }, [blocks]);

  const getBlockStats = useCallback(() => {
    const totalWords = blocks.reduce(
      (sum, block) => sum + block.text.split(/\s+/).filter((w) => w.length > 0).length,
      0,
    );
    const totalCharacters = blocks.reduce((sum, block) => sum + block.text.length, 0);
    const speakers = [...new Set(blocks.map((block) => block.speakerName))];
    return { totalBlocks: blocks.length, totalWords, totalCharacters, speakers };
  }, [blocks]);

  const value: TranscriptionContextType = {
    blocks,
    currentBlock,
    isRecording,
    currentSpeaker,
    meetingId,
    setMeetingId,
    setCurrentSpeaker,
    startRecording,
    stopRecording,
    addTextToCurrentBlock,
    saveBlock,
    updateBlock,
    deleteBlock,
    setInitialBlocks,
    deleteAllBlocks,
    getFullTranscription,
    getBlockStats,
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
}

export function useTranscription() {
  const context = useContext(TranscriptionContext);
  if (!context) {
    throw new Error('useTranscription doit être utilisé dans un TranscriptionProvider');
  }
  return context;
}
