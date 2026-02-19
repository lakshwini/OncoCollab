import { Page, UserRole } from '../App';
import {
  LayoutDashboard,
  FolderOpen,
  Video,
  MessageSquare,
  Bot,
  Settings,
  Calendar,
  FileText,
  HelpCircle,
  ClipboardCheck
} from 'lucide-react';
import { Badge } from './ui/badge';
import { useLanguage } from '../i18n';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userRole?: UserRole;
}

export function Sidebar({ currentPage, onNavigate, userRole }: SidebarProps) {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard' as Page, labelKey: 'dashboard', icon: LayoutDashboard },
    { id: 'dossiers' as Page, labelKey: 'patients', icon: FolderOpen },
    { id: 'calendrier' as Page, labelKey: 'calendar', icon: Calendar },
    { id: 'mes-prerequis' as Page, labelKey: 'myPrerequisites', icon: ClipboardCheck },
    { id: 'workspace' as Page, labelKey: 'myDocuments', icon: FileText },
    { id: 'reunions' as Page, labelKey: 'meetings', icon: Video },
    { id: 'messagerie' as Page, labelKey: 'messaging', icon: MessageSquare },
    { id: 'agentia' as Page, labelKey: 'agentIA', icon: Bot, highlight: true },
  ];

  const bottomItems = [
    { id: 'aide' as Page, labelKey: 'help', icon: HelpCircle },
    { id: 'parametres' as Page, labelKey: 'settings', icon: Settings },
  ];

  const getLabel = (labelKey: string) => {
    return (t.sidebar as Record<string, string>)[labelKey] || labelKey;
  };

  return (
    <aside className="w-64 bg-[#1a1f2e] border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-white">OncoCollab</h2>
            <p className="text-xs text-gray-400">{t.sidebar.rcpPlatform}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : item.highlight
                      ? 'text-blue-400 hover:bg-blue-900/20'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{getLabel(item.labelKey)}</span>
                  {item.badge && !isActive && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-2 py-0 h-5">
                      {item.badge}
                    </Badge>
                  )}
                  {item.highlight && !isActive && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 px-4 mb-2">{t.sidebar.support}</p>
          <ul className="space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{getLabel(item.labelKey)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

    </aside>
  );
}
