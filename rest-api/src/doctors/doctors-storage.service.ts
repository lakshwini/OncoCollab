import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { DataSource } from 'typeorm';

/**
 * Service pour gérer les photos de profil des médecins
 * Utilise Supabase Storage + PostgreSQL
 */
@Injectable()
export class DoctorsStorageService {
  private readonly BUCKET_NAME = 'profile-images';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Upload une photo de profil dans Supabase Storage
   * @param doctorId ID du médecin
   * @param file Buffer du fichier image
   * @param filename Nom du fichier
   * @returns URL publique de l'image
   */
  async uploadProfileImage(
    doctorId: string,
    file: Buffer,
    filename: string,
  ): Promise<string> {
    try {
      const supabase = this.supabaseService.getClient();

      // Créer un nom de fichier unique
      const timestamp = Date.now();
      const extension = filename.split('.').pop();
      const uniqueFilename = `${doctorId}_${timestamp}.${extension}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(uniqueFilename, file, {
          contentType: `image/${extension}`,
          upsert: true, // Remplacer si existe déjà
        });

      if (error) {
        throw new Error(`Erreur upload Supabase: ${error.message}`);
      }

      // Récupérer l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(uniqueFilename);

      // Mettre à jour PostgreSQL
      await this.dataSource.query(
        `UPDATE doctors SET profile_image_url = $1 WHERE doctorid = $2`,
        [publicUrl, doctorId],
      );

      console.log(`✅ Photo de profil uploadée pour doctor ${doctorId}: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      console.error('Erreur upload photo de profil:', error);
      throw error;
    }
  }

  /**
   * Supprime une photo de profil
   * @param doctorId ID du médecin
   */
  async deleteProfileImage(doctorId: string): Promise<void> {
    try {
      // Récupérer l'URL actuelle
      const result = await this.dataSource.query(
        `SELECT profile_image_url FROM doctors WHERE doctorid = $1`,
        [doctorId],
      );

      if (!result || result.length === 0 || !result[0].profile_image_url) {
        return; // Pas de photo à supprimer
      }

      const url = result[0].profile_image_url;
      const filename = url.split('/').pop();

      // Supprimer de Supabase Storage
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filename!]);

      if (error) {
        console.error('Erreur suppression Supabase:', error);
      }

      // Mettre à jour PostgreSQL
      await this.dataSource.query(
        `UPDATE doctors SET profile_image_url = NULL WHERE doctorid = $1`,
        [doctorId],
      );

      console.log(`✅ Photo de profil supprimée pour doctor ${doctorId}`);
    } catch (error) {
      console.error('Erreur suppression photo de profil:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL de la photo de profil d'un médecin
   * @param doctorId ID du médecin
   * @returns URL de la photo ou null
   */
  async getProfileImageUrl(doctorId: string): Promise<string | null> {
    const result = await this.dataSource.query(
      `SELECT profile_image_url FROM doctors WHERE doctorid = $1`,
      [doctorId],
    );

    if (!result || result.length === 0) {
      return null;
    }

    return result[0].profile_image_url || null;
  }

  /**
   * Génère les initiales du médecin (fallback si pas de photo)
   * @param doctorId ID du médecin
   * @returns Initiales (ex: "JD")
   */
  async getInitials(doctorId: string): Promise<string> {
    const result = await this.dataSource.query(
      `SELECT firstname, lastname FROM doctors WHERE doctorid = $1`,
      [doctorId],
    );

    if (!result || result.length === 0) {
      return '?';
    }

    const { firstname, lastname } = result[0];
    const firstInitial = firstname ? firstname[0].toUpperCase() : '';
    const lastInitial = lastname ? lastname[0].toUpperCase() : '';

    return `${firstInitial}${lastInitial}`;
  }
}
