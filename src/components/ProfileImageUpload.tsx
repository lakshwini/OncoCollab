import { useState } from 'react';
import { Upload, User, X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { API_CONFIG, createApiUrl, createAuthHeaders } from '../config/api.config';

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  doctorId?: string;
  onUploadSuccess?: (url: string) => void;
}

/**
 * Composant pour uploader/afficher/supprimer une photo de profil
 * Utilise Supabase Storage via l'API backend
 */
export function ProfileImageUpload({
  currentImageUrl,
  doctorId,
  onUploadSuccess,
}: ProfileImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [initials, setInitials] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = createApiUrl('/doctors/profile-image');
      const response = await fetch(url, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const data = await response.json();
      setImageUrl(data.profileImageUrl);
      onUploadSuccess?.(data.profileImageUrl);
      toast.success('Photo de profil mise à jour !');
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const url = createApiUrl('/doctors/profile-image');
      const response = await fetch(url, {
        method: 'DELETE',
        headers: createAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setImageUrl(null);
      toast.success('Photo de profil supprimée');
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Affichage de la photo ou des initiales */}
      <div className="relative">
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Photo de profil"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <button
              onClick={handleDelete}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {initials || <User className="w-16 h-16" />}
          </div>
        )}
      </div>

      {/* Bouton d'upload */}
      <div className="relative">
        <input
          type="file"
          id="profile-image-input"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        <label htmlFor="profile-image-input">
          <Button
            asChild
            variant="outline"
            disabled={uploading}
            className="cursor-pointer"
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Upload...' : imageUrl ? 'Changer' : 'Ajouter une photo'}
            </span>
          </Button>
        </label>
      </div>

      <p className="text-xs text-gray-500">
        Format: JPG, PNG (max 2MB)
      </p>
    </div>
  );
}
