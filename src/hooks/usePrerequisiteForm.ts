import { useEffect, useState } from 'react';

interface PrerequisiteField {
  key: string;
  label: string;
  type: string;
}

interface PrerequisiteFormResponse {
  fields: PrerequisiteField[];
}

export function usePrerequisiteForm(role: string) {
  const [data, setData] = useState<PrerequisiteFormResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const normalizedRole = (role || '').toLowerCase().trim();

    if (!normalizedRole) {
      setData(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchForm = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `http://localhost:3002/prerequisite-form/${encodeURIComponent(normalizedRole)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch prerequisite form: ${response.status}`);
        }

        const json = (await response.json()) as PrerequisiteFormResponse;
        setData(json);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchForm();

    return () => {
      controller.abort();
    };
  }, [role]);

  return { data, loading };
}
