import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script pour exécuter les migrations SQL manuelles
 * Usage: npx ts-node src/scripts/run-migration.ts
 */

async function runMigration() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'laksh',
    password: process.env.POSTGRES_PASSWORD || 'laksh',
    database: process.env.POSTGRES_DB || 'OncoCollab',
  });

  try {
    console.log('🔌 Connexion à PostgreSQL...');
    await dataSource.initialize();
    console.log('✅ Connecté à PostgreSQL');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'migrations', '001_add_profile_image_url.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🔄 Exécution de la migration...');
    await dataSource.query(sqlContent);
    console.log('✅ Migration exécutée avec succès !');

    await dataSource.destroy();
    console.log('🔌 Déconnecté de PostgreSQL');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
