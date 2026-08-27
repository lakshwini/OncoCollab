import { useState } from 'react';

const IMAGERIE_URL = import.meta.env.VITE_IMAGERIE_URL || 'http://localhost:5174';

export interface ImagerieViewerProps {
  /** Identifiant de l'image OncoVision à afficher */
  imageId?: string;
  /** Identifiant de la room d'annotation collaborative OncoVision */
  roomId?: string;
  /** Nom affiché dans la room d'annotation (auteur des dessins) */
  authorName?: string;
  /** Titre accessible de l'iframe */
  title?: string;
  /** Hauteur du conteneur (CSS) */
  height?: string | number;
  className?: string;
}

/**
 * Intègre le module OncoVision (visualisation/annotation d'imagerie médicale)
 * via iframe. OncoVision est une SPA React 19 distincte servie séparément
 * (cf. imagerie/app), isolée du bundle React 18 d'OncoCollab.
 */
export function ImagerieViewer({
  imageId,
  roomId,
  authorName,
  title = 'Imagerie médicale (OncoVision)',
  height = '100%',
  className,
}: ImagerieViewerProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          minHeight: 200,
          color: '#888',
          fontSize: 14,
          textAlign: 'center',
          padding: '1rem',
          border: '1px dashed #ccc',
          borderRadius: 8,
        }}
      >
        Module d'imagerie OncoVision indisponible.
        <br />
        Vérifiez que le service est démarré ({IMAGERIE_URL}).
      </div>
    );
  }

  const params = new URLSearchParams();
  if (imageId) params.set('imageId', imageId);
  if (roomId) params.set('roomId', roomId);
  if (authorName) params.set('authorName', authorName);
  const query = params.toString();
  const src = query ? `${IMAGERIE_URL}/?${query}` : `${IMAGERIE_URL}/`;

  return (
    <iframe
      title={title}
      src={src}
      className={className}
      style={{ width: '100%', height, border: 'none', borderRadius: 8 }}
      allow="fullscreen; clipboard-write"
      onError={() => setFailed(true)}
    />
  );
}
