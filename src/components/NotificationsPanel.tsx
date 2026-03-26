import { Bell, X } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../i18n';

interface NotificationsPanelProps {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const { language, t } = useLanguage();

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h3 className="text-gray-900">{t.notificationsPanel.title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-8 text-center text-gray-400 text-sm">
        {language === 'fr' ? 'Aucune notification' : 'No notifications'}
      </div>
    </div>
  );
}
