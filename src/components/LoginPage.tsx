import { useState } from 'react';
import { User, UserRole } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ShieldCheck, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication - simulate different user roles based on email
    let role: UserRole = 'oncologue';
    let name = 'Dr. Lefevre';
    
    if (email.includes('radiologue') || email.includes('martin')) {
      role = 'radiologue';
      name = 'Dr. Martin';
    } else if (email.includes('chirurgien') || email.includes('bernard')) {
      role = 'chirurgien';
      name = 'Dr. Bernard';
    } else if (email.includes('admin')) {
      role = 'admin';
      name = 'Admin';
    }
    
    const mockUser: User = {
      id: '1',
      name: name,
      email: email || 'dr.lefevre@hopital.fr',
      role: role
    };
    
    onLogin(mockUser);
  };

  const handleResetPassword = () => {
    if (resetEmail) {
      // Mock password reset
      setResetSent(true);
      setTimeout(() => {
        setShowResetDialog(false);
        setResetSent(false);
        setResetEmail('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-gray-900 mb-2">OncoLlab</h1>
            <p className="text-gray-600">Plateforme RCP Sécurisée</p>
            <p className="text-sm text-gray-500 mt-1">Réunion de Concertation Pluridisciplinaire</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@hopital.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setShowResetDialog(true)}
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Se connecter
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4 text-green-600" />
              <span>Connexion sécurisée SSL/TLS</span>
            </div>
            <div className="text-xs text-center text-gray-500">
              <p>Authentification OAuth2 / OpenID Connect</p>
              <p className="mt-1">Déconnexion automatique après 30 min d'inactivité</p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-4 text-center text-sm text-white/90 bg-blue-900/50 backdrop-blur-sm rounded-lg p-4 border border-blue-700/50">
          <p className="mb-2">📌 Mode Démo - Comptes de test disponibles :</p>
          <div className="text-xs space-y-1 text-white/80">
            <p>• radiologue@hopital.fr - Dr. Martin (Radiologue)</p>
            <p>• oncologue@hopital.fr - Dr. Lefevre (Oncologue)</p>
            <p>• chirurgien@hopital.fr - Dr. Bernard (Chirurgien)</p>
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialisation du mot de passe</DialogTitle>
            <DialogDescription>
              Entrez votre adresse email professionnelle. Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
            </DialogDescription>
          </DialogHeader>
          
          {resetSent ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email professionnel</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="prenom.nom@hopital.fr"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le lien de réinitialisation sera valide pendant 1 heure pour des raisons de sécurité.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            {!resetSent && (
              <>
                <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleResetPassword} className="bg-blue-600 hover:bg-blue-700">
                  Envoyer le lien
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
