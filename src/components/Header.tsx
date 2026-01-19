import { useState } from 'react';
import { User } from '../App';
import { Bell, LogOut, User as UserIcon, ChevronDown, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { NotificationsPanel } from './NotificationsPanel';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  });

  const roleLabels: Record<string, string> = {
    radiologue: 'Radiologue',
    oncologue: 'Oncologue',
    chirurgien: 'Chirurgien',
    pathologiste: 'Pathologiste',
    admin: 'Administrateur',
  };

  const roleColors: Record<string, string> = {
    radiologue: 'bg-blue-600',
    oncologue: 'bg-purple-600',
    chirurgien: 'bg-green-600',
    pathologiste: 'bg-orange-600',
    admin: 'bg-red-600',
  };

  return (
    <header className="h-16 bg-[#1a1f2e] border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="text-gray-400 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {currentTime.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-300 hover:text-white hover:bg-gray-800"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {showNotifications && (
            <NotificationsPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors">
              <Avatar className={`${roleColors[user.role]}`}>
                <AvatarFallback className={`${roleColors[user.role]} text-white`}>
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm text-white">{user.name}</div>
                <div className="text-xs text-gray-400">{roleLabels[user.role]}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1a1f2e] border-gray-800">
            <DropdownMenuLabel className="text-white">Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem className="text-gray-300 focus:bg-gray-800 focus:text-white">
              <UserIcon className="w-4 h-4 mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 focus:bg-gray-800 focus:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Historique des connexions
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem 
              onClick={onLogout} 
              className="text-red-400 focus:bg-red-900/20 focus:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
