import {
  BadRequestException,
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const ROLE_TO_OLGA_FORM_ID: Record<string, string> = {
  Oncologue: 'oncologistForm',
  Radiologue: 'radiologistForm',
  Chirurgien: 'surgeonForm',
  'Anatomo-pathologiste': 'pathologistForm',
  'Radiothérapeute': 'radiotherapistForm',
  Infirmier: 'nurseForm',
  'Médecin généraliste': 'general_practitionerForm',
  Biologiste: 'biologistForm',
  Généticien: 'geneticistForm',
  Coordonnateur: 'coordinatorForm',
};

const roleToFormId: Record<string, string> = {
  oncologue: 'PUT_ID_HERE',
  radiologue: 'PUT_ID_HERE',
  chirurgien: 'PUT_ID_HERE',
  pathologiste: 'PUT_ID_HERE',
  infirmier: 'PUT_ID_HERE',
  coordonnateur: 'PUT_ID_HERE',
  pharmacien: 'PUT_ID_HERE',
};

@Injectable()
export class OlgaService {
  private readonly baseUrl: string;
  // formsBaseUrl est résolu dynamiquement via baseUrl (configurable via OLGA_BASE_URL)
  private get formsBaseUrl(): string { return this.baseUrl; }

  private readonly roleToLegacyFormId: Record<string, string> = {
    oncologue: 'oncologistForm',
    radiologue: 'radiologistForm',
    chirurgien: 'surgeonForm',
    infirmier: 'nurseForm',
    coordinateur: 'coordinatorForm',
    pharmacien: 'pharmacistForm',
  };

  private normalizeBaseUrl(rawBaseUrl: string): string {
    let baseUrl = (rawBaseUrl || '').trim();

    if (!baseUrl || baseUrl.includes('localhost:3002')) {
      return 'http://localhost:9091';
    }

    // Strip trailing slash and any /api suffix — path is provided per-call
    baseUrl = baseUrl.replace(/\/$/, '').replace(/\/api$/, '');

    return baseUrl;
  }

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.normalizeBaseUrl(this.configService.get<string>('OLGA_BASE_URL') || '');
  }

  private mapRoleToFormId(role: string): string | null {
    if (ROLE_TO_OLGA_FORM_ID[role]) {
      return ROLE_TO_OLGA_FORM_ID[role];
    }

    // Allow callers to pass the Olga form id directly.
    if (/^[a-zA-Z0-9_]+Form$/.test(role)) {
      return role;
    }

    return null;
  }

  private formatRoleLabel(roleId: string): string {
    const sanitized = (roleId || '').trim();

    if (!sanitized) {
      return '';
    }

    return sanitized
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  async createFormIfNotExists(roleId: string) {
    const sanitizedRoleId = (roleId || '').trim();

    if (!sanitizedRoleId) {
      throw new BadRequestException('Le roleId est requis');
    }

    const getUrl = `${this.formsBaseUrl}/forms/getFromID/${encodeURIComponent(sanitizedRoleId)}`;

    try {
      const getResponse = await fetch(getUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (getResponse.ok) {
        return await getResponse.json();
      }

      if (getResponse.status !== 404) {
        throw new BadGatewayException(
          `Olga a retourne une erreur HTTP ${getResponse.status} lors de la recuperation du formulaire ${sanitizedRoleId}`,
        );
      }

      const formPayload = {
        label: this.formatRoleLabel(sanitizedRoleId),
        id: sanitizedRoleId,
        fields: [
          { type: 'number', label: 'ECOG', key: 'ecog' },
          { type: 'text', label: 'TNM', key: 'tnm' },
          { type: 'text', label: 'Commentaire', key: 'commentaire' },
        ],
      };

      const createResponse = await fetch(`${this.formsBaseUrl}/forms`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formPayload),
      });

      if (!createResponse.ok) {
        throw new BadGatewayException(
          `Olga a retourne une erreur HTTP ${createResponse.status} lors de la creation du formulaire ${sanitizedRoleId}`,
        );
      }

      return await createResponse.json();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error) {
        throw new HttpException(
          { message: 'Erreur de communication avec Olga Designer' },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new InternalServerErrorException('Erreur inconnue lors de l appel a Olga Designer');
    }
  }

  async getFormByRole(role: string): Promise<any> {
    const normalizedRole = (role || '').toLowerCase().trim();

    if (!normalizedRole) {
      throw new BadRequestException('Le role est requis');
    }

    return this.getFormById(normalizedRole);
  }

  async getFormForRole(role: string) {
    const sanitizedRole = (role || '').trim();

    if (!sanitizedRole) {
      throw new BadRequestException('Le role Olga est requis');
    }

    const formId = this.mapRoleToFormId(sanitizedRole);
    if (!formId) {
      throw new HttpException(
        { message: 'Formulaire Olga non disponible pour ce rôle' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const requestUrl = `${this.baseUrl}/forms/getFromID/${encodeURIComponent(formId)}`;

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          throw new HttpException(
            { message: 'Formulaire Olga non disponible pour ce rôle' },
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        throw new BadGatewayException(
          `Olga a retourne une erreur HTTP ${response.status} pour le role ${sanitizedRole}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof BadGatewayException) {
        throw error;
      }

      if (error instanceof Error) {
        throw new HttpException(
          { message: 'Formulaire Olga non disponible pour ce rôle' },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new InternalServerErrorException('Erreur inconnue lors de l appel a Olga Designer');
    }
  }

  async getFormById(formId: string): Promise<Record<string, unknown>> {
    const sanitizedFormId = (formId || '').trim();

    if (!sanitizedFormId) {
      throw new BadRequestException('Le formId est requis');
    }

    const requestUrl = `${this.formsBaseUrl}/forms/getFromID/${encodeURIComponent(sanitizedFormId)}`;

    console.log('[OlgaService] Tentative appel Olga Designer:', requestUrl);

    try {
      // Appel avec timeout de 2 secondes (Olga Designer souvent indisponible en dev local)
      const response = await Promise.race([
        axios.get<Record<string, unknown>>(requestUrl, {
          headers: {
            Accept: 'application/json',
          },
        }),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: Olga Designer indisponible après 2 secondes')), 2000),
        ),
      ]);

      const rawForm = (response.data as { form?: unknown }).form;
      const formArray = Array.isArray(rawForm) ? rawForm : [];

      console.log('[OlgaService] ✅ Formulaire chargé depuis Olga Designer');

      return {
        fields: formArray.map((field) => {
          const item = field as {
            field_key?: unknown;
            field_label?: unknown;
            field_type?: unknown;
          };

          return {
            key: item.field_key,
            label: item.field_label,
            type: item.field_type,
          };
        }),
      };
    } catch (error) {
      // Olga Designer indisponible: utiliser fallback au lieu de rejeter
      console.warn('[OlgaService] ⚠️ Olga Designer indisponible, utilisation formulaire de secours');

      if (error instanceof Error) {
        console.warn('[OlgaService] Erreur:', error.message);
      }

      // Retourner un formulaire de secours au lieu de lever une erreur
      return this.getFallbackForm(sanitizedFormId);
    }
  }

  /**
   * Formulaires de secours par rôle (utilisés quand Olga Designer est indisponible)
   */
  private getFallbackForm(roleId: string): Record<string, unknown> {
    const normalizedRole = (roleId || '').toLowerCase();

    const fallbackForms: Record<string, Record<string, unknown>> = {
      oncologue: {
        fields: [
          { key: 'speciality', label: 'Spécialité', type: 'text', required: true },
          { key: 'patient_name', label: 'Nom du patient', type: 'text', required: true },
          { key: 'patient_age', label: 'Âge du patient', type: 'number' },
          { key: 'diagnosis', label: 'Diagnostic', type: 'textarea', required: true },
          { key: 'stage', label: 'Stade du cancer', type: 'select' },
          { key: 'treatment_plan', label: 'Plan de traitement proposé', type: 'textarea' },
          { key: 'notes', label: 'Observations supplémentaires', type: 'textarea' },
        ],
      },
      radiologue: {
        fields: [
          { key: 'imaging_date', label: 'Date de l\'imagerie', type: 'date' },
          { key: 'imaging_type', label: 'Type d\'imagerie', type: 'select' },
          { key: 'location', label: 'Zone imagée', type: 'text' },
          { key: 'findings', label: 'Conclusions', type: 'textarea', required: true },
          { key: 'recommendations', label: 'Recommandations', type: 'textarea' },
        ],
      },
      chirurgien: {
        fields: [
          { key: 'intervention_date', label: 'Date de l\'intervention', type: 'date' },
          { key: 'intervention_type', label: 'Type d\'intervention', type: 'text', required: true },
          { key: 'procedure_notes', label: 'Notes de procédure', type: 'textarea', required: true },
          { key: 'complications', label: 'Complications éventuelles', type: 'textarea' },
          { key: 'follow_up', label: 'Suivi recommandé', type: 'textarea' },
        ],
      },
      'anatomo-pathologiste': {
        fields: [
          { key: 'specimen_type', label: 'Type de specimen', type: 'text' },
          { key: 'histology', label: 'Conclusions histologiques', type: 'textarea', required: true },
          { key: 'grade', label: 'Grade/Score', type: 'select' },
          { key: 'additional_tests', label: 'Tests supplémentaires', type: 'textarea' },
        ],
      },
      radiotherapeute: {
        fields: [
          { key: 'target_area', label: 'Zone cible', type: 'text' },
          { key: 'dose', label: 'Dose prescrite (Gy)', type: 'number' },
          { key: 'fractions', label: 'Nombre de fractions', type: 'number' },
          { key: 'planning_notes', label: 'Notes de planification', type: 'textarea' },
          { key: 'toxicity_assessment', label: 'Évaluation de la toxicité', type: 'textarea' },
        ],
      },
      infirmier: {
        fields: [
          { key: 'assessment_date', label: 'Date d\'évaluation', type: 'date' },
          { key: 'clinical_assessment', label: 'Évaluation clinique', type: 'textarea' },
          { key: 'care_plan', label: 'Plan de soins', type: 'textarea' },
          { key: 'observations', label: 'Observations', type: 'textarea' },
        ],
      },
      coordinateur: {
        fields: [
          { key: 'meeting_date', label: 'Date de la RCP', type: 'date' },
          { key: 'participants', label: 'Participants présents', type: 'textarea' },
          { key: 'decisions', label: 'Décisions prises', type: 'textarea', required: true },
          { key: 'next_steps', label: 'Prochaines étapes', type: 'textarea' },
          { key: 'follow_up_date', label: 'Date de suivi', type: 'date' },
        ],
      },
    };

    // Retourner le formulaire pour le rôle, ou un générique par défaut
    const form = fallbackForms[normalizedRole] || {
      fields: [
        { key: 'role', label: 'Rôle', type: 'text', value: roleId },
        { key: 'assessment', label: 'Évaluation professionnelle', type: 'textarea', required: true },
        { key: 'recommendations', label: 'Recommandations', type: 'textarea' },
        { key: 'notes', label: 'Observations', type: 'textarea' },
      ],
    };

    console.log(`[OlgaService] Formulaire de secours retourné pour: ${normalizedRole}`);
    return form;
  }
}