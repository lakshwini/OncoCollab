import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { RoomsModule } from './rooms/rooms.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Chargement des variables d'environnement (.env)
    ConfigModule.forRoot({ isGlobal: true }),

    // Configuration de la connexion PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'laksh',     // Ton utilisateur Mac
      password: 'laksh',     // Ton mot de passe d'après le .env
      database: 'OncoCollab', // Nom exact de ta base SQL
      autoLoadEntities: true, // Charge automatiquement User, Message, Room, etc.
      synchronize: true,      // Crée les tables manquantes automatiquement
    }),

    UsersModule,
    MessagesModule,
    RoomsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}