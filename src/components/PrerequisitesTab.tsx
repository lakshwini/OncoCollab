/**
 * PrerequisitesTab – panneau gauche de l'onglet "Prérequis" en réunion RCP.
 *
 * Structure : Spécialité → Médecins → Items prérequis
 *  - Organisé par spécialité médicale (champ `speciality` du participant)
 *  - Statut couleur : vert = done, rouge = pending
 *  - Clic sur un item → callback onSelectItem pour afficher le module central
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, User as UserIcon } from 'lucide-react';
import type {
  ParticipantDetail,
  PrerequisiteDetailsResponse,
  PrerequisiteItemDetail,
} from '../services/prerequisites.service';

interface PrerequisitesTabProps {
  data: PrerequisiteDetailsResponse | null;
  loading: boolean;
  error: string | null;
  language: 'fr' | 'en';
  onSelectItem: (item: PrerequisiteItemDetail, doctor: ParticipantDetail) => void;
}

// Palette partagée avec VideoConferenceAdvanced
const C = {
  bg: '#1a1a1a',
  bgCard: '#2a2a2a',
  bgCardHover: '#333333',
  border: '#333333',
  textWhite: '#ffffff',
  textGrayLight: '#d1d5db',
  textGray: '#9ca3af',
  textGrayDark: '#6b7280',
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
};

function StatusDot({ status }: { status: 'pending' | 'in_progress' | 'done' }) {
  const color =
    status === 'done' ? C.green :
    status === 'in_progress' ? '#f97316' :
    C.red;
  return (
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor: color,
      }}
    />
  );
}

export function PrerequisitesTab({
  data,
  loading,
  error,
  language,
  onSelectItem,
}: PrerequisitesTabProps) {
  const [expandedSpecialities, setExpandedSpecialities] = useState<Set<string>>(new Set());
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: C.textGray, fontSize: '13px' }}>
        {language === 'fr' ? 'Chargement des prérequis…' : 'Loading prerequisites…'}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px' }}>
        {error}
      </div>
    );
  }

  if (!data || data.participants.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: C.textGrayDark, fontSize: '13px' }}>
        {language === 'fr' ? 'Aucun prérequis disponible' : 'No prerequisites available'}
      </div>
    );
  }

  // Grouper les participants par spécialité médicale
  const bySpeciality = new Map<string, ParticipantDetail[]>();
  for (const p of data.participants) {
    const spec = p.speciality || (language === 'fr' ? 'Généraliste' : 'General');
    if (!bySpeciality.has(spec)) bySpeciality.set(spec, []);
    bySpeciality.get(spec)!.push(p);
  }

  const toggleSpeciality = (spec: string) => {
    setExpandedSpecialities(prev => {
      const next = new Set(prev);
      if (next.has(spec)) next.delete(spec);
      else next.add(spec);
      return next;
    });
  };

  const toggleDoctor = (doctorId: string) => {
    setExpandedDoctors(prev => {
      const next = new Set(prev);
      if (next.has(doctorId)) next.delete(doctorId);
      else next.add(doctorId);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {Array.from(bySpeciality.entries()).map(([speciality, doctors]) => {
        const specExpanded = expandedSpecialities.has(speciality);
        const doneCount = doctors.reduce((s, d) => s + d.progress.completed, 0);
        const totalCount = doctors.reduce((s, d) => s + d.progress.total, 0);
        const allDone = totalCount > 0 && doneCount === totalCount;

        return (
          <div key={speciality}>
            {/* ── Entête spécialité ── */}
            <button
              onClick={() => toggleSpeciality(speciality)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: specExpanded ? 'rgba(59,130,246,0.12)' : C.bgCard,
                color: C.textWhite,
                textAlign: 'left',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => {
                if (!specExpanded) e.currentTarget.style.backgroundColor = C.bgCardHover;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = specExpanded
                  ? 'rgba(59,130,246,0.12)'
                  : C.bgCard;
              }}
            >
              {specExpanded
                ? <ChevronDown size={14} color={C.blueLight} />
                : <ChevronRight size={14} color={C.textGray} />}
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{speciality}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontVariantNumeric: 'tabular-nums',
                  color: allDone ? C.green : C.textGray,
                }}
              >
                {doneCount}/{totalCount}
              </span>
            </button>

            {/* ── Médecins ── */}
            {specExpanded && (
              <div style={{ marginLeft: '14px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {doctors.map(doctor => {
                  const doctorExpanded = expandedDoctors.has(doctor.doctor_id);
                  const fullName = `Dr. ${doctor.firstname} ${doctor.lastname}`;
                  const allDoctorDone =
                    doctor.progress.total > 0 &&
                    doctor.progress.completed === doctor.progress.total;

                  return (
                    <div key={doctor.doctor_id}>
                      {/* ── Entête médecin ── */}
                      <button
                        onClick={() => toggleDoctor(doctor.doctor_id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '6px 8px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: doctorExpanded ? 'rgba(59,130,246,0.07)' : 'transparent',
                          color: C.textGrayLight,
                          textAlign: 'left',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!doctorExpanded) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = doctorExpanded
                            ? 'rgba(59,130,246,0.07)'
                            : 'transparent';
                        }}
                      >
                        {doctorExpanded
                          ? <ChevronDown size={11} color={C.blueLight} />
                          : <ChevronRight size={11} color={C.textGray} />}
                        <UserIcon size={11} color={C.textGray} />
                        <span
                          style={{
                            flex: 1,
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {fullName}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontVariantNumeric: 'tabular-nums',
                            color: allDoctorDone ? C.green : C.textGray,
                          }}
                        >
                          {doctor.progress.completed}/{doctor.progress.total}
                        </span>
                      </button>

                      {/* ── Items prérequis ── */}
                      {doctorExpanded && (
                        <div
                          style={{
                            marginLeft: '18px',
                            marginTop: '2px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                          }}
                        >
                          {doctor.items.length === 0 ? (
                            <div
                              style={{
                                padding: '4px 8px',
                                color: C.textGrayDark,
                                fontSize: '11px',
                              }}
                            >
                              {language === 'fr' ? 'Aucun prérequis' : 'No prerequisites'}
                            </div>
                          ) : (
                            doctor.items.map(item => {
                              const label =
                                (language === 'fr' ? item.label_fr : item.label_en) ||
                                item.label ||
                                item.key;
                              return (
                                <button
                                  key={item.key}
                                  onClick={() => onSelectItem(item, doctor)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '5px 8px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent',
                                    color: C.textGray,
                                    textAlign: 'left',
                                    transition: 'background-color 0.1s',
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = C.bgCardHover;
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <StatusDot status={item.status} />
                                  <span
                                    style={{
                                      flex: 1,
                                      fontSize: '11px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {label}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
