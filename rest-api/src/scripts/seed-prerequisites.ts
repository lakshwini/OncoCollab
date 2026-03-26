import { MongoClient } from 'mongodb';
import { ConfigService } from '@nestjs/config';

/**
 * Script pour créer des données de test pour les prérequis RCP
 *
 * IMPORTANT : Avant d'exécuter ce script, assurez-vous d'avoir :
 * 1. MongoDB installé et démarré (mongod)
 * 2. Des meetings et doctors dans PostgreSQL
 * 3. Modifié les UUIDs ci-dessous avec vos vrais IDs PostgreSQL
 */

async function seedPrerequisites() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = await MongoClient.connect(mongoUri);
  const db = client.db('oncocollab_prerequisites');

  console.log('🔗 Connecté à MongoDB');

  // ⚠️ REMPLACER CES UUIDs PAR VOS VRAIS IDs DEPUIS POSTGRESQL
  const MEETING_IDS = {
    rcp_thoracique: 'UUID-DE-VOTRE-MEETING-1',
    rcp_digestif: 'UUID-DE-VOTRE-MEETING-2',
  };

  const PATIENT_IDS = {
    patient_1: 'UUID-DE-VOTRE-PATIENT-1',
    patient_2: 'UUID-DE-VOTRE-PATIENT-2',
  };

  const DOCTOR_IDS = {
    dr_michel: '19f210fa-7fab-47a8-badd-fdb7cf1a5c0d',
    dr_chevallier: '9b5285be-a2bb-4600-9c40-68622beb53cd',
    dr_3: 'aa6ac14f-40b3-4229-a11f-93b7e63bd8e1',
    dr_4: 'b8c1e041-f642-46dc-9eb0-196ac81dbc66',
  };

  // 📋 Données de test pour les prérequis
  const prerequisites = [
    {
      meeting_id: MEETING_IDS.rcp_thoracique,
      patient_id: PATIENT_IDS.patient_1,
      status: 'in_progress',
      doctors: [
        {
          doctor_id: DOCTOR_IDS.dr_michel,
          speciality: 'Oncologue',
          items: [
            {
              key: 'consult_dossier',
              label: 'Consulter le dossier patient',
              status: 'done',
              source: 'document',
              reference_id: null,
            },
            {
              key: 'analyse_bio',
              label: 'Analyser les bilans biologiques',
              status: 'done',
              source: 'document',
              reference_id: 'BIO-2026-001',
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
              status: 'pending',
              source: 'document',
              reference_id: null,
            },
          ],
        },
        {
          doctor_id: DOCTOR_IDS.dr_chevallier,
          speciality: 'Radiologue',
          items: [
            {
              key: 'consult_dossier',
              label: 'Consulter le dossier patient',
              status: 'done',
              source: 'document',
              reference_id: null,
            },
            {
              key: 'analyse_scanner',
              label: 'Analyser le scanner thoracique',
              status: 'done',
              source: 'orthanc',
              reference_id: 'SCAN-20260201-001',
            },
            {
              key: 'mesures_lesions',
              label: 'Effectuer les mesures des lésions',
              status: 'pending',
              source: 'orthanc',
              reference_id: null,
            },
          ],
        },
        {
          doctor_id: DOCTOR_IDS.dr_3,
          speciality: 'Chirurgien',
          items: [
            {
              key: 'consult_dossier',
              label: 'Consulter le dossier patient',
              status: 'pending',
              source: 'document',
              reference_id: null,
            },
            {
              key: 'eval_operabilite',
              label: 'Évaluer l\'opérabilité',
              status: 'pending',
              source: 'orthanc',
              reference_id: null,
            },
          ],
        },
      ],
    },
    {
      meeting_id: MEETING_IDS.rcp_digestif,
      patient_id: PATIENT_IDS.patient_2,
      status: 'ready',
      doctors: [
        {
          doctor_id: DOCTOR_IDS.dr_michel,
          speciality: 'Oncologue',
          items: [
            {
              key: 'consult_dossier',
              label: 'Consulter le dossier patient',
              status: 'done',
              source: 'document',
              reference_id: null,
            },
            {
              key: 'analyse_bio',
              label: 'Analyser les bilans biologiques',
              status: 'done',
              source: 'document',
              reference_id: 'BIO-2026-002',
            },
          ],
        },
        {
          doctor_id: DOCTOR_IDS.dr_4,
          speciality: 'Gastro-entérologue',
          items: [
            {
              key: 'consult_dossier',
              label: 'Consulter le dossier patient',
              status: 'done',
              source: 'document',
              reference_id: null,
            },
            {
              key: 'endoscopie',
              label: 'Analyser les résultats d\'endoscopie',
              status: 'done',
              source: 'document',
              reference_id: 'ENDO-2026-045',
            },
          ],
        },
      ],
    },
  ];

  // 🗑️ Nettoyer les données existantes
  await db.collection('meeting_prerequisites').deleteMany({});
  console.log('🧹 Collection nettoyée');

  // 💾 Insérer les nouvelles données
  const result = await db.collection('meeting_prerequisites').insertMany(prerequisites);
  console.log(`✅ ${result.insertedCount} documents insérés`);

  // 📊 Afficher un résumé
  console.log('\n📋 Résumé des prérequis créés:');
  for (const prereq of prerequisites) {
    const totalItems = prereq.doctors.reduce((sum, doc) => sum + doc.items.length, 0);
    const doneItems = prereq.doctors.reduce(
      (sum, doc) => sum + doc.items.filter((item) => item.status === 'done').length,
      0,
    );
    console.log(`  - Meeting ${prereq.meeting_id.substring(0, 8)}... : ${doneItems}/${totalItems} complétés`);
  }

  await client.close();
  console.log('\n✅ Seed terminé avec succès!');
}

// Exécution
seedPrerequisites()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
