/**
 * Référentiel des prérequis standards par spécialité
 * Ces templates sont proposés lors de la création d'une réunion
 */

export interface PrerequisiteTemplate {
  key: string;
  label: string;  // Deprecated: kept for backward compatibility, use label_fr/label_en
  label_fr: string;  // French label
  label_en: string;  // English label
  source?: 'orthanc' | 'document' | 'form';
}

export const PREREQUISITE_TEMPLATES: Record<string, PrerequisiteTemplate[]> = {
  'Radiologue': [
    { key: 'ct_scan_tap', label_fr: 'Scanner thoraco-abdomino-pelvien', label_en: 'CT scan thoraco-abdominal-pelvic', label: 'Scanner thoraco-abdomino-pelvien', source: 'orthanc' },
    { key: 'mri_targeted', label_fr: 'IRM ciblée', label_en: 'Targeted MRI', label: 'IRM ciblée', source: 'orthanc' },
    { key: 'pet_scan', label_fr: 'TEP-scan (PET-CT)', label_en: 'PET-CT scan', label: 'TEP-scan (PET-CT)', source: 'orthanc' },
    { key: 'mammography', label_fr: 'Mammographie', label_en: 'Mammography', label: 'Mammographie', source: 'orthanc' },
    { key: 'ultrasound', label_fr: 'Échographie spécialisée', label_en: 'Specialized ultrasound', label: 'Échographie spécialisée', source: 'orthanc' },
    { key: 'imaging_review', label_fr: 'Relecture des imageries', label_en: 'Imaging review', label: 'Relecture des imageries' },
    { key: 'radiology_report', label_fr: 'Compte-rendu radiologique', label_en: 'Radiology report', label: 'Compte-rendu radiologique', source: 'document' },
    { key: 'tumor_measurements', label_fr: 'Mesures tumorales (RECIST)', label_en: 'Tumor measurements (RECIST)', label: 'Mesures tumorales (RECIST)' },
    { key: 'imaging_comparison', label_fr: 'Comparaison examens antérieurs', label_en: 'Comparison with prior exams', label: 'Comparaison examens antérieurs' },
  ],

  'Anatomo-pathologiste': [
    { key: 'biopsy_result', label_fr: 'Résultat de biopsie', label_en: 'Biopsy result', label: 'Résultat de biopsie', source: 'document' },
    { key: 'histological_type', label_fr: 'Type histologique', label_en: 'Histological type', label: 'Type histologique' },
    { key: 'tumor_grade', label_fr: 'Grade tumoral', label_en: 'Tumor grade', label: 'Grade tumoral' },
    { key: 'surgical_margins', label_fr: 'Marges chirurgicales', label_en: 'Surgical margins', label: 'Marges chirurgicales' },
    { key: 'immunohistochemistry', label_fr: 'Immunohistochimie', label_en: 'Immunohistochemistry', label: 'Immunohistochimie' },
    { key: 'her2_er_pr_status', label_fr: 'Statut HER2 / ER / PR', label_en: 'HER2 / ER / PR status', label: 'Statut HER2 / ER / PR' },
    { key: 'pathology_review', label_fr: 'Relecture anatomo-pathologique', label_en: 'Pathology review', label: 'Relecture anatomo-pathologique' },
  ],

  'Biologiste': [
    { key: 'mutational_analysis', label_fr: 'Analyse mutationnelle (EGFR, KRAS, BRAF…)', label_en: 'Mutational analysis (EGFR, KRAS, BRAF…)', label: 'Analyse mutationnelle (EGFR, KRAS, BRAF…)' },
    { key: 'ngs_sequencing', label_fr: 'Séquençage NGS', label_en: 'NGS sequencing', label: 'Séquençage NGS' },
    { key: 'brca_status', label_fr: 'Statut BRCA', label_en: 'BRCA status', label: 'Statut BRCA' },
    { key: 'predictive_biomarkers', label_fr: 'Biomarkers prédictifs', label_en: 'Predictive biomarkers', label: 'Biomarkers prédictifs' },
    { key: 'molecular_interpretation', label_fr: 'Interprétation moléculaire', label_en: 'Molecular interpretation', label: 'Interprétation moléculaire' },
  ],

  'Généticien': [
    { key: 'mutational_analysis', label_fr: 'Analyse mutationnelle (EGFR, KRAS, BRAF…)', label_en: 'Mutational analysis (EGFR, KRAS, BRAF…)', label: 'Analyse mutationnelle (EGFR, KRAS, BRAF…)' },
    { key: 'ngs_sequencing', label_fr: 'Séquençage NGS', label_en: 'NGS sequencing', label: 'Séquençage NGS' },
    { key: 'brca_status', label_fr: 'Statut BRCA', label_en: 'BRCA status', label: 'Statut BRCA' },
    { key: 'predictive_biomarkers', label_fr: 'Biomarkers prédictifs', label_en: 'Predictive biomarkers', label: 'Biomarkers prédictifs' },
    { key: 'molecular_interpretation', label_fr: 'Interprétation moléculaire', label_en: 'Molecular interpretation', label: 'Interprétation moléculaire' },
  ],

  'Oncologue': [
    { key: 'clinical_context', label_fr: 'Contexte clinique complet', label_en: 'Complete clinical context', label: 'Contexte clinique complet' },
    { key: 'tnm_stage', label_fr: 'Stade TNM validé', label_en: 'Validated TNM stage', label: 'Stade TNM validé' },
    { key: 'treatment_plan', label_fr: 'Plan de traitement proposé', label_en: 'Proposed treatment plan', label: 'Plan de traitement proposé' },
    { key: 'chemotherapy_indication', label_fr: 'Indication chimiothérapie', label_en: 'Chemotherapy indication', label: 'Indication chimiothérapie' },
    { key: 'immunotherapy_indication', label_fr: 'Indication immunothérapie', label_en: 'Immunotherapy indication', label: 'Indication immunothérapie' },
    { key: 'ecog_performance', label_fr: 'Performance status (ECOG)', label_en: 'Performance status (ECOG)', label: 'Performance status (ECOG)' },
    { key: 'clinical_trial_eligibility', label_fr: 'Éligibilité essais cliniques', label_en: 'Clinical trial eligibility', label: 'Éligibilité essais cliniques' },
  ],

  'Chirurgien': [
    { key: 'surgical_feasibility', label_fr: 'Faisabilité chirurgicale', label_en: 'Surgical feasibility', label: 'Faisabilité chirurgicale' },
    { key: 'surgery_type', label_fr: 'Type de chirurgie proposée', label_en: 'Proposed surgery type', label: 'Type de chirurgie proposée' },
    { key: 'surgical_risks', label_fr: 'Risques opératoires', label_en: 'Surgical risks', label: 'Risques opératoires' },
    { key: 'surgery_timeline', label_fr: 'Délai opératoire', label_en: 'Surgery timeline', label: 'Délai opératoire' },
    { key: 'complete_resection', label_fr: 'Résection complète envisageable', label_en: 'Complete resection feasible', label: 'Résection complète envisageable' },
  ],

  'Radiothérapeute': [
    { key: 'radiotherapy_indication', label_fr: 'Indication radiothérapie', label_en: 'Radiotherapy indication', label: 'Indication radiothérapie' },
    { key: 'target_volume', label_fr: 'Volume cible défini', label_en: 'Target volume defined', label: 'Volume cible défini' },
    { key: 'dose_fractionation', label_fr: 'Dose et fractionnement', label_en: 'Dose and fractionation', label: 'Dose et fractionnement' },
    { key: 'organ_constraints', label_fr: 'Contraintes organes à risque', label_en: 'Organs at risk constraints', label: 'Contraintes organes à risque' },
    { key: 'radiotherapy_plan', label_fr: 'Plan de radiothérapie', label_en: 'Radiotherapy plan', label: 'Plan de radiothérapie' },
  ],

  'Infirmier': [
    { key: 'pain_assessment', label_fr: 'Évaluation douleur', label_en: 'Pain assessment', label: 'Évaluation douleur' },
    { key: 'nutritional_status', label_fr: 'État nutritionnel', label_en: 'Nutritional status', label: 'État nutritionnel' },
    { key: 'psychosocial_assessment', label_fr: 'Évaluation psycho-sociale', label_en: 'Psychosocial assessment', label: 'Évaluation psycho-sociale' },
    { key: 'support_care_needs', label_fr: 'Besoins en soins de support', label_en: 'Support care needs', label: 'Besoins en soins de support' },
    { key: 'patient_consent', label_fr: 'Consentement patient', label_en: 'Patient consent', label: 'Consentement patient' },
  ],

  'Coordonnateur': [
    { key: 'pain_assessment', label_fr: 'Évaluation douleur', label_en: 'Pain assessment', label: 'Évaluation douleur' },
    { key: 'nutritional_status', label_fr: 'État nutritionnel', label_en: 'Nutritional status', label: 'État nutritionnel' },
    { key: 'psychosocial_assessment', label_fr: 'Évaluation psycho-sociale', label_en: 'Psychosocial assessment', label: 'Évaluation psycho-sociale' },
    { key: 'support_care_needs', label_fr: 'Besoins en soins de support', label_en: 'Support care needs', label: 'Besoins en soins de support' },
    { key: 'patient_consent', label_fr: 'Consentement patient', label_en: 'Patient consent', label: 'Consentement patient' },
  ],
};

/**
 * Récupère les templates de prérequis pour une spécialité donnée
 */
export function getPrerequisiteTemplatesForSpeciality(speciality: string): PrerequisiteTemplate[] {
  return PREREQUISITE_TEMPLATES[speciality] || [];
}

/**
 * Récupère tous les templates de prérequis (toutes spécialités)
 */
export function getAllPrerequisiteTemplates(): Record<string, PrerequisiteTemplate[]> {
  return PREREQUISITE_TEMPLATES;
}
