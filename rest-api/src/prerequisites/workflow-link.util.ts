/**
 * Identifiant stable et déterministe reliant les prérequis d'un médecin pour une réunion
 * à UN SEUL workflow (chaîne complète) dans l'éditeur externe (Api_Editeur_Workflow /
 * Orchestrator, port 9092). Un workflow = tous les prérequis de ce médecin pour cette
 * réunion, chaque prérequis devenant une étape de la chaîne.
 *
 * Déterministe = pas besoin de stocker la relation en base : le même couple
 * (meetingId, doctorId) produit toujours le même workflow_id.
 */
export function computeWorkflowId(meetingId: string, doctorId: string): string {
  const raw = `oncocollab-${meetingId}-${doctorId}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
}
