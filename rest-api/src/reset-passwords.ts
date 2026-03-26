import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'laksh',
  password: 'laksh',
  database: 'OncoCollab',
});

async function resetPasswords() {
  await AppDataSource.initialize();
  console.log('✅ Connecté à PostgreSQL');

  const plainPassword = 'L@kshwini29';
  const hashedPassword = await argon2.hash(plainPassword);

  console.log('🔐 Hash généré:', hashedPassword);

  // Mettre à jour tous les docteurs avec le même mot de passe
  const result = await AppDataSource.query(
    `UPDATE doctors SET password = $1 WHERE email IN (
      'dr.germain@hospital.fr',
      'dr.michel@hospital.fr',
      'dr.rivière@hospital.fr',
      'dr.clerc@hospital.fr',
      'dr.chevallier@hospital.fr'
    )`,
    [hashedPassword]
  );

  console.log('✅ Mots de passe mis à jour pour tous les docteurs');
  console.log(`📊 ${result[1]} docteurs modifiés`);

  // Vérifier les emails mis à jour
  const doctors = await AppDataSource.query(
    `SELECT email, firstname, lastname FROM doctors WHERE email LIKE '%@hospital.fr'`
  );

  console.log('\n📋 Comptes disponibles :');
  doctors.forEach((doc: any) => {
    console.log(`   - ${doc.email} (${doc.firstname} ${doc.lastname})`);
  });

  console.log('\n🔑 Mot de passe pour tous : L@kshwini29');

  await AppDataSource.destroy();
}

resetPasswords()
  .then(() => {
    console.log('\n✅ Terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
