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
  BarChart3,
  ClipboardCheck
} from 'lucide-react';
import { Badge } from './ui/badge';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userRole?: UserRole;
}

export function Sidebar({ currentPage, onNavigate, userRole }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as Page, label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'dossiers' as Page, label: 'Patients', icon: FolderOpen },
    { id: 'calendrier' as Page, label: 'Calendrier RCP', icon: Calendar },
    { id: 'mes-prerequis' as Page, label: 'Mes Pré-requis', icon: ClipboardCheck, badge: '5' },
    { id: 'workspace' as Page, label: 'Mes Documents', icon: FileText, badge: '3' },
    { id: 'reunions' as Page, label: 'Réunions', icon: Video },
    { id: 'messagerie' as Page, label: 'Messagerie', icon: MessageSquare },
    { id: 'agentia' as Page, label: 'AgentIA', icon: Bot, highlight: true },
  ];

  const bottomItems = [
    { id: 'aide' as Page, label: 'Aide', icon: HelpCircle },
    { id: 'parametres' as Page, label: 'Paramètres', icon: Settings },
  ];

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
            <h2 className="text-white">OncoLlab</h2>
            <p className="text-xs text-gray-400">Plateforme RCP</p>
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
                  <span className="flex-1 text-left">{item.label}</span>
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
          <p className="text-xs text-gray-500 px-4 mb-2">SUPPORT</p>
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
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Security Indicator */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs">Connexion sécurisée</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">SSL/TLS actif</p>
        </div>
      </div>
    </aside>
  );
}