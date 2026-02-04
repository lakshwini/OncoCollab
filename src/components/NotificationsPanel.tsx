import { Bell, Calendar, FileText, Users, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useLanguage } from '../i18n';

interface NotificationsPanelProps {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const { language, t } = useLanguage();

  const notifications = [
    {
      id: '1',
      type: 'meeting',
      icon: Calendar,
      titleKey: 'rcpReminder',
      time: language === 'fr' ? 'Il y a 2h' : '2h ago',
      unread: true,
    },
    {
      id: '2',
      type: 'document',
      icon: FileText,
      titleKey: 'dossierToValidate',
      time: language === 'fr' ? 'Il y a 5h' : '5h ago',
      unread: true,
    },
    {
      id: '3',
      type: 'team',
      icon: Users,
      titleKey: 'annotationAdded',
      time: language === 'fr' ? 'Hier' : 'Yesterday',
      unread: false,
    },
    {
      id: '4',
      type: 'meeting',
      icon: Calendar,
      titleKey: 'newMeetingScheduled',
      time: language === 'fr' ? 'Il y a 2 jours' : '2 days ago',
      unread: false,
    },
  ];

  const getNotificationTitle = (key: string) => {
    const titles: Record<string, string> = {
      rcpReminder: language === 'fr' ? 'Rappel : Réunion RCP demain à 10h' : 'Reminder: RCP meeting tomorrow at 10am',
      dossierToValidate: language === 'fr' ? 'Dossier #123 à valider' : 'File #123 to validate',
      annotationAdded: language === 'fr' ? 'Dr. Laurent a ajouté une annotation' : 'Dr. Laurent added an annotation',
      newMeetingScheduled: language === 'fr' ? 'Nouvelle réunion programmée' : 'New meeting scheduled',
    };
    return titles[key] || key;
  };

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h3 className="text-gray-900">{t.notificationsPanel.title}</h3>
          <Badge variant="secondary" className="ml-2">
            {notifications.filter(n => n.unread).length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                notification.unread ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.unread ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    notification.unread ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{getNotificationTitle(notification.titleKey)}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
                {notification.unread && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-200">
        <Button variant="ghost" className="w-full text-sm text-blue-600">
          {language === 'fr' ? 'Voir toutes les notifications' : 'View all notifications'}
        </Button>
      </div>
    </div>
  );
}
