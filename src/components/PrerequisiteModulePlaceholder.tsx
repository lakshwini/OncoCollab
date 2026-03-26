/**
 * PrerequisiteModulePlaceholder – Zone centrale affichée lors du clic sur un prérequis.
 *
 * Affiche maintenant le formulaire Olga dynamique pour le médecin sélectionné.
 */

import { X, CheckCircle, AlertCircle } from 'lucide-react';
import type { ParticipantDetail, PrerequisiteItemDetail } from '../services/prerequisites.service';
import { getPrerequisiteLabel } from '../i18n/prerequisite-labels';
import { OlgaDynamicForm } from './OlgaDynamicForm';

export interface PrerequisiteModulePlaceholderProps {
  meetingId: string;
  item: PrerequisiteItemDetail;
  doctor: ParticipantDetail;
  language: 'fr' | 'en';
  onClose: () => void;
  onSaved?: () => void;
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
  meetingId,
  item,
  doctor,
  language,
  onClose,
  onSaved,
}: PrerequisiteModulePlaceholderProps) {
  const resolvedPrerequisiteId =
    (item.reference_id || '').trim() ||
    (item.key || '').trim() ||
    'olga_form';

  const label =
    (language === 'fr' ? item.label_fr : item.label_en) ||
    item.label ||
    getPrerequisiteLabel(item.key, language);

  const fullName = `Dr. ${doctor.firstname} ${doctor.lastname}`;
  const isDone = item.status === 'done';
  const isInProgress = item.status === 'in_progress';
  const statusColor = isDone ? C.green : isInProgress ? '#f97316' : C.red;

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
            <AlertCircle size={30} color={statusColor} style={{ flexShrink: 0, marginTop: '2px' }} />
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
              backgroundColor: isDone ? 'rgba(34,197,94,0.15)' : isInProgress ? 'rgba(249,115,22,0.15)' : 'rgba(239,68,68,0.15)',
              color: statusColor,
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
                backgroundColor: statusColor,
              }}
            />
            {isDone
              ? (language === 'fr' ? 'Complété' : 'Done')
              : isInProgress
                ? (language === 'fr' ? 'En cours' : 'In progress')
                : (language === 'fr' ? 'En attente' : 'Pending')}
          </div>
        </div>

        <OlgaDynamicForm
          meetingId={meetingId}
          prerequisiteId={resolvedPrerequisiteId}
          role={doctor.speciality || 'Non spécifié'}
          language={language}
          variant="dark"
          initialFieldKey={item.key}
          title={language === 'fr' ? 'Formulaire Olga' : 'Olga Form'}
          description={language === 'fr' ? 'Complétez et enregistrez les champs pour ce praticien.' : 'Complete and save the fields for this practitioner.'}
          items={doctor.items}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
