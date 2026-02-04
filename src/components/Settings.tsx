import { useState } from 'react';
import { User } from '../App';
import { Bell, Lock, Users, Globe, HelpCircle, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useLanguage } from '../i18n';

interface SettingsProps {
  user: User;
}

export function Settings({ user }: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [platformNotifications, setPlatformNotifications] = useState(true);
  const [meetingReminders, setMeetingReminders] = useState(true);

  const users = [
    { id: '1', name: 'Dr. Laurent Martin', email: 'laurent.martin@hopital.fr', role: 'radiologue' },
    { id: '2', name: 'Dr. Marie Dubois', email: 'marie.dubois@hopital.fr', role: 'oncologue' },
    { id: '3', name: 'Dr. Sophie Chen', email: 'sophie.chen@hopital.fr', role: 'chirurgien' },
    { id: '4', name: 'Dr. Pierre Laurent', email: 'pierre.laurent@hopital.fr', role: 'admin' },
  ];

  const getRoleLabel = (role: string) => {
    const roles = t.settings.roles as Record<string, string>;
    return roles[role] || role;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-gray-900 mb-1">{t.settings.title}</h1>
        <p className="text-gray-600">{t.settings.subtitle}</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            {t.settings.tabs.notifications}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            {t.settings.tabs.security}
          </TabsTrigger>
          {user.role === 'admin' && (
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              {t.settings.tabs.users}
            </TabsTrigger>
          )}
          <TabsTrigger value="accessibility">
            <Globe className="w-4 h-4 mr-2" />
            {t.settings.tabs.accessibility}
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.notifications.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t.settings.notifications.email}</Label>
                  <p className="text-sm text-gray-600">
                    {t.settings.notifications.emailDesc}
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t.settings.notifications.platform}</Label>
                  <p className="text-sm text-gray-600">
                    {t.settings.notifications.platformDesc}
                  </p>
                </div>
                <Switch
                  checked={platformNotifications}
                  onCheckedChange={setPlatformNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>{t.settings.notifications.meetingReminders}</Label>
                  <p className="text-sm text-gray-600">
                    {t.settings.notifications.meetingRemindersDesc}
                  </p>
                </div>
                <Switch
                  checked={meetingReminders}
                  onCheckedChange={setMeetingReminders}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.security.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t.settings.security.currentPassword}</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label>{t.settings.security.newPassword}</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label>{t.settings.security.confirmPassword}</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">
                {t.settings.security.updatePassword}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t.settings.security.sessionSecurity}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    {t.settings.security.sessionExpiry} <strong>{t.settings.security.sessionDuration}</strong> {t.settings.security.forSecurity}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>{t.settings.security.sslConnection}</Label>
                    <p className="text-sm text-gray-600">
                      {t.settings.security.dataProtection}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">{t.common.enabled}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab (Admin only) */}
        {user.role === 'admin' && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.settings.users.title}</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Users className="w-4 h-4 mr-2" />
                    {t.settings.users.createAccount}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.settings.users.name}</TableHead>
                      <TableHead>{t.settings.users.email}</TableHead>
                      <TableHead>{t.settings.users.role}</TableHead>
                      <TableHead className="text-right">{t.settings.users.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell className="text-gray-600">{u.email}</TableCell>
                        <TableCell>
                          <Select defaultValue={u.role}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="radiologue">{t.settings.roles.radiologue}</SelectItem>
                              <SelectItem value="oncologue">{t.settings.roles.oncologue}</SelectItem>
                              <SelectItem value="chirurgien">{t.settings.roles.chirurgien}</SelectItem>
                              <SelectItem value="admin">{t.settings.roles.admin}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              {t.common.edit}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {t.common.delete}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.settings.accessibility.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t.settings.accessibility.language}</Label>
                <Select value={language} onValueChange={(value: 'fr' | 'en') => setLanguage(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">
                      <span className="flex items-center gap-2">
                        <span>🇫🇷</span> Français
                      </span>
                    </SelectItem>
                    <SelectItem value="en">
                      <span className="flex items-center gap-2">
                        <span>🇬🇧</span> English
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.settings.accessibility.theme}</Label>
                <Select defaultValue="light">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t.settings.accessibility.themeLight}</SelectItem>
                    <SelectItem value="dark">{t.settings.accessibility.themeDark}</SelectItem>
                    <SelectItem value="auto">{t.settings.accessibility.themeAuto}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {t.settings.accessibility.interactiveGuide}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
