/**
 * Traductions pour les labels de prérequis
 */

export const prerequisiteLabels = {
  fr: {
    // Radiologue
    ct_scan_tap: 'Scanner thoraco-abdomino-pelvien',
    mri_targeted: 'IRM ciblée',
    pet_scan: 'TEP-scan (PET-CT)',
    mammography: 'Mammographie',
    ultrasound: 'Échographie spécialisée',
    imaging_review: 'Relecture des imageries',
    radiology_report: 'Compte-rendu radiologique',
    tumor_measurements: 'Mesures tumorales (RECIST)',
    imaging_comparison: 'Comparaison examens antérieurs',

    // Anatomo-pathologiste
    biopsy_result: 'Résultat de biopsie',
    histological_type: 'Type histologique',
    tumor_grade: 'Grade tumoral',
    surgical_margins: 'Marges chirurgicales',
    immunohistochemistry: 'Immunohistochimie',
    her2_er_pr_status: 'Statut HER2 / ER / PR',
    pathology_review: 'Relecture anatomo-pathologique',

    // Biologiste / Généticien
    mutational_analysis: 'Analyse mutationnelle (EGFR, KRAS, BRAF…)',
    ngs_sequencing: 'Séquençage NGS',
    brca_status: 'Statut BRCA',
    predictive_biomarkers: 'Biomarkers prédictifs',
    molecular_interpretation: 'Interprétation moléculaire',

    // Oncologue
    clinical_context: 'Contexte clinique complet',
    tnm_stage: 'Stade TNM validé',
    treatment_plan: 'Plan de traitement proposé',
    chemotherapy_indication: 'Indication chimiothérapie',
    immunotherapy_indication: 'Indication immunothérapie',
    ecog_performance: 'Performance status (ECOG)',
    clinical_trial_eligibility: 'Éligibilité essais cliniques',

    // Chirurgien
    surgical_feasibility: 'Faisabilité chirurgicale',
    surgery_type: 'Type de chirurgie proposée',
    surgical_risks: 'Risques opératoires',
    surgery_timeline: 'Délai opératoire',
    complete_resection: 'Résection complète envisageable',

    // Radiothérapeute
    radiotherapy_indication: 'Indication radiothérapie',
    target_volume: 'Volume cible défini',
    dose_fractionation: 'Dose et fractionnement',
    organ_constraints: 'Contraintes organes à risque',
    radiotherapy_plan: 'Plan de radiothérapie',

    // Infirmier / Coordonnateur
    pain_assessment: 'Évaluation douleur',
    nutritional_status: 'État nutritionnel',
    psychosocial_assessment: 'Évaluation psycho-sociale',
    support_care_needs: 'Besoins en soins de support',
    patient_consent: 'Consentement patient',
  },

  en: {
    // Radiologist
    ct_scan_tap: 'Thoraco-abdomino-pelvic CT scan',
    mri_targeted: 'Targeted MRI',
    pet_scan: 'PET scan (PET-CT)',
    mammography: 'Mammography',
    ultrasound: 'Specialized ultrasound',
    imaging_review: 'Imaging review',
    radiology_report: 'Radiology report',
    tumor_measurements: 'Tumor measurements (RECIST)',
    imaging_comparison: 'Comparison with previous exams',

    // Pathologist
    biopsy_result: 'Biopsy result',
    histological_type: 'Histological type',
    tumor_grade: 'Tumor grade',
    surgical_margins: 'Surgical margins',
    immunohistochemistry: 'Immunohistochemistry',
    her2_er_pr_status: 'HER2 / ER / PR status',
    pathology_review: 'Pathology review',

    // Biologist / Geneticist
    mutational_analysis: 'Mutational analysis (EGFR, KRAS, BRAF…)',
    ngs_sequencing: 'NGS sequencing',
    brca_status: 'BRCA status',
    predictive_biomarkers: 'Predictive biomarkers',
    molecular_interpretation: 'Molecular interpretation',

    // Oncologist
    clinical_context: 'Complete clinical context',
    tnm_stage: 'Validated TNM stage',
    treatment_plan: 'Proposed treatment plan',
    chemotherapy_indication: 'Chemotherapy indication',
    immunotherapy_indication: 'Immunotherapy indication',
    ecog_performance: 'Performance status (ECOG)',
    clinical_trial_eligibility: 'Clinical trial eligibility',

    // Surgeon
    surgical_feasibility: 'Surgical feasibility',
    surgery_type: 'Type of proposed surgery',
    surgical_risks: 'Surgical risks',
    surgery_timeline: 'Surgery timeline',
    complete_resection: 'Complete resection feasibility',

    // Radiation Oncologist
    radiotherapy_indication: 'Radiotherapy indication',
    target_volume: 'Defined target volume',
    dose_fractionation: 'Dose and fractionation',
    organ_constraints: 'Organ at risk constraints',
    radiotherapy_plan: 'Radiotherapy plan',

    // Nurse / Coordinator
    pain_assessment: 'Pain assessment',
    nutritional_status: 'Nutritional status',
    psychosocial_assessment: 'Psychosocial assessment',
    support_care_needs: 'Supportive care needs',
    patient_consent: 'Patient consent',
  },
} as const;

/**
 * Helper pour obtenir le label traduit d'un prérequis
 */
export function getPrerequisiteLabel(key: string, lang: 'fr' | 'en'): string {
  return prerequisiteLabels[lang][key as keyof typeof prerequisiteLabels.fr] || key;
}
