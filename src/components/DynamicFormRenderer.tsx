import { useEffect, useMemo, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { prerequisiteService } from '../services/prerequisiteService';

export interface DynamicField {
  id?: string;
  key?: string;
  label?: string;
  type: string;
}

interface DynamicFormRendererProps {
  meeting_id: string;
  prerequisite_id: string;
  role: string;
  fields: DynamicField[];
  patient_id?: string;
}

export function DynamicFormRenderer({
  meeting_id,
  prerequisite_id,
  role,
  fields,
  patient_id = '',
}: DynamicFormRendererProps) {
  const initialValues = useMemo(
    () =>
      fields.reduce<Record<string, string>>((acc, field) => {
        const fieldId = field.id || field.key;
        if (fieldId) {
          acc[fieldId] = '';
        }
        return acc;
      }, {}),
    [fields],
  );

  const [formData, setFormData] = useState<Record<string, string>>(initialValues);
  const [loading, setLoading] = useState<boolean>(false);
  const { voiceFieldKey, isVoiceRecording, startVoice, stopVoice } = useVoiceInput();
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSavedAnswers = async () => {
      setLoading(true);

      try {
        const savedAnswers = await prerequisiteService.getPrerequisiteResponse(
          meeting_id,
          prerequisite_id,
          role,
        );

        if (!isMounted) {
          return;
        }

        if (savedAnswers && typeof savedAnswers === 'object' && !Array.isArray(savedAnswers)) {
          const nextValues = { ...initialValues };

          Object.keys(nextValues).forEach((key) => {
            const rawValue = (savedAnswers as Record<string, unknown>)[key];
            nextValues[key] = rawValue === undefined || rawValue === null ? '' : String(rawValue);
          });

          setFormData(nextValues);
        } else {
          setFormData(initialValues);
        }
      } catch {
        if (isMounted) {
          setFormData(initialValues);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!meeting_id || !prerequisite_id || !role) {
      setFormData(initialValues);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    loadSavedAnswers();

    return () => {
      isMounted = false;
    };
  }, [meeting_id, prerequisite_id, role, initialValues]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (saved) {
      setSaved(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const answers = {
        ecog: formData.ecog === '' ? null : Number(formData.ecog),
        tnm: formData.tnm ?? '',
        commentaire: formData.commentaire ?? '',
      };

      await prerequisiteService.savePrerequisiteResponse({
        meeting_id,
        patient_id,
        prerequisite_id,
        role,
        answers,
      });

      setSaved(true);
    } catch (submitError: any) {
      setError(submitError?.message || 'Impossible d enregistrer les réponses');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading form answers...</div>;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      {fields.map((field) => {
        const fieldId = field.id || field.key;
        if (!fieldId) {
          return null;
        }

        const fieldType = (field.type || '').toLowerCase();
        const label = field.label || fieldId;

        return (
          <div key={fieldId} className="space-y-1">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
              {label}
            </label>

            {fieldType === 'textarea' ? (
              <div className="relative">
                <textarea
                  id={fieldId}
                  name={fieldId}
                  value={formData[fieldId] ?? ''}
                  onChange={(e) => handleChange(fieldId, e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 pr-10"
                />
                <button
                  type="button"
                  onClick={() => isVoiceRecording && voiceFieldKey === fieldId ? stopVoice() : startVoice(fieldId, formData[fieldId] ?? '', (text) => handleChange(fieldId, text))}
                  className="absolute right-2 top-2 p-1.5 rounded transition hover:opacity-80"
                  style={{ backgroundColor: isVoiceRecording && voiceFieldKey === fieldId ? '#ef4444' : '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}
                  title="Dictée vocale"
                >
                  {isVoiceRecording && voiceFieldKey === fieldId ? <MicOff size={13} /> : <Mic size={13} />}
                </button>
              </div>
            ) : fieldType === 'input:number' ? (
              <input
                id={fieldId}
                name={fieldId}
                type="number"
                value={formData[fieldId] ?? ''}
                onChange={(e) => handleChange(fieldId, e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            ) : (
              <div className="relative">
                <input
                  id={fieldId}
                  name={fieldId}
                  type="text"
                  value={formData[fieldId] ?? ''}
                  onChange={(e) => handleChange(fieldId, e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 pr-10"
                />
                <button
                  type="button"
                  onClick={() => isVoiceRecording && voiceFieldKey === fieldId ? stopVoice() : startVoice(fieldId, formData[fieldId] ?? '', (text) => handleChange(fieldId, text))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition hover:opacity-80"
                  style={{ backgroundColor: isVoiceRecording && voiceFieldKey === fieldId ? '#ef4444' : '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}
                  title="Dictée vocale"
                >
                  {isVoiceRecording && voiceFieldKey === fieldId ? <MicOff size={13} /> : <Mic size={13} />}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {error && <div className="text-sm text-red-600">{error}</div>}
      {saved && <div className="text-sm text-emerald-600">Réponses enregistrées.</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les réponses'}
        </button>
      </div>
    </form>
  );
}
