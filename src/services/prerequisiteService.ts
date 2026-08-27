import { supabase } from '../lib/supabase';

export type PrerequisiteAnswers = Record<string, unknown> | unknown[];

export interface SavePrerequisiteResponseInput {
  meeting_id: string;
  patient_id: string;
  prerequisite_id: string;
  role: string;
  answers: PrerequisiteAnswers;
}

function normalizeRole(role: string): string {
  return (role || '').toLowerCase().trim();
}

function normalizeIdentifier(value: string): string {
  return (value || '').trim();
}

function ensureRequired(value: string, name: string): void {
  if (!value || !value.trim()) {
    throw new Error(`Missing required field: ${name}`);
  }
}

function localKey(meeting_id: string, prerequisite_id: string, role: string): string {
  return `prereq_${meeting_id}_${prerequisite_id}_${normalizeRole(role)}`;
}

// ──────────────────────────────────────────────────────────────
// GET — Supabase en priorité, localStorage en fallback
// ──────────────────────────────────────────────────────────────
async function getPrerequisiteResponse(
  meeting_id: string,
  prerequisite_id: string,
  role: string,
): Promise<PrerequisiteAnswers | null> {
  ensureRequired(normalizeIdentifier(meeting_id), 'meeting_id');
  ensureRequired(normalizeIdentifier(prerequisite_id), 'prerequisite_id');
  ensureRequired(role, 'role');

  const mid  = normalizeIdentifier(meeting_id);
  const pid  = normalizeIdentifier(prerequisite_id);
  const r    = normalizeRole(role);
  const lsKey = localKey(mid, pid, r);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('prerequisite_responses')
        .select('answers')
        .eq('meeting_id', mid)
        .eq('prerequisite_id', pid)
        .eq('role', r)
        .maybeSingle();

      if (!error && data?.answers != null) {
        // Mettre à jour le cache local
        try { localStorage.setItem(lsKey, JSON.stringify(data.answers)); } catch {}
        return data.answers as PrerequisiteAnswers;
      }

      if (error) {
        console.warn('[prerequisiteService] GET Supabase error:', error.message);
      }
    } catch (err) {
      console.warn('[prerequisiteService] GET Supabase unreachable:', (err as Error).message);
    }
  }

  // Fallback : cache localStorage
  try {
    const raw = localStorage.getItem(lsKey);
    if (raw) return JSON.parse(raw) as PrerequisiteAnswers;
  } catch {}

  return null;
}

async function loadPrerequisiteResponse(input: {
  meeting_id: string;
  prerequisite_id: string;
  role: string;
}): Promise<PrerequisiteAnswers | null> {
  return getPrerequisiteResponse(input.meeting_id, input.prerequisite_id, input.role);
}

// ──────────────────────────────────────────────────────────────
// SAVE — Supabase en priorité, localStorage comme cache
// ──────────────────────────────────────────────────────────────
async function savePrerequisiteResponse(
  input: SavePrerequisiteResponseInput,
): Promise<PrerequisiteAnswers> {
  ensureRequired(normalizeIdentifier(input.meeting_id), 'meeting_id');
  ensureRequired(normalizeIdentifier(input.prerequisite_id), 'prerequisite_id');
  ensureRequired(input.role, 'role');

  const mid  = normalizeIdentifier(input.meeting_id);
  const pid  = normalizeIdentifier(input.prerequisite_id);
  const r    = normalizeRole(input.role);
  const lsKey = localKey(mid, pid, r);

  const payload = {
    meeting_id:     mid,
    patient_id:     input.patient_id || '',
    prerequisite_id: pid,
    role:           r,
    answers:        input.answers,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('prerequisite_responses')
        .upsert(payload, { onConflict: 'meeting_id,prerequisite_id,role' })
        .select('answers')
        .single();

      if (!error) {
        // Succès Supabase — mettre à jour le cache local
        try { localStorage.setItem(lsKey, JSON.stringify(input.answers)); } catch {}
        return (data?.answers as PrerequisiteAnswers) ?? input.answers;
      }

      console.warn('[prerequisiteService] SAVE Supabase error:', error.message);
    } catch (err) {
      console.warn('[prerequisiteService] SAVE Supabase unreachable:', (err as Error).message);
    }
  }

  // Fallback : localStorage uniquement
  try { localStorage.setItem(lsKey, JSON.stringify(input.answers)); } catch {}
  return input.answers;
}

// ──────────────────────────────────────────────────────────────
// REALTIME — abonnement Supabase
// ──────────────────────────────────────────────────────────────
function subscribeToPrerequisiteResponseUpdates(
  meeting_id: string,
  prerequisite_id: string,
  role: string,
  onChange: (answers: PrerequisiteAnswers | null) => void,
): () => void {
  ensureRequired(normalizeIdentifier(meeting_id), 'meeting_id');
  ensureRequired(normalizeIdentifier(prerequisite_id), 'prerequisite_id');
  ensureRequired(role, 'role');

  if (!supabase) return () => {};

  const mid = normalizeIdentifier(meeting_id);
  const pid = normalizeIdentifier(prerequisite_id);
  const r   = normalizeRole(role);

  try {
    const channel = supabase
      .channel(`prereq-${mid}-${pid}-${r}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prerequisite_responses',
          filter: `meeting_id=eq.${mid}`,
        },
        (payload) => {
          const row =
            (payload.new as Record<string, unknown>) ||
            (payload.old as Record<string, unknown>) ||
            {};

          if (
            String(row.meeting_id    || '').trim()        !== mid ||
            String(row.prerequisite_id || '').trim()      !== pid ||
            String(row.role || '').toLowerCase()          !== r
          ) return;

          if (payload.eventType === 'DELETE') { onChange(null); return; }

          const answers = (payload.new as { answers?: PrerequisiteAnswers } | null)?.answers;
          onChange(answers ?? null);
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[prerequisiteService] Realtime indisponible');
        }
      });

    return () => {
      try { void supabase!.removeChannel(channel); } catch {}
    };
  } catch {
    return () => {};
  }
}

export const prerequisiteService = {
  getPrerequisiteResponse,
  loadPrerequisiteResponse,
  savePrerequisiteResponse,
  subscribeToPrerequisiteResponseUpdates,
};
