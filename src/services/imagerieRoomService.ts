const IMAGERIE_API_URL = import.meta.env.VITE_IMAGERIE_API_URL || 'http://localhost:8010';

interface OncoVisionRoomInfo {
  roomId: string;
  roomName: string;
  imageId: string;
}

interface OncoVisionImageInfo {
  id: string;
}

/**
 * Récupère (ou crée) la room d'annotation OncoVision associée à une réunion
 * Visio OncoCollab, afin que l'onglet "Imagerie" rejoigne directement l'outil
 * d'annotation au lieu d'afficher l'écran de sélection de room d'OncoVision.
 *
 * La room OncoVision est identifiée par son `roomName`, dans laquelle on
 * stocke le `meetingId` OncoCollab. Une room ne peut être créée que si au
 * moins une image existe dans le registre OncoVision (image_id obligatoire) ;
 * si aucune image n'est disponible, retourne `null` (l'iframe affichera alors
 * l'écran OncoVision standard, permettant d'uploader une première image).
 */
export async function getOrCreateImagerieRoom(meetingId: string): Promise<string | null> {
  try {
    const roomsRes = await fetch(`${IMAGERIE_API_URL}/draw/rooms`);
    if (roomsRes.ok) {
      const rooms: OncoVisionRoomInfo[] = await roomsRes.json();
      const existing = rooms.find((room) => room.roomName === meetingId);
      if (existing) return existing.roomId;
    }

    const imagesRes = await fetch(`${IMAGERIE_API_URL}/viewer/images`);
    if (!imagesRes.ok) return null;
    const images: OncoVisionImageInfo[] = await imagesRes.json();
    if (images.length === 0) return null;

    const createRes = await fetch(`${IMAGERIE_API_URL}/draw/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: meetingId, imageId: images[0].id }),
    });
    if (!createRes.ok) return null;
    const created: OncoVisionRoomInfo = await createRes.json();
    return created.roomId;
  } catch {
    return null;
  }
}
