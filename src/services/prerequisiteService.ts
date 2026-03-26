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

async function getPrerequisiteResponse(
  meeting_id: string,
  prerequisite_id: string,
  role: string,
): Promise<PrerequisiteAnswers | null> {
  const normalizedMeetingId = normalizeIdentifier(meeting_id);
  const normalizedPrerequisiteId = normalizeIdentifier(prerequisite_id);

  ensureRequired(normalizedMeetingId, 'meeting_id');
  ensureRequired(normalizedPrerequisiteId, 'prerequisite_id');
  ensureRequired(role, 'role');

  const normalizedRole = normalizeRole(role);

  const { data, error } = await supabase
    .from('prerequisite_responses')
    .select('answers')
    .eq('meeting_id', normalizedMeetingId)
    .eq('prerequisite_id', normalizedPrerequisiteId)
    .eq('role', normalizedRole)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch prerequisite response: ${error.message}`);
  }

  return (data?.answers as PrerequisiteAnswers | null) ?? null;
}

async function savePrerequisiteResponse(
  input: SavePrerequisiteResponseInput,
): Promise<PrerequisiteAnswers> {
  const normalizedMeetingId = normalizeIdentifier(input.meeting_id);
  const normalizedPrerequisiteId = normalizeIdentifier(input.prerequisite_id);

  ensureRequired(normalizedMeetingId, 'meeting_id');
  ensureRequired(normalizedPrerequisiteId, 'prerequisite_id');
  ensureRequired(input.role, 'role');

  const payload = {
    meeting_id: normalizedMeetingId,
    patient_id: input.patient_id || '',
    prerequisite_id: normalizedPrerequisiteId,
    role: normalizeRole(input.role),
    answers: input.answers,
  };

  const { data, error } = await supabase
    .from('prerequisite_responses')
    .upsert(payload, { onConflict: 'meeting_id,prerequisite_id,role' })
    .select('answers')
    .single();

  if (error) {
    throw new Error(`Failed to save prerequisite response: ${error.message}`);
  }

  return (data?.answers as PrerequisiteAnswers | null) ?? input.answers;
}

function subscribeToPrerequisiteResponseUpdates(
  meeting_id: string,
  prerequisite_id: string,
  role: string,
  onChange: (answers: PrerequisiteAnswers | null) => void,
): () => void {
  const normalizedMeetingId = normalizeIdentifier(meeting_id);
  const normalizedPrerequisiteId = normalizeIdentifier(prerequisite_id);

  ensureRequired(normalizedMeetingId, 'meeting_id');
  ensureRequired(normalizedPrerequisiteId, 'prerequisite_id');
  ensureRequired(role, 'role');

  const normalizedRole = normalizeRole(role);
  const channel = supabase
    .channel(`prerequisite-responses-${normalizedMeetingId}-${normalizedPrerequisiteId}-${normalizedRole}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'prerequisite_responses',
        filter: `meeting_id=eq.${normalizedMeetingId}`,
      },
      (payload) => {
        const row =
          (payload.new as Record<string, unknown>) ||
          (payload.old as Record<string, unknown>) ||
          {};

        if (
          String(row.meeting_id || '').trim() !== normalizedMeetingId ||
          String(row.prerequisite_id || '').trim() !== normalizedPrerequisiteId ||
          String(row.role || '').toLowerCase() !== normalizedRole
        ) {
          return;
        }

        if (payload.eventType === 'DELETE') {
          onChange(null);
          return;
        }

        const answers = (payload.new as { answers?: PrerequisiteAnswers } | null)?.answers;
        onChange(answers ?? null);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export const prerequisiteService = {
  getPrerequisiteResponse,
  savePrerequisiteResponse,
  subscribeToPrerequisiteResponseUpdates,
};
