import {
  prerequisiteService,
  type PrerequisiteAnswers,
} from './prerequisiteService';

async function getResponse(
  meeting_id: string,
  prerequisite_id: string,
  role: string,
): Promise<PrerequisiteAnswers | null> {
  return prerequisiteService.getPrerequisiteResponse(
    meeting_id,
    prerequisite_id,
    role,
  );
}

async function saveResponse(
  meeting_id: string,
  patient_id: string = '',
  prerequisite_id: string,
  role: string,
  answers: PrerequisiteAnswers,
): Promise<PrerequisiteAnswers> {
  return prerequisiteService.savePrerequisiteResponse({
    meeting_id,
    patient_id,
    prerequisite_id,
    role,
    answers,
  });
}

export const prerequisiteResponsesService = {
  getResponse,
  saveResponse,
};
