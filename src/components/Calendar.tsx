import { useState } from 'react';
import { Page } from '../App';
import { ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface CalendarProps {
  onNavigate: (page: Page) => void;
}

export function Calendar({ onNavigate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // November 2025
  const [view, setView] = useState<'month' | 'week'>('month');

  const doctors = [
    { name: 'Dr. Martin', color: 'bg-blue-500' },
    { name: 'Dr. Dubois', color: 'bg-green-500' },
    { name: 'Dr. Laurent', color: 'bg-purple-500' },
    { name: 'Dr. Chen', color: 'bg-orange-500' },
  ];

  const events = [
    { date: 11, title: 'RCP Oncologie Thoracique', time: '10:00', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { date: 13, title: 'RCP Cancers Digestifs', time: '14:30', color: 'bg-green-100 text-green-700 border-green-300' },
    { date: 18, title: 'RCP Cancers ORL', time: '09:00', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { date: 20, title: 'RCP Oncologie Thoracique', time: '15:00', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const days = [];
  // Add empty cells for days before the month starts
  for (let i = 0; i < (startingDayOfWeek || 7) - 1; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square p-2 border border-gray-200 bg-gray-50"></div>);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = events.filter(e => e.date === day);
    const isToday = day === 10; // Mock today as Nov 10

    days.push(
      <div
        key={day}
        className={`aspect-square p-2 border border-gray-200 hover:bg-gray-50 transition-colors ${
          isToday ? 'bg-blue-50' : 'bg-white'
        }`}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </span>
          <div className="space-y-1 overflow-hidden">
            {dayEvents.map((event, index) => (
              <div
                key={index}
                className={`text-xs px-2 py-1 rounded border ${event.color} cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <div className="truncate">{event.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">Calendrier partagé</h1>
          <p className="text-gray-600">Planification des réunions RCP</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Planifier une RCP
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-gray-900 min-w-[200px] text-center capitalize">{monthName}</h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Mois
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Semaine
            </Button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="text-center text-sm text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {days}
        </div>
      </div>

      {/* Legend & Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Légende</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-sm text-gray-700">RCP Oncologie Thoracique</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span className="text-sm text-gray-700">RCP Cancers Digestifs</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-sm text-gray-700">RCP Cancers ORL</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Disponibilités
          </h3>
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <div key={doctor.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${doctor.color}`}></div>
                  <span className="text-sm text-gray-700">{doctor.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Disponible
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Prochaines réunions ce mois</h3>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div>
                <p className="text-gray-900">{event.title}</p>
                <p className="text-sm text-gray-600">
                  {event.date} novembre 2025 • {event.time}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate('reunions')}>
                Voir détails
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
