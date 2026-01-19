import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  try {
    // Chemins vers tes certificats à la racine
    const keyPath = join(process.cwd(), '..', 'localhost+2-key.pem');
    const certPath = join(process.cwd(), '..', 'localhost+2.pem');

    console.log('Current working directory:', process.cwd());

    // Vérification de l'existence des fichiers
    if (!existsSync(keyPath) || !existsSync(certPath)) {
        console.error("❌ Fichiers SSL manquants !");
        console.log("Chemin clé attendu:", keyPath);
        console.log("Chemin cert attendu:", certPath);
        // On peut décider de démarrer sans HTTPS ici ou d'arrêter
    }

    const httpsOptions = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    };

    const app = await NestFactory.create(AppModule, {
      httpsOptions,
    });

    app.enableCors({
      origin: '*',
    });

    // Écoute sur le port 3000
    await app.listen(3000, '0.0.0.0');
    console.log('✅ Serveur sécurisé lancé sur https://localhost:3000');

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
  }
}
bootstrap();