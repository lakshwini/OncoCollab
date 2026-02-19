import { Bot, Sparkles } from 'lucide-react';
import { Page } from '../App';
import { Card, CardContent } from './ui/card';
import { useLanguage } from '../i18n';

interface AgentIAProps {
  onNavigate: (page: Page) => void;
}

export function AgentIA({ onNavigate: _onNavigate }: AgentIAProps) {
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">{t.agentIA.title}</h1>
            <p className="text-gray-600">{t.agentIA.subtitle}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-500 text-base">
            Section en cours d&apos;implémentation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
