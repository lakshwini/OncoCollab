import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';

function isPortAvailable(port: number, host = '0.0.0.0'): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.unref();
    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function bootstrap() {
  try {
    const port = parseInt(process.env.PORT || '3002', 10);
    const useHttps = process.env.USE_HTTPS === 'true';

    if (!(await isPortAvailable(port))) {
      console.error(`❌ Le port ${port} est déjà utilisé.`);
      console.error(`💡 Libérez le port avec: lsof -ti tcp:${port} | xargs kill -9`);
      console.error('💡 Ou définissez une autre valeur pour PORT.');
      process.exit(1);
    }

    let app: NestExpressApplication;

    if (useHttps) {
      // Configuration HTTPS avec les certificats locaux
      const certPath = path.join(__dirname, '../../localhost+2.pem');
      const keyPath = path.join(__dirname, '../../localhost+2-key.pem');

      // Vérifier que les certificats existent
      if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        console.error('❌ Certificats HTTPS introuvables !');
        console.error(`   Certificat: ${certPath}`);
        console.error(`   Clé: ${keyPath}`);
        console.log('💡 Conseil: Générez les certificats avec mkcert ou placez-les à la racine du projet');
        process.exit(1);
      }

      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };

      app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions });

      console.log('🔒 Mode HTTPS activé');
    } else {
      // Mode HTTP simple (développement)
      app = await NestFactory.create<NestExpressApplication>(AppModule);
      console.log('⚠️  Mode HTTP (non sécurisé)');
    }

    // ✅ Body parser : limites élargies pour les requêtes JSON/urlencoded longues.
    // Les uploads multipart (audio RCP) passent par Multer/FileInterceptor avec sa propre limite,
    // donc ces limites-ci ne s'appliquent qu'aux JSON et formulaires classiques.
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));

    // ✅ CORS — `origin: true` réfléchit l'origine de la requête, ce qui
    // est compatible avec credentials:true (interdit avec '*' par la spec).
    // Couvre frontend Docker (http://localhost) ET Vite dev (http://localhost:5173).
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    });

    // Écoute sur le port configuré avec gestion d'erreur
    const server = await app.listen(port, '0.0.0.0');

    // Gestion d'erreur si le port est déjà utilisé
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} déjà utilisé!`);
        console.error('💡 Solutions:');
        console.error(`   1. Arrêter le processus: lsof -i :${port} | grep LISTEN`);
        console.error(`   2. Changer le port: export PORT=3003`);
        console.error(`   3. Docker: docker-compose down && docker-compose up --build -d`);
        process.exit(1);
      }
      throw err;
    });

    const protocol = useHttps ? 'https' : 'http';
    const wsProtocol = useHttps ? 'wss' : 'ws';

    console.log('\n✅ Serveur NestJS démarré avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 API REST:     ${protocol}://localhost:${port}`);
    console.log(`🔌 WebSocket:    ${wsProtocol}://localhost:${port}`);
    console.log(`📡 Auth:         ${protocol}://localhost:${port}/auth/login`);
    console.log(`📹 Video:        ${wsProtocol}://localhost:${port}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n💡 Port: ${port} (configurable via PORT env var)`);
    console.log(`💡 Mode: ${useHttps ? 'HTTPS (Sécurisé)' : 'HTTP (Développement)'}`);
    console.log(`💡 Pour activer HTTPS: Définir USE_HTTPS=true dans .env\n`);

  } catch (error) {
    const serverError = error as NodeJS.ErrnoException;

    if (serverError.code === 'EADDRINUSE') {
      console.error(`❌ Le port ${process.env.PORT || '3002'} est déjà utilisé.`);
      console.error(`💡 Libérez le port avec: lsof -ti tcp:${process.env.PORT || '3002'} | xargs kill -9`);
      console.error('💡 Ou changez PORT dans le .env.');
      process.exit(1);
    }

    console.error('❌ Erreur lors du démarrage du serveur:', serverError.message);
    console.error(serverError.stack);
    process.exit(1);
  }
}
bootstrap();
