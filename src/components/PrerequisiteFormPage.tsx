import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { OlgaDynamicForm } from './OlgaDynamicForm';
import type { Page } from '../App';

export interface PrerequisiteFormContext {
  meetingId: string;
  prerequisiteId: string;
  role: string;
  patientId?: string;
  title: string;
  description?: string;
  language?: 'fr' | 'en';
  returnPage: Page;
  items: Array<{
    key: string;
    label?: string;
    status: 'pending' | 'in_progress' | 'done';
    source?: 'orthanc' | 'document' | 'form' | null;
    reference_id?: string | null;
    value?: unknown;
  }>;
}

interface PrerequisiteFormPageProps {
  context: PrerequisiteFormContext;
  onBack: () => void;
}

export function PrerequisiteFormPage({ context, onBack }: PrerequisiteFormPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-gray-900 mb-1">{context.title}</h1>
          <p className="text-gray-600">{context.description || 'Formulaire de prérequis'}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <OlgaDynamicForm
            meetingId={context.meetingId}
            prerequisiteId={context.prerequisiteId}
            patientId={context.patientId}
            role={context.role}
            language={context.language || 'fr'}
            title={context.title}
            description={context.description}
            items={context.items}
          />
        </div>
      </div>
    </div>
  );
}
