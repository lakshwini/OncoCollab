import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DoctorsService } from '../doctors/doctors.service';
import { AuthDto } from './dto/auth.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
    constructor(
        private doctorsService: DoctorsService,
        private jwtService: JwtService
    ) { }

    async login(authDto: AuthDto) {
        const doctor = await this.doctorsService.findByEmail(authDto.email);
        if (!doctor) {
            throw new UnauthorizedException('Access Denied');
        }

        const passwordMatches = await argon2.verify(doctor.password, authDto.password);
        if (!passwordMatches) {
            throw new UnauthorizedException('Access Denied: Invalid password');
        }

        const payload = { sub: doctor.doctorID, email: doctor.email, role: doctor.role?.roleName };
        const token = this.jwtService.sign(payload);

        return { doctor, token };
    }
}
