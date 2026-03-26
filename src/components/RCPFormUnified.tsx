/**
 * RCPFormUnified.tsx - VERSION 2 AMÉLIORÉE
 * 
 * ✅ Dropdowns claires pour patients & participants
 * ✅ Sélection d'heure facile
 * ✅ Indicateurs ROUGES pour champs manquants
 * ✅ Système de traduction cohérent (tout FR ou tout EN)
 * ✅ Validation claire avant création
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Clock,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchDoctors } from '../services/doctors.service';
import { fetchPatients } from '../services/patients.service';
import { createMeeting, fetchPrerequisiteTemplates } from '../services/meetings.service';

interface Doctor {
  doctorId: string;
  firstName: string;
  lastName: string;
  speciality: string;
}

interface Patient {
  patientId: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
}

interface SelectedParticipant {
  doctorId: string;
  firstName: string;
  lastName: string;
  speciality: string;
  role: 'organizer' | 'co_admin' | 'participant';
}

interface ManualPrerequisiteItem {
  key: string;
  label: string;
  status: 'pending' | 'done' | 'not_applicable';
  source: 'document' | 'orthanc' | 'form';
  reference_id: string | null;
}

interface PrerequisiteTemplate {
  key: string;
  label?: string;
  label_fr?: string;
  label_en?: string;
  source?: 'document' | 'orthanc' | 'form';
}

const normalizeSpecialityKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

interface RCPFormUnifiedProps {
  currentUserId: string;
  currentUserName?: string;
  authToken: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  displayMode?: 'standalone' | 'modal';
}

const translationsFr = {
  title: 'Créer une RCP',
  subtitle: 'Réunion de concertation pluridisciplinaire',
  cancel: 'Annuler',
  createMeeting: '✓ Créer la réunion',
  creating: 'Création...',
  meetingTitle: 'Titre de la réunion',
  meetingTitlePlaceholder: 'RCP Oncologie - Cancer du sein',
  description: 'Description',
  descriptionPlaceholder: 'Contexte ou notes supplémentaires...',
  dateTime: 'Date & Heur',
  date: 'Date',
  startTime: 'Heure de début',
  endTime: 'Heure de fin',
  patients: 'Patients',
  selectPatients: 'Sélectionner les patients',
  noPatients: 'Aucun patient',
  participants: 'Participants',
  addParticipant: '+ Ajouter un participant',
  searchDoctors: 'Rechercher médecins...',
  organizer: 'Organisateur',
  coAdmin: 'Co-Admin',
  participant: 'Participant',
  role: 'Rôle',
  prerequisites: 'Prérequis',
  addPrerequisite: 'Ajouter un prérequis...',
  customPrerequisite: 'Prérequis libre...',
  noPrerequisitesAssigned: 'Aucun prérequis assigné',
  add: 'Ajouter',
  remove: 'Supprimer',
  requiredField: 'requis',
  missingFields: '⚠️ Champs manquants (en ROUGE):',
  fillRequiredFields: 'Remplissez tous les champs marqués en ROUGE',
  errorLoading: 'Erreur lors du chargement',
  errorCreating: 'Erreur lors de la création',
  successMessage: 'Réunion "{title}" créée! ✅',
  loading: 'Chargement...',
};

const translationsEn = {
  title: 'Create an RCP',
  subtitle: 'Multidisciplinary conference meeting',
  cancel: 'Cancel',
  createMeeting: '✓ Create Meeting',
  creating: 'Creating...',
  meetingTitle: 'Meeting Title',
  meetingTitlePlaceholder: 'Oncology RCP - Breast Cancer',
  description: 'Description',
  descriptionPlaceholder: 'Additional context or notes...',
  dateTime: 'Date & Time',
  date: 'Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  patients: 'Patients',
  selectPatients: 'Select patients',
  noPatients: 'No patients',
  participants: 'Participants',
  addParticipant: '+ Add a participant',
  searchDoctors: 'Search doctors...',
  organizer: 'Organizer',
  coAdmin: 'Co-Admin',
  participant: 'Participant',
  role: 'Role',
  prerequisites: 'Prerequisites',
  addPrerequisite: 'Add a prerequisite...',
  customPrerequisite: 'Custom prerequisite...',
  noPrerequisitesAssigned: 'No assigned prerequisites',
  add: 'Add',
  remove: 'Remove',
  requiredField: 'required',
  missingFields: '⚠️ Missing fields (in RED):',
  fillRequiredFields: 'Fill all fields marked in RED',
  errorLoading: 'Error loading data',
  errorCreating: 'Error creating meeting',
  successMessage: 'Meeting "{title}" created! ✅',
  loading: 'Loading...',
};

export function RCPFormUnified({
  currentUserId,
  currentUserName,
  authToken,
  onSuccess,
  onCancel,
  displayMode = 'standalone',
}: RCPFormUnifiedProps) {
  const { language } = useLanguage();
  const t = language === 'fr' ? translationsFr : translationsEn;

  // ========== STATE FORMULAIRE ==========
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // ========== STATE SÉLECTIONS ==========
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<
    Record<string, SelectedParticipant>
  >({});
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [participantPrerequisites, setParticipantPrerequisites] = useState<
    Record<string, ManualPrerequisiteItem[]>
  >({});
  const [prerequisiteInputs, setPrerequisiteInputs] = useState<Record<string, string>>({});
  const [selectedTemplateByDoctor, setSelectedTemplateByDoctor] = useState<Record<string, string>>({});

  // ========== STATE DONNÉES ==========
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prerequisiteTemplates, setPrerequisiteTemplates] = useState<Record<string, PrerequisiteTemplate[]>>({});

  // ========== STATE UI ==========
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // ========== LIFECYCLE ==========
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [doctorsData, patientsData, templatesData] = await Promise.all([
        fetchDoctors(authToken),
        fetchPatients(authToken),
        fetchPrerequisiteTemplates(authToken).catch(() => ({})),
      ]);

      setDoctors(doctorsData);
      setPatients(patientsData);
      setPrerequisiteTemplates(templatesData || {});

      const currentDoctor = doctorsData.find(
        (d: Doctor) => d.doctorId === currentUserId
      );
      if (currentDoctor) {
        setSelectedParticipants({
          [currentUserId]: {
            doctorId: currentUserId,
            firstName: currentDoctor.firstName,
            lastName: currentDoctor.lastName,
            speciality: currentDoctor.speciality,
            role: 'organizer',
          },
        });
        setParticipantPrerequisites({
          [currentUserId]: [],
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || t.errorLoading;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== VALIDATION ==========
  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    const trimmedTitle = title?.trim() || '';
    const trimmedStartTime = startTime?.trim() || '';
    const trimmedEndTime = endTime?.trim() || '';
    
    if (!trimmedTitle) missing.push(t.meetingTitle);
    if (!startDate) missing.push(t.date);
    if (!trimmedStartTime) missing.push(t.startTime);
    if (!trimmedEndTime) missing.push(t.endTime);
    if (selectedPatientIds.length === 0) missing.push(t.patients);
    if (Object.keys(selectedParticipants).length === 0) missing.push(t.participants);
    return missing;
  };

  const canCreateMeeting = (): boolean => {
    return getMissingFields().length === 0;
  };

  // ========== HANDLERS PARTICIPANTS ==========
  const handleAddParticipant = (doctor: Doctor) => {
    if (!selectedParticipants[doctor.doctorId]) {
      setSelectedParticipants({
        ...selectedParticipants,
        [doctor.doctorId]: {
          doctorId: doctor.doctorId,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          speciality: doctor.speciality,
          role: 'participant',
        },
      });
      setParticipantPrerequisites((previous) => ({
        ...previous,
        [doctor.doctorId]: previous[doctor.doctorId] || [],
      }));
      setDoctorSearchQuery('');
      setShowDoctorDropdown(false);
    }
  };

  const handleRemoveParticipant = (doctorId: string) => {
    if (doctorId === currentUserId) return;
    const newParticipants = { ...selectedParticipants };
    delete newParticipants[doctorId];
    setSelectedParticipants(newParticipants);
    setParticipantPrerequisites((previous) => {
      const next = { ...previous };
      delete next[doctorId];
      return next;
    });
    setPrerequisiteInputs((previous) => {
      const next = { ...previous };
      delete next[doctorId];
      return next;
    });
    setSelectedTemplateByDoctor((previous) => {
      const next = { ...previous };
      delete next[doctorId];
      return next;
    });
  };

  const handleSetRole = (
    doctorId: string,
    role: 'co_admin' | 'participant'
  ) => {
    if (doctorId === currentUserId) return;
    setSelectedParticipants({
      ...selectedParticipants,
      [doctorId]: { ...selectedParticipants[doctorId], role },
    });
  };

  const buildPrerequisiteKey = (label: string, doctorId: string) => {
    const baseKey = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const safeBaseKey = baseKey.length > 0 ? baseKey : 'custom';
    return `${safeBaseKey}_${doctorId.slice(0, 6)}_${Date.now()}`;
  };

  const handleAddPrerequisiteToParticipant = (doctorId: string) => {
    const rawLabel = (prerequisiteInputs[doctorId] || '').trim();
    if (!rawLabel) {
      return;
    }

    setParticipantPrerequisites((previous) => {
      const current = previous[doctorId] || [];
      const exists = current.some(
        (item) => item.label.toLowerCase() === rawLabel.toLowerCase(),
      );
      if (exists) {
        return previous;
      }

      return {
        ...previous,
        [doctorId]: [
          ...current,
          {
            key: buildPrerequisiteKey(rawLabel, doctorId),
            label: rawLabel,
            status: 'pending',
            source: 'document',
            reference_id: null,
          },
        ],
      };
    });

    setPrerequisiteInputs((previous) => ({
      ...previous,
      [doctorId]: '',
    }));
  };

  const getPrerequisiteTemplatesForSpeciality = (speciality: string): PrerequisiteTemplate[] => {
    const direct = prerequisiteTemplates[speciality] || [];
    if (direct.length > 0) {
      return direct;
    }

    const normalizedSpeciality = normalizeSpecialityKey(speciality || '');
    if (!normalizedSpeciality) {
      return [];
    }

    const matchedEntry = Object.entries(prerequisiteTemplates).find(([key]) => {
      const normalizedKey = normalizeSpecialityKey(key);
      return (
        normalizedKey === normalizedSpeciality ||
        normalizedKey.includes(normalizedSpeciality) ||
        normalizedSpeciality.includes(normalizedKey)
      );
    });

    return matchedEntry ? matchedEntry[1] : [];
  };

  const handleAddTemplatePrerequisiteToParticipant = (
    doctorId: string,
    template: PrerequisiteTemplate,
  ) => {
    const templateLabel = (template.label_fr || template.label || template.key || '').trim();
    if (!templateLabel) {
      return;
    }

    setParticipantPrerequisites((previous) => {
      const current = previous[doctorId] || [];
      const exists = current.some(
        (item) =>
          item.key === template.key ||
          item.label.toLowerCase() === templateLabel.toLowerCase(),
      );

      if (exists) {
        return previous;
      }

      return {
        ...previous,
        [doctorId]: [
          ...current,
          {
            key: template.key,
            label: templateLabel,
            status: 'pending',
            source: template.source || 'document',
            reference_id: null,
          },
        ],
      };
    });
  };

  const handleRemovePrerequisiteFromParticipant = (doctorId: string, key: string) => {
    setParticipantPrerequisites((previous) => ({
      ...previous,
      [doctorId]: (previous[doctorId] || []).filter((item) => item.key !== key),
    }));
  };

  // ========== CRÉATION ==========
  const handleCreateMeeting = async () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      setError(`${t.fillRequiredFields}\n• ${missing.join('\n• ')}`);
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const startDateTime = `${startDate}T${startTime}:00`;
      const endDateTime = `${startDate}T${endTime}:00`;

      const meetingData = {
        title,
        description,
        startTime: startDateTime,
        endTime: endDateTime,
        status: 'scheduled',
        patientIds: selectedPatientIds,
        participants: Object.values(selectedParticipants).map((p) => ({
          doctorId: p.doctorId,
          role: p.role,
          invitationStatus: 'invited',
        })),
        prerequisites: Object.values(selectedParticipants).map((p) => ({
          doctorId: p.doctorId,
          speciality: p.speciality,
          items: (participantPrerequisites[p.doctorId] || []).map((item) => ({
            key: item.key,
            label: item.label,
            status: item.status,
            source: item.source,
            reference_id: item.reference_id,
          })),
        })),
      };

      await createMeeting(meetingData, authToken);
      toast.success(t.successMessage.replace('{title}', title));

      setTitle('');
      setDescription('');
      setStartDate('');
      setStartTime('');
      setEndTime('');
      setSelectedPatientIds([]);
      setSelectedParticipants({});
      setParticipantPrerequisites({});
      setPrerequisiteInputs({});
      onSuccess?.();
    } catch (err: any) {
      const errorMsg = err.message || t.errorCreating;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  // ========== FILTERED LISTS ==========
  const getFilteredDoctors = () => {
    return doctors.filter((d) => {
      const query = doctorSearchQuery.toLowerCase();
      const isNotSelected = !selectedParticipants[d.doctorId];
      const matchesQuery =
        d.firstName.toLowerCase().includes(query) ||
        d.lastName.toLowerCase().includes(query) ||
        d.speciality.toLowerCase().includes(query);
      return isNotSelected && matchesQuery;
    });
  };

  const missingFields = getMissingFields();

  // ========== RENDER LOADING ==========
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  // ========== RENDER MAIN ==========
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: displayMode === 'modal' ? '100%' : 'auto',
        maxHeight: '100%',
      }}
    >
      {/* HEADER */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm">
        <h2 className="text-2xl font-bold text-white">{t.title}</h2>
        <p className="text-blue-100 text-sm mt-1">{t.subtitle}</p>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
        className="px-4 md:px-6 py-4 md:py-6 space-y-4"
      >
        {/* ERROR MESSAGE - CHAMPS MANQUANTS EN ROUGE */}
        {missingFields.length > 0 && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-5 space-y-3 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm md:text-base">
                  ⚠️ {t.missingFields}
                </p>
                <div className="mt-2 space-y-1">
                  {missingFields.map((field, idx) => (
                    <p key={idx} className="text-red-700 text-sm font-medium">
                      ✗ {field}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TITLE */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            {t.meetingTitle}
            <span className="text-red-600 ml-1">*</span>
          </label>
          <input
            type="text"
            placeholder={t.meetingTitlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition font-medium ${
              !title && missingFields.includes(t.meetingTitle)
                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            {t.description}
          </label>
          <textarea
            placeholder={t.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none transition"
          />
        </div>

        {/* DATE & TIME */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">
            {t.dateTime}
            <span className="text-red-600 ml-1">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Date */}
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">{t.date}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition font-medium ${
                    !startDate && missingFields.includes(t.date)
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.startTime} *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    console.log('Start Time changed to:', e.target.value);
                    setStartTime(e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition font-medium ${
                    !startTime && missingFields.includes(t.startTime)
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
              </div>
            </div>

            {/* End Time */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.endTime} *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    console.log('End Time changed to:', e.target.value);
                    setEndTime(e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition font-medium ${
                    !endTime && missingFields.includes(t.endTime)
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PATIENTS - DROPDOWN CLAIR */}
        <div className="relative">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            {t.patients}
            {selectedPatientIds.length === 0 && (
              <span className="text-red-600 ml-1">*</span>
            )}
          </label>
          <button
            onClick={() => setShowPatientDropdown(!showPatientDropdown)}
            className={`w-full px-4 py-3 border-2 rounded-lg flex items-center justify-between text-sm font-medium transition ${
              selectedPatientIds.length === 0 && missingFields.includes(t.patients)
                ? 'border-red-400 bg-red-50 hover:border-red-500'
                : 'border-gray-300 bg-white hover:border-blue-400'
            }`}
          >
            <span className={`${selectedPatientIds.length === 0 ? 'text-gray-500' : 'text-gray-800 font-semibold'}`}>
              {selectedPatientIds.length === 0
                ? t.selectPatients
                : `✓ ${selectedPatientIds.length} ${t.patients}`}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-blue-600 transition ${
                showPatientDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown */}
          {showPatientDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 border-2 border-blue-300 bg-white rounded-lg shadow-xl z-10 max-h-56 overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient.patientId}
                  onClick={() => {
                    if (!selectedPatientIds.includes(patient.patientId)) {
                      setSelectedPatientIds([...selectedPatientIds, patient.patientId]);
                    } else {
                      setSelectedPatientIds(
                        selectedPatientIds.filter((id) => id !== patient.patientId)
                      );
                    }
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                    selectedPatientIds.includes(patient.patientId)
                      ? 'bg-blue-100 hover:bg-blue-150'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPatientIds.includes(patient.patientId)}
                    onChange={() => {}}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{patient.patientNumber}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Patients Tags */}
          {selectedPatientIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedPatientIds.map((patientId) => {
                const patient = patients.find((p) => p.patientId === patientId);
                return patient ? (
                  <Badge key={patientId} className="bg-blue-600 text-white flex items-center gap-1 text-xs">
                    {patient.firstName[0]}{patient.lastName[0]}
                    <button
                      onClick={() =>
                        setSelectedPatientIds(
                          selectedPatientIds.filter((id) => id !== patientId)
                        )
                      }
                      className="hover:opacity-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* PARTICIPANTS - DROPDOWN CLAIR */}
        <div className="relative">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            {t.participants}
            {Object.keys(selectedParticipants).length === 0 && (
              <span className="text-red-600 ml-1">*</span>
            )}
          </label>

          {/* Search & Add Dropdown */}
          <div className="relative">
            <input
              type="text"
              placeholder={t.searchDoctors}
              value={doctorSearchQuery}
              onChange={(e) => setDoctorSearchQuery(e.target.value)}
              onFocus={() => setShowDoctorDropdown(true)}
              className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition ${
                Object.keys(selectedParticipants).length === 0 && missingFields.includes(t.participants)
                  ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            />

            {/* Dropdown */}
            {showDoctorDropdown && getFilteredDoctors().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 border-2 border-blue-300 bg-white rounded-lg shadow-xl z-10 max-h-56 overflow-y-auto">
                {getFilteredDoctors().map((doctor) => (
                  <button
                    key={doctor.doctorId}
                    onClick={() => {
                      handleAddParticipant(doctor);
                      setShowDoctorDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-blue-100 transition border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-semibold text-gray-900">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">{doctor.speciality}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Participants List */}
          <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
            {Object.values(selectedParticipants).map((participant) => (
              <Card key={participant.doctorId} className="overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition">
                <div
                  className="p-4 cursor-pointer hover:bg-blue-50 flex items-center justify-between transition"
                  onClick={() =>
                    setExpandedParticipant(
                      expandedParticipant === participant.doctorId
                        ? null
                        : participant.doctorId
                    )
                  }
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {participant.firstName.charAt(0)}{participant.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        Dr. {participant.firstName} {participant.lastName}
                      </p>
                      <p className="text-xs text-gray-600">{participant.speciality}</p>
                      <p className="text-xs font-semibold text-blue-600 mt-1">{participant.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {participant.role === 'organizer' && (
                      <Badge className="bg-purple-600 text-white text-xs">
                        {t.organizer}
                      </Badge>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 transition ${
                        expandedParticipant === participant.doctorId
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </div>
                </div>

                {expandedParticipant === participant.doctorId && (
                  <CardContent className="border-t border-gray-200 pt-3 space-y-3">
                    {/* Role Selection */}
                    {participant.role !== 'organizer' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {t.role}
                        </label>
                        <select
                          value={participant.role}
                          onChange={(e) =>
                            handleSetRole(
                              participant.doctorId,
                              e.target.value as 'co_admin' | 'participant'
                            )
                          }
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="participant">{t.participant}</option>
                          <option value="co_admin">{t.coAdmin}</option>
                        </select>
                      </div>
                    )}

                    {/* Remove Button */}
                    {participant.role !== 'organizer' && (
                      <Button
                        variant="outline"
                        className="w-full text-xs text-red-600 hover:text-red-700"
                        onClick={() =>
                          handleRemoveParticipant(participant.doctorId)
                        }
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t.remove}
                      </Button>
                    )}

                    <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                      <label className="block text-xs font-semibold text-gray-700">
                        {t.prerequisites}
                      </label>

                      <div className="flex gap-2">
                        <select
                          value={selectedTemplateByDoctor[participant.doctorId] || ''}
                          onChange={(event) => {
                            const selectedKey = event.target.value;
                            setSelectedTemplateByDoctor((previous) => ({
                              ...previous,
                              [participant.doctorId]: selectedKey,
                            }));

                            if (!selectedKey) {
                              return;
                            }

                            const templatesForDoctor = getPrerequisiteTemplatesForSpeciality(participant.speciality);
                            const template = templatesForDoctor.find((item) => item.key === selectedKey);
                            if (template) {
                              handleAddTemplatePrerequisiteToParticipant(participant.doctorId, template);
                            }

                            setSelectedTemplateByDoctor((previous) => ({
                              ...previous,
                              [participant.doctorId]: '',
                            }));
                          }}
                          className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="">sélectionner un template</option>
                          {getPrerequisiteTemplatesForSpeciality(participant.speciality).map((template) => (
                            <option key={template.key} value={template.key}>
                              {template.label_fr || template.label || template.key}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prerequisiteInputs[participant.doctorId] || ''}
                          placeholder={t.customPrerequisite}
                          onChange={(event) =>
                            setPrerequisiteInputs((previous) => ({
                              ...previous,
                              [participant.doctorId]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleAddPrerequisiteToParticipant(participant.doctorId);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleAddPrerequisiteToParticipant(participant.doctorId)}
                        >
                          {t.add}
                        </Button>
                      </div>

                      {(participantPrerequisites[participant.doctorId] || []).length === 0 ? (
                        <p className="text-xs text-gray-500">{t.noPrerequisitesAssigned}</p>
                      ) : (
                        <div className="space-y-1">
                          {(participantPrerequisites[participant.doctorId] || []).map((item) => (
                            <div
                              key={item.key}
                              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-2 py-1"
                            >
                              <span className="text-xs font-medium text-gray-700">{item.label}</span>
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:text-red-700"
                                onClick={() =>
                                  handleRemovePrerequisiteFromParticipant(participant.doctorId, item.key)
                                }
                              >
                                {t.remove}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER ACTION BUTTONS */}
      <div className="flex-shrink-0 px-4 md:px-6 py-4 md:py-5 border-t border-gray-200 bg-gray-50 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 text-sm font-semibold py-3 border-2"
          onClick={onCancel}
          disabled={isCreating}
        >
          {t.cancel}
        </Button>
        <Button
          className={`flex-1 text-sm font-bold py-3 transition shadow-md ${
            canCreateMeeting() && !isCreating
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleCreateMeeting}
          disabled={isCreating || !canCreateMeeting()}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.creating}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t.createMeeting}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
