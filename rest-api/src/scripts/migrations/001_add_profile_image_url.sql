-- Migration: Ajouter colonne profile_image_url à la table doctors
-- Date: 2026-02-15
-- Description: Permet de stocker l'URL de la photo de profil des médecins (Supabase Storage)

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Commentaire pour la documentation
COMMENT ON COLUMN doctors.profile_image_url IS 'URL de la photo de profil stockée dans Supabase Storage';
