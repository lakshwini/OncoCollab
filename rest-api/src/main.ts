import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  try {
    const port = process.env.PORT || 3002;
    const useHttps = process.env.USE_HTTPS === 'true';

    let app;

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

      app = await NestFactory.create(AppModule, { httpsOptions });

      console.log('🔒 Mode HTTPS activé');
    } else {
      // Mode HTTP simple (développement)
      app = await NestFactory.create(AppModule);
      console.log('⚠️  Mode HTTP (non sécurisé)');
    }

    // Activer CORS pour permettre les connexions depuis le frontend
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });

    // Écoute sur le port configuré
    await app.listen(port, '0.0.0.0');

    const protocol = useHttps ? 'https' : 'http';
    const wsProtocol = useHttps ? 'wss' : 'ws';

    console.log('\n✅ Serveur NestJS démarré avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 API REST:     ${protocol}://localhost:${port}`);
    console.log(`🔌 WebSocket:    ${wsProtocol}://localhost:${port}`);
    console.log(`📡 Auth:         ${protocol}://localhost:${port}/auth/login`);
    console.log(`📹 Video:        ${wsProtocol}://localhost:${port}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n💡 Mode: ${useHttps ? 'HTTPS (Sécurisé)' : 'HTTP (Développement)'}`);
    console.log(`💡 Pour activer HTTPS: Définir USE_HTTPS=true dans .env\n`);

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}
bootstrap();
