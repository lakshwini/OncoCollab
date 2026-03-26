import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

/**
 * Script pour initialiser automatiquement les prérequis
 * depuis les données existantes PostgreSQL
 *
 * Usage: npx ts-node src/scripts/setup-prerequisites.ts
 */

async function setupPrerequisites() {
  console.log('🚀 Initialisation des prérequis RCP\n');

  // 1️⃣ Connexion PostgreSQL
  const pgPool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'laksh',
    password: process.env.POSTGRES_PASSWORD || 'laksh',
    database: process.env.POSTGRES_DB || 'OncoCollab',
  });

  // 2️⃣ Connexion MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const mongoClient = await MongoClient.connect(mongoUri);
  const db = mongoClient.db('oncocollab_prerequisites');

  console.log('✅ Connecté à PostgreSQL et MongoDB\n');

  // 3️⃣ Récupérer les meetings avec participants
  const meetingsQuery = `
    SELECT
      m.id as meeting_id,
      m.title,
      m.status,
      m.created_by,
      mp.doctor_id,
      d.firstname,
      d.lastname,
      s.name as speciality
    FROM meetings m
    JOIN meeting_participants mp ON m.id = mp.meeting_id
    JOIN doctors d ON mp.doctor_id = d.doctorid
    LEFT JOIN specialties s ON d.speciality_id = s.id
    WHERE m.status IN ('scheduled', 'pending')
    ORDER BY m.id, mp.doctor_id
  `;

  const meetingsResult = await pgPool.query(meetingsQuery);
  console.log(`📊 ${meetingsResult.rows.length} participations trouvées\n`);

  if (meetingsResult.rows.length === 0) {
    console.log('⚠️  Aucune réunion trouvée. Créez d\'abord des meetings et participants dans PostgreSQL.');
    await pgPool.end();
    await mongoClient.close();
    return;
  }

  // 4️⃣ Grouper par meeting
  const meetingMap = new Map<string, any>();

  for (const row of meetingsResult.rows) {
    if (!meetingMap.has(row.meeting_id)) {
      meetingMap.set(row.meeting_id, {
        meeting_id: row.meeting_id,
        title: row.title,
        patient_id: 'PATIENT-' + row.meeting_id.substring(0, 8), // Placeholder
        status: 'in_progress',
        doctors: [],
      });
    }

    const meeting = meetingMap.get(row.meeting_id);

    // 5️⃣ Générer des prérequis par spécialité
    const items = generatePrerequisitesBySpeciality(row.speciality || 'Généraliste');

    meeting.doctors.push({
      doctor_id: row.doctor_id,
      speciality: row.speciality || 'Généraliste',
      items,
    });
  }

  // 6️⃣ Insérer dans MongoDB
  const prerequisites = Array.from(meetingMap.values());

  await db.collection('meeting_prerequisites').deleteMany({});
  console.log('🧹 Collection nettoyée');

  const result = await db.collection('meeting_prerequisites').insertMany(prerequisites);
  console.log(`✅ ${result.insertedCount} documents insérés\n`);

  // 7️⃣ Afficher un résumé
  console.log('📋 Résumé des prérequis créés:');
  for (const prereq of prerequisites) {
    const totalItems = prereq.doctors.reduce((sum: number, doc: any) => sum + doc.items.length, 0);
    const doneItems = prereq.doctors.reduce(
      (sum: number, doc: any) => sum + doc.items.filter((item: any) => item.status === 'done').length,
      0,
    );
    console.log(
      `  📄 ${prereq.title || 'Réunion'} (${prereq.meeting_id.substring(0, 8)}...)`,
    );
    console.log(`     └─ ${prereq.doctors.length} médecins, ${doneItems}/${totalItems} prérequis complétés`);
  }

  await pgPool.end();
  await mongoClient.close();
  console.log('\n✅ Setup terminé avec succès!');
  console.log('\n💡 Vous pouvez maintenant tester l\'API:');
  console.log('   GET http://localhost:3002/prerequisites/me');
}

/**
 * Génère des prérequis par spécialité médicale
 */
function generatePrerequisitesBySpeciality(speciality: string) {
  const commonItems = [
    {
      key: 'consult_dossier',
      label: 'Consulter le dossier patient',
      status: Math.random() > 0.3 ? 'done' : 'pending',
      source: 'document',
      reference_id: null,
    },
  ];

  const specialityItems: Record<string, any[]> = {
    Oncologue: [
      {
        key: 'analyse_bio',
        label: 'Analyser les bilans biologiques',
        status: Math.random() > 0.5 ? 'done' : 'pending',
        source: 'document',
        reference_id: 'BIO-2026-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      },
      {
        key: 'protocole_traitement',
        label: 'Préparer le protocole de traitement',
        status: 'pending',
        source: 'document',
        reference_id: null,
      },
      {
        key: 'contre_indications',
        label: 'Vérifier les contre-indications',
        status: Math.random() > 0.7 ? 'done' : 'pending',
        source: 'document',
        reference_id: null,
      },
    ],
    Radiologue: [
      {
        key: 'analyse_imagerie',
        label: 'Analyser les imageries (Scanner, IRM)',
        status: Math.random() > 0.5 ? 'done' : 'pending',
        source: 'orthanc',
        reference_id: 'IMG-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      },
      {
        key: 'mesures_lesions',
        label: 'Effectuer les mesures des lésions',
        status: 'pending',
        source: 'orthanc',
        reference_id: null,
      },
      {
        key: 'annotations',
        label: 'Préparer les annotations',
        status: 'pending',
        source: 'orthanc',
        reference_id: null,
      },
    ],
    Chirurgien: [
      {
        key: 'eval_operabilite',
        label: 'Évaluer la faisabilité chirurgicale',
        status: 'pending',
        source: 'orthanc',
        reference_id: null,
      },
      {
        key: 'options_operatoires',
        label: 'Définir les options opératoires',
        status: 'pending',
        source: 'document',
        reference_id: null,
      },
      {
        key: 'risques',
        label: 'Évaluer les risques périopératoires',
        status: 'pending',
        source: 'document',
        reference_id: null,
      },
    ],
    Pathologiste: [
      {
        key: 'anapath',
        label: 'Analyser les résultats anatomopathologiques',
        status: Math.random() > 0.5 ? 'done' : 'pending',
        source: 'document',
        reference_id: 'AP-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      },
      {
        key: 'marqueurs_immuno',
        label: 'Vérifier les marqueurs immunohistochimiques',
        status: 'pending',
        source: 'document',
        reference_id: null,
      },
    ],
  };

  const items = specialityItems[speciality] || [
    {
      key: 'preparation',
      label: 'Préparer la présentation du cas',
      status: 'pending',
      source: 'document',
      reference_id: null,
    },
  ];

  return [...commonItems, ...items];
}

// Exécution
setupPrerequisites()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    console.error(error.stack);
    process.exit(1);
  });
