import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { SupabaseService } from './supabase.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly supabaseService: SupabaseService,
    ) { }

    /**
     * ✅ Route EXISTANTE (ne pas supprimer)
     * Login avec système custom (argon2 + JWT)
     */
    @Post('login')
    login(@Body() authDto: AuthDto) {
        return this.authService.login(authDto);
    }

    /**
     * ✅ NOUVELLE ROUTE Supabase
     * Login avec Supabase Auth
     */
    @Post('supabase/login')
    async supabaseLogin(@Body() body: { email: string; password: string }) {
        const result = await this.supabaseService.signIn(body.email, body.password);
        return {
            session: result.session,
            user: result.user,
        };
    }

    /**
     * ✅ NOUVELLE ROUTE Supabase
     * Signup avec Supabase Auth
     */
    @Post('supabase/signup')
    async supabaseSignup(@Body() body: { email: string; password: string }) {
        const result = await this.supabaseService.signUp(body.email, body.password);
        return {
            session: result.session,
            user: result.user,
        };
    }

    /**
     * ✅ NOUVELLE ROUTE Supabase OTP
     * Envoyer un OTP par email
     */
    @Post('supabase/otp/send')
    async supabaseSendOTP(@Body() body: { email: string }) {
        await this.supabaseService.sendOTP(body.email);
        return {
            success: true,
            message: 'OTP envoyé par email',
        };
    }

    /**
     * ✅ NOUVELLE ROUTE Supabase OTP
     * Vérifier un OTP
     */
    @Post('supabase/otp/verify')
    async supabaseVerifyOTP(@Body() body: { email: string; token: string }) {
        const result = await this.supabaseService.verifyOTP(body.email, body.token);
        return {
            session: result.session,
            user: result.user,
        };
    }

    /**
     * ✅ NOUVELLE ROUTE Supabase
     * Déconnexion Supabase
     */
    @Post('supabase/logout')
    async supabaseLogout() {
        await this.supabaseService.signOut();
        return {
            success: true,
            message: 'Déconnecté avec succès',
        };
    }
}
