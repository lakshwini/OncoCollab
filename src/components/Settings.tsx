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

interface SettingsProps {
  user: User;
}

export function Settings({ user }: SettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [platformNotifications, setPlatformNotifications] = useState(true);
  const [meetingReminders, setMeetingReminders] = useState(true);

  const users = [
    { id: '1', name: 'Dr. Laurent Martin', email: 'laurent.martin@hopital.fr', role: 'radiologue' },
    { id: '2', name: 'Dr. Marie Dubois', email: 'marie.dubois@hopital.fr', role: 'oncologue' },
    { id: '3', name: 'Dr. Sophie Chen', email: 'sophie.chen@hopital.fr', role: 'oncologue' },
    { id: '4', name: 'Dr. Pierre Laurent', email: 'pierre.laurent@hopital.fr', role: 'chirurgien' },
  ];

  const roleLabels: Record<string, string> = {
    radiologue: 'Radiologue',
    oncologue: 'Oncologue',
    chirurgien: 'Chirurgien',
    admin: 'Administrateur',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-gray-900 mb-1">Paramètres</h1>
        <p className="text-gray-600">Gérez vos préférences et les paramètres de l'application</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          {user.role === 'admin' && (
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
          )}
          <TabsTrigger value="accessibility">
            <Globe className="w-4 h-4 mr-2" />
            Accessibilité
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notifications par e-mail</Label>
                  <p className="text-sm text-gray-600">
                    Recevez des e-mails pour les événements importants
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notifications sur la plateforme</Label>
                  <p className="text-sm text-gray-600">
                    Affichez les notifications dans l'application
                  </p>
                </div>
                <Switch
                  checked={platformNotifications}
                  onCheckedChange={setPlatformNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Rappels de réunion</Label>
                  <p className="text-sm text-gray-600">
                    Recevoir un rappel 1h avant chaque RCP
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
              <CardTitle>Sécurité du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label>Confirmer le nouveau mot de passe</Label>
                <Input type="password" placeholder="••••••••" />
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">
                Mettre à jour le mot de passe
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Session de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Votre session expirera automatiquement après <strong>30 minutes d'inactivité</strong> pour votre sécurité.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Connexion sécurisée SSL/TLS</Label>
                    <p className="text-sm text-gray-600">
                      Protection des données en transit
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Activée</span>
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
                  <CardTitle>Gestion des utilisateurs</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Users className="w-4 h-4 mr-2" />
                    Créer un compte
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                              <SelectItem value="radiologue">Radiologue</SelectItem>
                              <SelectItem value="oncologue">Oncologue</SelectItem>
                              <SelectItem value="chirurgien">Chirurgien</SelectItem>
                              <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              Modifier
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Supprimer
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
              <CardTitle>Options d'accessibilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Langue de l'interface</Label>
                <Select defaultValue="fr">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thème</Label>
                <Select defaultValue="light">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="auto">Automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Guide interactif
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
