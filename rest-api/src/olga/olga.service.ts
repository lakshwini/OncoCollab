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
  private readonly formsBaseUrl = 'http://localhost:9091';

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

    const getUrl = `${this.formsBaseUrl}/forms/getFromId/${encodeURIComponent(sanitizedRoleId)}`;

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

    const requestUrl = `${this.baseUrl}/forms/getFromId/${encodeURIComponent(formId)}`;

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

    console.log('[OlgaService] final URL called:', requestUrl);

    try {
      const response = await axios.get<Record<string, unknown>>(requestUrl, {
        headers: {
          Accept: 'application/json',
        },
      });

      const rawForm = (response.data as { form?: unknown }).form;
      const formArray = Array.isArray(rawForm) ? rawForm : [];

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
      if (axios.isAxiosError(error) && error.response) {
        throw new BadGatewayException(
          `Olga a retourne une erreur HTTP ${error.response.status} lors de la recuperation du formulaire ${sanitizedFormId}`,
        );
      }

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
}