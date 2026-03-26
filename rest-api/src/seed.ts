import { createConnection } from 'typeorm';
import * as argon2 from 'argon2';

async function seed() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: +(process.env.POSTGRES_PORT || 5432),
    username: process.env.POSTGRES_USER || 'laksh',
    password: process.env.POSTGRES_PASSWORD || 'laksh',
    database: process.env.POSTGRES_DB || 'OncoCollab',
  });

  // Update passwords
  const doctors = [
    { email: 'dr.germain@hospital.fr', password: 'L@kshwini29' },
    { email: 'dr.michel@hospital.fr', password: 'L@kshwini29' },
    { email: 'dr.rivière@hospital.fr', password: 'L@kshwini29' },
    { email: 'dr.clerc@hospital.fr', password: 'L@kshwini29' },
    { email: 'dr.chevallier@hospital.fr', password: 'L@kshwini29' },
  ];

  for (const doctor of doctors) {
    const hashedPassword = await argon2.hash(doctor.password);
    await connection.query('UPDATE doctors SET password = $1 WHERE email = $2', [hashedPassword, doctor.email]);
    console.log(`Mot de passe de ${doctor.email} mis à jour`);
  }

  await connection.close();
  console.log('Seeding terminé');
}

seed().catch(console.error);