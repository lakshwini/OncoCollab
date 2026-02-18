import { IsString, IsNotEmpty, IsArray, IsMongoId, IsDateString, IsOptional } from 'class-validator';

export class CreateRoomDto {
    @IsString()
    @IsOptional()
    roomId?: string;

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsArray()
    @IsMongoId({ each: true })
    requiredParticipants: string[];

    @IsMongoId()
    @IsNotEmpty()
    roomAdmin: string;

    @IsDateString()
    @IsNotEmpty()
    startedAt: string;

    @IsString()
    @IsNotEmpty()
    duration: string;
}
