--
-- PostgreSQL database dump
--

\restrict c1a3bJLW3Nr5fbr1TKYadKeeDNF0yr3JpdQ3Q3U9o0lXlHcpNnFaVLxYYc1uZYE

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: doctor_personal_files; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.doctor_personal_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    doctor_id uuid NOT NULL,
    report_id uuid,
    meeting_id uuid,
    file_type character varying(50) DEFAULT 'pdf'::character varying,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    is_read boolean DEFAULT false,
    access_count integer DEFAULT 0,
    last_accessed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.doctor_personal_files OWNER TO oncocollab;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.doctors (
    doctorid uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    firstname character varying(100) NOT NULL,
    lastname character varying(100) NOT NULL,
    roleid integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password character varying(255) DEFAULT 'L@kshwini29'::character varying NOT NULL,
    profile_image_url text
);


ALTER TABLE public.doctors OWNER TO oncocollab;

--
-- Name: COLUMN doctors.profile_image_url; Type: COMMENT; Schema: public; Owner: oncocollab
--

COMMENT ON COLUMN public.doctors.profile_image_url IS 'URL de la photo de profil stockée dans Supabase Storage';


--
-- Name: medical_images; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.medical_images (
    image_id integer NOT NULL,
    patient_id uuid NOT NULL,
    patient_number character varying(20) NOT NULL,
    orthanc_study_id character varying(255) NOT NULL,
    orthanc_instance_count integer,
    modality character varying(10),
    study_date date,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.medical_images OWNER TO oncocollab;

--
-- Name: medical_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: oncocollab
--

CREATE SEQUENCE public.medical_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_images_image_id_seq OWNER TO oncocollab;

--
-- Name: medical_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oncocollab
--

ALTER SEQUENCE public.medical_images_image_id_seq OWNED BY public.medical_images.image_id;


--
-- Name: meeting_date_options; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.meeting_date_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    proposed_start timestamp without time zone NOT NULL,
    proposed_end timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.meeting_date_options OWNER TO oncocollab;

--
-- Name: meeting_date_votes; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.meeting_date_votes (
    date_option_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    availability text NOT NULL,
    voted_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meeting_date_votes_availability_check CHECK ((availability = ANY (ARRAY['available'::text, 'maybe'::text, 'unavailable'::text])))
);


ALTER TABLE public.meeting_date_votes OWNER TO oncocollab;

--
-- Name: meeting_participants; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.meeting_participants (
    meeting_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    invitation_status text DEFAULT 'invited'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meeting_participants_invitation_status_check CHECK ((invitation_status = ANY (ARRAY['invited'::text, 'accepted'::text, 'declined'::text])))
);


ALTER TABLE public.meeting_participants OWNER TO oncocollab;

--
-- Name: meeting_patients; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.meeting_patients (
    meeting_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    discussion_order integer DEFAULT 1,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.meeting_patients OWNER TO oncocollab;

--
-- Name: meeting_reports; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.meeting_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    transcript_id uuid,
    title character varying(255) DEFAULT 'Compte-rendu de RCP'::character varying NOT NULL,
    summary text,
    structured_data jsonb,
    pdf_url text,
    pdf_filename character varying(255),
    pdf_size_bytes integer,
    qdrant_point_id character varying(64),
    status character varying(20) DEFAULT 'ready'::character varying,
    error_message text,
    generated_by uuid,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.meeting_reports OWNER TO oncocollab;

--
-- Name: meeting_roles; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.meeting_roles (
    meeting_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meeting_roles_role_check CHECK ((role = ANY (ARRAY['organizer'::text, 'co_admin'::text, 'participant'::text])))
);


ALTER TABLE public.meeting_roles OWNER TO oncocollab;

--
-- Name: meeting_transcripts; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.meeting_transcripts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    raw_transcript text NOT NULL,
    language character varying(10) DEFAULT 'fr'::character varying,
    duration_seconds integer,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    speaker_blocks jsonb,
    transcription_source character varying(20) DEFAULT 'whisper'::character varying
);


ALTER TABLE public.meeting_transcripts OWNER TO oncocollab;

--
-- Name: meetings; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by uuid NOT NULL,
    postponed_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    oncovision_room_id text,
    CONSTRAINT meetings_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'live'::text, 'postponed'::text, 'finished'::text])))
);


ALTER TABLE public.meetings OWNER TO oncocollab;

--
-- Name: COLUMN meetings.oncovision_room_id; Type: COMMENT; Schema: public; Owner: oncocollab
--

COMMENT ON COLUMN public.meetings.oncovision_room_id IS 'Identifiant de la room OncoVision liée à cette réunion';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    room_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT messages_message_type_check CHECK (((message_type)::text = ANY (ARRAY[('text'::character varying)::text, ('system'::character varying)::text])))
);


ALTER TABLE public.messages OWNER TO oncocollab;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.patients (
    patientid uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_number character varying(20) NOT NULL,
    lastname character varying(100) NOT NULL,
    firstname character varying(100) NOT NULL,
    dateofbirth date NOT NULL,
    sex character(1),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT patients_sex_check CHECK ((sex = ANY (ARRAY['M'::bpchar, 'F'::bpchar, 'O'::bpchar])))
);


ALTER TABLE public.patients OWNER TO oncocollab;

--
-- Name: prise_en_charge_patient; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.prise_en_charge_patient (
    prise_en_charge_id integer NOT NULL,
    patientid uuid NOT NULL,
    responsableid uuid NOT NULL,
    type character varying(500),
    status_id integer NOT NULL,
    date_modification timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.prise_en_charge_patient OWNER TO oncocollab;

--
-- Name: prise_en_charge_patient_prise_en_charge_id_seq; Type: SEQUENCE; Schema: public; Owner: oncocollab
--

CREATE SEQUENCE public.prise_en_charge_patient_prise_en_charge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prise_en_charge_patient_prise_en_charge_id_seq OWNER TO oncocollab;

--
-- Name: prise_en_charge_patient_prise_en_charge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oncocollab
--

ALTER SEQUENCE public.prise_en_charge_patient_prise_en_charge_id_seq OWNED BY public.prise_en_charge_patient.prise_en_charge_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.roles (
    roleid integer NOT NULL,
    rolename character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO oncocollab;

--
-- Name: roles_roleid_seq; Type: SEQUENCE; Schema: public; Owner: oncocollab
--

CREATE SEQUENCE public.roles_roleid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_roleid_seq OWNER TO oncocollab;

--
-- Name: roles_roleid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oncocollab
--

ALTER SEQUENCE public.roles_roleid_seq OWNED BY public.roles.roleid;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    "roomId" character varying NOT NULL,
    name character varying NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.rooms OWNER TO oncocollab;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: oncocollab
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO oncocollab;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oncocollab
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: status; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.status (
    status_id integer NOT NULL,
    label character varying(50) NOT NULL
);


ALTER TABLE public.status OWNER TO oncocollab;

--
-- Name: transcription_blocks; Type: TABLE; Schema: public; Owner: oncocollab
--

CREATE TABLE public.transcription_blocks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    meeting_id uuid NOT NULL,
    speaker_id uuid,
    speaker_name character varying(255),
    text text NOT NULL,
    block_order integer NOT NULL,
    timestamp_seconds integer,
    source character varying(20) DEFAULT 'speechcore'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transcription_blocks OWNER TO oncocollab;

--
-- Name: medical_images image_id; Type: DEFAULT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.medical_images ALTER COLUMN image_id SET DEFAULT nextval('public.medical_images_image_id_seq'::regclass);


--
-- Name: prise_en_charge_patient prise_en_charge_id; Type: DEFAULT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.prise_en_charge_patient ALTER COLUMN prise_en_charge_id SET DEFAULT nextval('public.prise_en_charge_patient_prise_en_charge_id_seq'::regclass);


--
-- Name: roles roleid; Type: DEFAULT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.roles ALTER COLUMN roleid SET DEFAULT nextval('public.roles_roleid_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: rooms PK_0368a2d7c215f2d0458a54933f2; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY (id);


--
-- Name: doctor_personal_files doctor_personal_files_doctor_id_report_id_key; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.doctor_personal_files
    ADD CONSTRAINT doctor_personal_files_doctor_id_report_id_key UNIQUE (doctor_id, report_id);


--
-- Name: doctor_personal_files doctor_personal_files_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.doctor_personal_files
    ADD CONSTRAINT doctor_personal_files_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_email_key; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_email_key UNIQUE (email);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (doctorid);


--
-- Name: medical_images medical_images_orthanc_study_id_key; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.medical_images
    ADD CONSTRAINT medical_images_orthanc_study_id_key UNIQUE (orthanc_study_id);


--
-- Name: medical_images medical_images_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.medical_images
    ADD CONSTRAINT medical_images_pkey PRIMARY KEY (image_id);


--
-- Name: meeting_date_options meeting_date_options_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_date_options
    ADD CONSTRAINT meeting_date_options_pkey PRIMARY KEY (id);


--
-- Name: meeting_date_votes meeting_date_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_date_votes
    ADD CONSTRAINT meeting_date_votes_pkey PRIMARY KEY (date_option_id, doctor_id);


--
-- Name: meeting_participants meeting_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT meeting_participants_pkey PRIMARY KEY (meeting_id, doctor_id);


--
-- Name: meeting_patients meeting_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_patients
    ADD CONSTRAINT meeting_patients_pkey PRIMARY KEY (meeting_id, patient_id);


--
-- Name: meeting_reports meeting_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_reports
    ADD CONSTRAINT meeting_reports_pkey PRIMARY KEY (id);


--
-- Name: meeting_roles meeting_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_roles
    ADD CONSTRAINT meeting_roles_pkey PRIMARY KEY (meeting_id, doctor_id);


--
-- Name: meeting_transcripts meeting_transcripts_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: patients patients_patient_number_key; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_number_key UNIQUE (patient_number);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patientid);


--
-- Name: prise_en_charge_patient prise_en_charge_patient_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.prise_en_charge_patient
    ADD CONSTRAINT prise_en_charge_patient_pkey PRIMARY KEY (prise_en_charge_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (roleid);


--
-- Name: roles roles_rolename_key; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_rolename_key UNIQUE (rolename);


--
-- Name: status status_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_pkey PRIMARY KEY (status_id);


--
-- Name: transcription_blocks transcription_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.transcription_blocks
    ADD CONSTRAINT transcription_blocks_pkey PRIMARY KEY (id);


--
-- Name: idx_doctor_personal_files_doctor_id; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_doctor_personal_files_doctor_id ON public.doctor_personal_files USING btree (doctor_id);


--
-- Name: idx_doctor_personal_files_report_id; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_doctor_personal_files_report_id ON public.doctor_personal_files USING btree (report_id);


--
-- Name: idx_medical_images_orthanc_study; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_medical_images_orthanc_study ON public.medical_images USING btree (orthanc_study_id);


--
-- Name: idx_medical_images_patient_id; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_medical_images_patient_id ON public.medical_images USING btree (patient_id);


--
-- Name: idx_medical_images_patient_number; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_medical_images_patient_number ON public.medical_images USING btree (patient_number);


--
-- Name: idx_meeting_reports_generated_by; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_meeting_reports_generated_by ON public.meeting_reports USING btree (generated_by);


--
-- Name: idx_meeting_reports_meeting_id; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_meeting_reports_meeting_id ON public.meeting_reports USING btree (meeting_id);


--
-- Name: idx_meeting_transcripts_meeting_id; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_meeting_transcripts_meeting_id ON public.meeting_transcripts USING btree (meeting_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);


--
-- Name: idx_messages_meeting_id; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_messages_meeting_id ON public.messages USING btree (meeting_id);


--
-- Name: idx_messages_room_id; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_messages_room_id ON public.messages USING btree (room_id);


--
-- Name: idx_transcription_blocks_meeting_order; Type: INDEX; Schema: public; Owner: oncocollab
--

CREATE INDEX idx_transcription_blocks_meeting_order ON public.transcription_blocks USING btree (meeting_id, block_order);


--
-- Name: doctor_personal_files doctor_personal_files_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.doctor_personal_files
    ADD CONSTRAINT doctor_personal_files_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: doctor_personal_files doctor_personal_files_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.doctor_personal_files
    ADD CONSTRAINT doctor_personal_files_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE SET NULL;


--
-- Name: doctor_personal_files doctor_personal_files_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.doctor_personal_files
    ADD CONSTRAINT doctor_personal_files_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.meeting_reports(id) ON DELETE CASCADE;


--
-- Name: doctors doctors_roleid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_roleid_fkey FOREIGN KEY (roleid) REFERENCES public.roles(roleid);


--
-- Name: meeting_date_options fk_date_option_meeting; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_date_options
    ADD CONSTRAINT fk_date_option_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meetings fk_meeting_creator; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT fk_meeting_creator FOREIGN KEY (created_by) REFERENCES public.doctors(doctorid);


--
-- Name: meeting_patients fk_meeting_patient_meeting; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_patients
    ADD CONSTRAINT fk_meeting_patient_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_patients fk_meeting_patient_patient; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_patients
    ADD CONSTRAINT fk_meeting_patient_patient FOREIGN KEY (patient_id) REFERENCES public.patients(patientid) ON DELETE CASCADE;


--
-- Name: messages fk_messages_meeting; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: messages fk_messages_sender; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: meeting_participants fk_participant_doctor; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT fk_participant_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: meeting_participants fk_participant_meeting; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT fk_participant_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: prise_en_charge_patient fk_patient; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.prise_en_charge_patient
    ADD CONSTRAINT fk_patient FOREIGN KEY (patientid) REFERENCES public.patients(patientid) ON DELETE CASCADE;


--
-- Name: prise_en_charge_patient fk_responsable; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.prise_en_charge_patient
    ADD CONSTRAINT fk_responsable FOREIGN KEY (responsableid) REFERENCES public.doctors(doctorid);


--
-- Name: meeting_roles fk_role_doctor; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_roles
    ADD CONSTRAINT fk_role_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: meeting_roles fk_role_meeting; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_roles
    ADD CONSTRAINT fk_role_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: prise_en_charge_patient fk_status; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.prise_en_charge_patient
    ADD CONSTRAINT fk_status FOREIGN KEY (status_id) REFERENCES public.status(status_id);


--
-- Name: meeting_date_votes fk_vote_doctor; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_date_votes
    ADD CONSTRAINT fk_vote_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: meeting_date_votes fk_vote_option; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_date_votes
    ADD CONSTRAINT fk_vote_option FOREIGN KEY (date_option_id) REFERENCES public.meeting_date_options(id) ON DELETE CASCADE;


--
-- Name: medical_images medical_images_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.medical_images
    ADD CONSTRAINT medical_images_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patientid) ON DELETE CASCADE;


--
-- Name: meeting_reports meeting_reports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_reports
    ADD CONSTRAINT meeting_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.doctors(doctorid);


--
-- Name: meeting_reports meeting_reports_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_reports
    ADD CONSTRAINT meeting_reports_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_reports meeting_reports_transcript_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_reports
    ADD CONSTRAINT meeting_reports_transcript_id_fkey FOREIGN KEY (transcript_id) REFERENCES public.meeting_transcripts(id) ON DELETE SET NULL;


--
-- Name: meeting_transcripts meeting_transcripts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.doctors(doctorid);


--
-- Name: meeting_transcripts meeting_transcripts_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: transcription_blocks transcription_blocks_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: oncocollab
--

ALTER TABLE ONLY public.transcription_blocks
    ADD CONSTRAINT transcription_blocks_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict c1a3bJLW3Nr5fbr1TKYadKeeDNF0yr3JpdQ3Q3U9o0lXlHcpNnFaVLxYYc1uZYE

