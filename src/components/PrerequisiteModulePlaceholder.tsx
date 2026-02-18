/**
 * PrerequisiteModulePlaceholder – Zone centrale affichée lors du clic sur un prérequis.
 *
 * Affiche :
 *  - Titre du prérequis + statut couleur
 *  - Informations du médecin
 *  - Données JSON brutes de l'item
 *  - Message "Module en cours d'implémentation"
 *
 * Ce composant est conçu pour recevoir plus tard un formulaire dédié
 * développé par une autre équipe.
 */

import { X, CheckCircle, AlertCircle } from 'lucide-react';
import type { ParticipantDetail, PrerequisiteItemDetail } from '../services/prerequisites.service';
import { getPrerequisiteLabel } from '../i18n/prerequisite-labels';

export interface PrerequisiteModulePlaceholderProps {
  item: PrerequisiteItemDetail;
  doctor: ParticipantDetail;
  language: 'fr' | 'en';
  onClose: () => void;
}

const C = {
  bg: '#1a1a1a',
  bgCard: '#2a2a2a',
  bgCardHover: '#333333',
  border: '#333333',
  borderLight: '#444444',
  textWhite: '#ffffff',
  textGray: '#9ca3af',
  textGrayDark: '#6b7280',
  green: '#22c55e',
  red: '#ef4444',
  blueLight: '#60a5fa',
  yellow: '#eab308',
};

export function PrerequisiteModulePlaceholder({
  item,
  doctor,
  language,
  onClose,
}: PrerequisiteModulePlaceholderProps) {
  const label =
    (language === 'fr' ? item.label_fr : item.label_en) ||
    item.label ||
    getPrerequisiteLabel(item.key, language);

  const fullName = `Dr. ${doctor.firstname} ${doctor.lastname}`;
  const isDone = item.status === 'done';

  const jsonData = {
    key: item.key,
    status: item.status,
    source: item.source,
    reference_id: item.reference_id,
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: C.bg,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: '16px',
          padding: '28px',
          position: 'relative',
        }}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          title={language === 'fr' ? 'Retour à la vidéo' : 'Back to video'}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: C.bgCardHover,
            color: C.textGray,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        {/* Icône statut + titre */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
          {isDone ? (
            <CheckCircle size={30} color={C.green} style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <AlertCircle size={30} color={C.red} style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div>
            <div
              style={{
                color: C.textGrayDark,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '4px',
              }}
            >
              {language === 'fr' ? 'PRÉREQUIS' : 'PREREQUISITE'}
            </div>
            <div style={{ color: C.textWhite, fontSize: '18px', fontWeight: 600, lineHeight: 1.3 }}>
              {label}
            </div>
          </div>
        </div>

        {/* Informations médecin + statut badge */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <span style={{ color: C.textGray, fontSize: '12px' }}>
              {language === 'fr' ? 'Médecin : ' : 'Doctor: '}
            </span>
            <span style={{ color: C.textWhite, fontSize: '12px', fontWeight: 500 }}>
              {fullName}
            </span>
            <span style={{ color: C.textGrayDark, fontSize: '12px' }}> • {doctor.speciality}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '99px',
              backgroundColor: isDone ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: isDone ? C.green : C.red,
              fontSize: '12px',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isDone ? C.green : C.red,
              }}
            />
            {isDone
              ? (language === 'fr' ? 'Complété' : 'Done')
              : (language === 'fr' ? 'En attente' : 'Pending')}
          </div>
        </div>

        {/* Données JSON */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              color: C.textGray,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '8px',
            }}
          >
            {language === 'fr' ? 'Données JSON' : 'JSON Data'}
          </div>
          <pre
            style={{
              backgroundColor: '#111',
              border: `1px solid ${C.borderLight}`,
              borderRadius: '8px',
              padding: '14px',
              color: C.blueLight,
              fontSize: '12px',
              fontFamily: 'ui-monospace, monospace',
              margin: 0,
              overflow: 'auto',
              maxHeight: '200px',
              lineHeight: 1.6,
            }}
          >
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </div>

        {/* Notice d'implémentation */}
        <div
          style={{
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚙️</span>
          <div>
            <div
              style={{
                color: C.yellow,
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            >
              {language === 'fr' ? "Module en cours d'implémentation" : 'Module under implementation'}
            </div>
            <div style={{ color: C.textGray, fontSize: '12px', lineHeight: 1.5 }}>
              {language === 'fr'
                ? "Ce composant est prêt à recevoir le formulaire développé par l'équipe dédiée."
                : 'This component is ready to receive the form developed by the dedicated team.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
