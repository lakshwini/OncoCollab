import { useState, useRef, useEffect } from 'react';
import { User } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { authService } from '../services/auth.service';
import { useLanguage } from '../i18n';

interface LoginPageProps {
  onLogin: (user: User, token?: string) => void;
}

type LoginStep = 'credentials' | 'otp';

export function LoginPage({ onLogin }: LoginPageProps) {
  const { t } = useLanguage();

  // États pour les identifiants
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // États pour l'OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<LoginStep>('credentials');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // États généraux
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ user: any; token: string } | null>(null);

  // Refs pour les inputs OTP
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus sur le premier input OTP quand on passe à l'étape OTP
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // Générer un code OTP à 6 chiffres
  const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Première étape : vérification des identifiants
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Appel à l'API NestJS - interroge la table doctors de PostgreSQL
      const { user, token } = await authService.login({ email, password });

      // Stocker les infos utilisateur pour après la vérification OTP
      setPendingUser({ user, token });

      // Générer et afficher le code OTP (en production, envoyé par email/SMS)
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);

      // Passer à l'étape OTP
      setStep('otp');
      setSuccess(`${t.login.verificationCodeSent} ${newOtp}`);

    } catch (err: any) {
      console.error('Erreur de connexion:', err);

      if (err.message?.includes('fetch') || err.message?.includes('Failed') || err.message?.includes('NetworkError')) {
        setError(t.login.serverError);
      } else if (err.message?.includes('Access Denied') || err.message?.includes('Unauthorized')) {
        setError(t.login.invalidCredentials);
      } else {
        setError(t.login.genericError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de la saisie OTP
  const handleOtpChange = (index: number, value: string) => {
    // Accepter uniquement les chiffres
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Gestion du backspace dans l'OTP
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Gestion du collage d'OTP
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setOtp(newOtp.slice(0, 6));
      // Focus sur le dernier champ rempli ou le suivant
      const focusIndex = Math.min(pastedData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  // Vérification de l'OTP
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const enteredOtp = otp.join('');

    // Vérifier le code OTP
    setTimeout(() => {
      if (enteredOtp === generatedOtp) {
        if (pendingUser) {
          // Transformer le user du backend vers le format App.tsx
          const appUser: User = {
            id: pendingUser.user.id,
            name: `${pendingUser.user.prenom} ${pendingUser.user.nom}`,
            email: pendingUser.user.email,
            role: pendingUser.user.role.toLowerCase() as any,
          };

          onLogin(appUser, pendingUser.token);
        }
      } else {
        setError(t.login.incorrectCode);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
      setIsLoading(false);
    }, 500);
  };

  // Retour à l'étape des identifiants
  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp(['', '', '', '', '', '']);
    setError(null);
    setSuccess(null);
    setPendingUser(null);
    setGeneratedOtp('');
  };

  // Renvoyer le code OTP
  const handleResendOtp = () => {
    const newOtp = generateOtp();
    setGeneratedOtp(newOtp);
    setOtp(['', '', '', '', '', '']);
    setError(null);
    setSuccess(`${t.login.newCodeSent} ${newOtp}`);
    otpRefs.current[0]?.focus();
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.login.title}</h1>
            <p className="text-gray-600">{t.login.subtitle}</p>
            <p className="text-sm text-gray-500 mt-1">{t.login.rcpMeeting}</p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Étape 1 : Identifiants */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t.login.professionalEmail}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.login.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.login.password}</Label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                    onClick={() => setError(t.login.forgotPasswordMsg)}
                  >
                    {t.login.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.login.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.login.verifying}
                  </>
                ) : (
                  t.login.continue
                )}
              </Button>
            </form>
          )}

          {/* Étape 2 : Vérification OTP */}
          {step === 'otp' && (
            <div className="space-y-6">
              {/* Bouton retour */}
              <button
                type="button"
                onClick={handleBackToCredentials}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.common.back}
              </button>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <KeyRound className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t.login.twoFactorAuth}
                </h2>
                <p className="text-sm text-gray-600">
                  {t.login.enterCode}<br />
                  <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {/* Champs OTP */}
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-medium"
                  disabled={isLoading || otp.some(d => !d)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.login.verifying}
                    </>
                  ) : (
                    t.login.verifyAndLogin
                  )}
                </Button>

                {/* Renvoyer le code */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {t.login.didntReceiveCode}{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      disabled={isLoading}
                    >
                      {t.login.resend}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              {t.login.accessRestricted}
              <br />
              {t.login.secureConnection}
            </p>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1 text-xs text-white/60">
            <ShieldCheck className="w-4 h-4" />
            <span>2FA</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/60">
            <Lock className="w-4 h-4" />
            <span>{t.login.tlsEncryption}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/60">
            <KeyRound className="w-4 h-4" />
            <span>JWT</span>
          </div>
        </div>

        {/* Version info */}
        <p className="mt-2 text-center text-xs text-white/50">
          OncoCollab v1.0 - © 2024 {t.common.allRightsReserved}
        </p>
      </div>
    </div>
  );
}
