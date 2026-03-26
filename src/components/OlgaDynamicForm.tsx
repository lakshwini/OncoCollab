import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  prerequisitesService,
  type OlgaFormField,
} from '../services/prerequisites.service';
import { prerequisiteService } from '../services/prerequisiteService';

type OlgaValue = string | number | boolean | null;

type FormItem = {
  key: string;
  label?: string;
  label_fr?: string;
  label_en?: string;
  status: 'pending' | 'in_progress' | 'done';
  source?: 'orthanc' | 'document' | 'form' | null;
  reference_id?: string | null;
  value?: unknown;
};

interface OlgaDynamicFormProps {
  meetingId: string;
  role: string;
  items: FormItem[];
  prerequisiteId?: string;
  patientId?: string;
  language: 'fr' | 'en';
  title?: string;
  description?: string;
  initialFieldKey?: string | null;
  variant?: 'light' | 'dark';
  onSaved?: (response: any) => void;
  onError?: (message: string) => void;
}

const containerStyles = {
  light: {
    wrapper: 'rounded-xl border border-gray-200 bg-white',
    header: 'border-b border-gray-100 bg-gray-50/80',
    input: 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400',
    label: 'text-gray-700',
    description: 'text-gray-500',
  },
  dark: {
    wrapper: 'rounded-xl border border-[#333333] bg-[#2a2a2a]',
    header: 'border-b border-[#333333] bg-[#232323]',
    input: 'border-[#444444] bg-[#1f1f1f] text-white placeholder:text-gray-500',
    label: 'text-gray-200',
    description: 'text-gray-400',
  },
} as const;

function normalizeFieldValue(type: string, value: unknown): OlgaValue {
  if (type === 'checkbox') {
    return value === true;
  }

  if (type === 'number') {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function deriveItemStatus(type: string, value: OlgaValue): 'pending' | 'done' {
  if (type === 'checkbox') {
    return value === true ? 'done' : 'pending';
  }

  if (value === null) {
    return 'pending';
  }

  if (typeof value === 'string') {
    return value.trim().length > 0 ? 'done' : 'pending';
  }

  return 'done';
}

function labelForField(field: OlgaFormField, item: FormItem | undefined, language: 'fr' | 'en') {
  if (language === 'fr' && item?.label_fr) {
    return item.label_fr;
  }

  if (language === 'en' && item?.label_en) {
    return item.label_en;
  }

  return field.label || item?.label || field.key;
}

export function OlgaDynamicForm({
  meetingId,
  role,
  items,
  prerequisiteId = 'olga_form',
  patientId = '',
  language,
  title,
  description,
  initialFieldKey,
  variant = 'light',
  onSaved,
  onError,
}: OlgaDynamicFormProps) {
  const normalizedRole = (role || '').toLowerCase().trim();
  const normalizedMeetingId = (meetingId || '').trim();
  const normalizedPrerequisiteId = (prerequisiteId || '').trim();
  const dataKey = `${normalizedMeetingId}::${normalizedPrerequisiteId}::${normalizedRole}`;
  const styles = containerStyles[variant];
  const [fields, setFields] = useState<OlgaFormField[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [formUnavailable, setFormUnavailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.key, item])),
    [items],
  );

  useEffect(() => {
    let cancelled = false;

    const loadSchema = async () => {
      if (!role) {
        setFields([]);
        setFormUnavailable(false);
        return;
      }

      try {
        setLoadingSchema(true);
        setError(null);
        setFormUnavailable(false);
        const loadedFields = await prerequisitesService.getOlgaForm(role);
        if (!cancelled) {
          if (loadedFields === null) {
            setFields([]);
            setFormUnavailable(true);
          } else {
            setFields(loadedFields);
          }
        }
      } catch (loadError: any) {
        if (!cancelled) {
          const message = loadError?.message || 'Impossible de charger le formulaire Olga';
          setError(message);
          setFormUnavailable(false);
          onError?.(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingSchema(false);
        }
      }
    };

    loadSchema();
    return () => {
      cancelled = true;
    };
  }, [role, onError]);

  useEffect(() => {
    let cancelled = false;

    const loadLatestAnswers = async () => {
      try {
        setLoadingAnswers(true);
        setSaved(false);
        setError(null);
        setFormData({});

        const response = await prerequisiteService.getPrerequisiteResponse(
          normalizedMeetingId,
          normalizedPrerequisiteId,
          role,
        );

        if (cancelled) {
          return;
        }

        if (response && typeof response === 'object' && !Array.isArray(response)) {
          setFormData(response as Record<string, unknown>);
        } else {
          setFormData({});
        }
      } catch {
        if (!cancelled) {
          setFormData({});
        }
      } finally {
        if (!cancelled) {
          setLoadingAnswers(false);
        }
      }
    };

    void loadLatestAnswers();

    return () => {
      cancelled = true;
    };
  }, [dataKey, role, normalizedMeetingId, normalizedPrerequisiteId]);

  useEffect(() => {
    if (fields.length === 0 || !normalizedMeetingId || !normalizedPrerequisiteId || !normalizedRole) {
      return;
    }

    const applyAnswersToState = (answers: unknown) => {
      const emptyValues: Record<string, unknown> = {};
      fields.forEach((field) => {
        emptyValues[field.key] = '';
      });

      if (answers && typeof answers === 'object' && !Array.isArray(answers)) {
        const answerObject = answers as Record<string, unknown>;
        const hydratedValues: Record<string, unknown> = { ...emptyValues };

        fields.forEach((field) => {
          hydratedValues[field.key] = answerObject[field.key] ?? '';
        });

        setFormData(hydratedValues);
      } else {
        setFormData(emptyValues);
      }
    };

    const unsubscribe = prerequisiteService.subscribeToPrerequisiteResponseUpdates(
      normalizedMeetingId,
      normalizedPrerequisiteId,
      normalizedRole,
      (answers) => {
        applyAnswersToState(answers);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [fields, normalizedMeetingId, normalizedPrerequisiteId, normalizedRole]);

  useEffect(() => {
    if (!saved) {
      return;
    }

    const timeoutId = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [saved]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const answersToSave = { ...formData };
      console.log('[OlgaDynamicForm] saving answers payload:', {
        meeting_id: meetingId,
        patient_id: patientId,
        prerequisite_id: prerequisiteId,
        role,
        answers: answersToSave,
      });

      const savedAnswers = await prerequisiteService.savePrerequisiteResponse({
        meeting_id: meetingId,
        patient_id: patientId,
        prerequisite_id: prerequisiteId,
        role,
        answers: answersToSave,
      });

      console.log('[OlgaDynamicForm] saved answers result:', savedAnswers);

      const payload = fields.map((field) => {
        const existingItem = itemMap.get(field.key);
        const value = normalizeFieldValue(field.type, formData[field.key]);

        return {
          key: field.key,
          status: deriveItemStatus(field.type, value),
          reference_id: existingItem?.reference_id ?? null,
          value,
        };
      });

      const response = await prerequisitesService.updateMyPrerequisites(meetingId, {
        items: payload,
      });

      setSaved(true);
      onSaved?.(response);
    } catch (saveError: any) {
      const message = saveError?.message || 'Impossible d\'enregistrer les réponses OLGA';
      setError(message);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${styles.wrapper} overflow-hidden`}>
      {(title || description) && (
        <div className={`${styles.header} px-4 py-3`}>
          {title && <h3 className="text-sm font-semibold text-inherit">{title}</h3>}
          {description && <p className={`mt-1 text-xs ${styles.description}`}>{description}</p>}
        </div>
      )}

      <div className="space-y-4 p-4">
        {error && (
          <Alert className={variant === 'dark' ? 'border-red-900/50 bg-red-950/30 text-red-100' : 'border-red-200 bg-red-50'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saved && (
          <Alert className={variant === 'dark' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-100' : 'border-emerald-200 bg-emerald-50'}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {language === 'fr' ? 'Réponses enregistrées.' : 'Answers saved.'}
            </AlertDescription>
          </Alert>
        )}

        {loadingSchema || loadingAnswers ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {language === 'fr' ? 'Chargement des réponses…' : 'Loading answers...'}
          </div>
        ) : formUnavailable ? (
          <div className={`rounded-lg border px-4 py-5 text-sm ${styles.input}`}>
            Formulaire Olga non disponible pour ce rôle
          </div>
        ) : fields.length === 0 ? (
          <div className={`rounded-lg border px-4 py-5 text-sm ${styles.input}`}>
            Dynamic form from Olga API
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => {
              const item = itemMap.get(field.key);
              const fieldId = field.key;
              const currentValue = formData[fieldId];
              const fieldLabel = labelForField(field, item, language);
              const sharedClassName = `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${styles.input}`;

              return (
                <div key={field.key} className="space-y-1">
                  <label className={`block text-sm font-medium ${styles.label}`} htmlFor={`${meetingId}-${field.key}`}>
                    {fieldLabel}
                    {field.required ? ' *' : ''}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={`${meetingId}-${fieldId}`}
                      className={`${sharedClassName} min-h-28 resize-y`}
                      placeholder={field.placeholder || fieldLabel}
                      value={(currentValue as string) || ''}
                      autoFocus={initialFieldKey === field.key}
                      onChange={(event) => {
                        setFormData((prev) => ({
                          ...prev,
                          [fieldId]: event.target.value,
                        }));
                      }}
                    />
                  ) : field.type === 'select' && field.options ? (
                    <select
                      id={`${meetingId}-${fieldId}`}
                      className={sharedClassName}
                      value={(currentValue as string) || ''}
                      autoFocus={initialFieldKey === field.key}
                      onChange={(event) => {
                        setFormData((prev) => ({
                          ...prev,
                          [fieldId]: event.target.value,
                        }));
                      }}
                    >
                      <option value="">
                        {language === 'fr' ? 'Sélectionner…' : 'Select...'}
                      </option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${styles.input}`}>
                      <input
                        id={`${meetingId}-${fieldId}`}
                        type="checkbox"
                        checked={currentValue === true}
                        autoFocus={initialFieldKey === field.key}
                        onChange={(event) => {
                          setFormData((prev) => ({
                            ...prev,
                            [fieldId]: event.target.checked,
                          }));
                        }}
                      />
                      <span className={`text-sm ${styles.label}`}>{field.placeholder || fieldLabel}</span>
                    </label>
                  ) : (
                    <input
                      id={`${meetingId}-${fieldId}`}
                      className={sharedClassName}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      placeholder={field.placeholder || fieldLabel}
                      value={(currentValue as string | number) || ''}
                      autoFocus={initialFieldKey === field.key}
                      onChange={(event) => {
                        setFormData((prev) => ({
                          ...prev,
                          [fieldId]: event.target.value,
                        }));
                      }}
                    />
                  )}

                  {item?.status === 'done' && (
                    <p className={`text-xs ${variant === 'dark' ? 'text-emerald-300' : 'text-emerald-600'}`}>
                      {language === 'fr' ? 'Champ déjà renseigné' : 'Field already filled'}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} disabled={saving} className="min-w-40">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {language === 'fr' ? 'Enregistrer les réponses' : 'Save answers'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}