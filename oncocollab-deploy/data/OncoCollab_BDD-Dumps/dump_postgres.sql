--
-- PostgreSQL database dump
--

\restrict PQcPlxrouok1r1I9zDva3ESF2pgaBT0wcZxtSZimS8nm7vTHhcR2Q8UbBRKpWte

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
-- Data for Name: doctor_personal_files; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.doctor_personal_files (id, doctor_id, report_id, meeting_id, file_type, file_name, file_url, file_size, is_read, access_count, last_accessed_at, created_at, updated_at) FROM stdin;
5657eaaf-42a9-4999-a624-0c7c2f0abcf3	b8c1e041-f642-46dc-9eb0-196ac81dbc66	bfe5f62c-6462-419a-ab18-312e20b02fa0	06bc8b55-37b9-4695-9611-192b204aaccd	pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_bfe5f62c-6462-419a-ab18-312e20b02fa0.pdf	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_bfe5f62c-6462-419a-ab18-312e20b02fa0.pdf	2995	t	0	\N	2026-05-10 17:17:39.179522	2026-05-10 17:17:39.179522
d913534b-ccec-45c0-a45a-015cbb8ac07b	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	bfe5f62c-6462-419a-ab18-312e20b02fa0	06bc8b55-37b9-4695-9611-192b204aaccd	pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_bfe5f62c-6462-419a-ab18-312e20b02fa0.pdf	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_bfe5f62c-6462-419a-ab18-312e20b02fa0.pdf	2995	f	0	\N	2026-05-10 17:17:39.183009	2026-05-10 17:17:39.183009
fac45ed7-37d3-44eb-ba1b-6f7d3f301848	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	c6e3968f-d846-475f-bde0-bfc82c7d72ea	09bb5d34-9948-474c-a669-e20518c07101	pdf	rcp_09bb5d34-9948-474c-a669-e20518c07101_c6e3968f-d846-475f-bde0-bfc82c7d72ea.pdf	/reports/file/rcp_09bb5d34-9948-474c-a669-e20518c07101_c6e3968f-d846-475f-bde0-bfc82c7d72ea.pdf	2867	f	0	\N	2026-05-10 17:29:10.16246	2026-05-10 17:29:10.16246
db23e114-92f8-4b19-800b-cb945fc2de5c	b8c1e041-f642-46dc-9eb0-196ac81dbc66	c6e3968f-d846-475f-bde0-bfc82c7d72ea	09bb5d34-9948-474c-a669-e20518c07101	pdf	rcp_09bb5d34-9948-474c-a669-e20518c07101_c6e3968f-d846-475f-bde0-bfc82c7d72ea.pdf	/reports/file/rcp_09bb5d34-9948-474c-a669-e20518c07101_c6e3968f-d846-475f-bde0-bfc82c7d72ea.pdf	2867	t	0	\N	2026-05-10 17:29:10.164086	2026-05-10 17:29:10.164086
08ec2e98-db52-470f-a5a4-16bd0321cf8b	b8c1e041-f642-46dc-9eb0-196ac81dbc66	9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a	06bc8b55-37b9-4695-9611-192b204aaccd	pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a.pdf	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a.pdf	2865	t	0	\N	2026-05-12 08:46:43.754791	2026-05-12 08:46:43.754791
ea8ab930-f1bf-49dc-aa35-03f067636d19	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a	06bc8b55-37b9-4695-9611-192b204aaccd	pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a.pdf	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a.pdf	2865	f	0	\N	2026-05-12 08:46:43.758202	2026-05-12 08:46:43.758202
594cde31-319d-44b6-9ac8-c3c3e649deba	b8c1e041-f642-46dc-9eb0-196ac81dbc66	daeb979a-c3f6-4cb0-9e4b-fc48d995b010	06bc8b55-37b9-4695-9611-192b204aaccd	pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_daeb979a-c3f6-4cb0-9e4b-fc48d995b010.pdf	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_daeb979a-c3f6-4cb0-9e4b-fc48d995b010.pdf	2772	t	0	\N	2026-05-12 08:49:54.069354	2026-05-12 08:49:54.069354
c8c8a14b-101a-4dee-9269-34cfc87f41bc	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	daeb979a-c3f6-4cb0-9e4b-fc48d995b010	06bc8b55-37b9-4695-9611-192b204aaccd	pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_daeb979a-c3f6-4cb0-9e4b-fc48d995b010.pdf	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_daeb979a-c3f6-4cb0-9e4b-fc48d995b010.pdf	2772	f	0	\N	2026-05-12 08:49:54.072026	2026-05-12 08:49:54.072026
fc8e126c-bea5-40a2-9f18-17947f9167fe	b8c1e041-f642-46dc-9eb0-196ac81dbc66	3377e940-3c3e-4e15-bd0a-15d0259d1cc2	06bc8b55-37b9-4695-9611-192b204aaccd	pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_3377e940-3c3e-4e15-bd0a-15d0259d1cc2.pdf	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_3377e940-3c3e-4e15-bd0a-15d0259d1cc2.pdf	2572	t	0	\N	2026-05-12 09:07:06.316823	2026-05-12 09:07:06.316823
aff5b0b2-f558-482e-b607-0576dbfaef19	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	3377e940-3c3e-4e15-bd0a-15d0259d1cc2	06bc8b55-37b9-4695-9611-192b204aaccd	pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_3377e940-3c3e-4e15-bd0a-15d0259d1cc2.pdf	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_3377e940-3c3e-4e15-bd0a-15d0259d1cc2.pdf	2572	f	0	\N	2026-05-12 09:07:06.319683	2026-05-12 09:07:06.319683
6896e42b-0ef5-4db6-8307-dccabe7097e0	b8c1e041-f642-46dc-9eb0-196ac81dbc66	27d13ff2-ecd8-43c7-b853-ddc26acfc59b	3d07df4d-35b0-4702-9ef1-b9d4bf37baab	pdf	rcp_3d07df4d-35b0-4702-9ef1-b9d4bf37baab_27d13ff2-ecd8-43c7-b853-ddc26acfc59b.pdf	/reports/file/rcp_3d07df4d-35b0-4702-9ef1-b9d4bf37baab_27d13ff2-ecd8-43c7-b853-ddc26acfc59b.pdf	2680	t	0	\N	2026-05-13 13:06:29.558382	2026-05-13 13:06:29.558382
33f7c895-37b1-459e-85a8-9aa4d8c635b3	be0d4175-1901-4350-b803-664772e06db1	27d13ff2-ecd8-43c7-b853-ddc26acfc59b	3d07df4d-35b0-4702-9ef1-b9d4bf37baab	pdf	rcp_3d07df4d-35b0-4702-9ef1-b9d4bf37baab_27d13ff2-ecd8-43c7-b853-ddc26acfc59b.pdf	/reports/file/rcp_3d07df4d-35b0-4702-9ef1-b9d4bf37baab_27d13ff2-ecd8-43c7-b853-ddc26acfc59b.pdf	2680	f	0	\N	2026-05-13 13:06:29.568433	2026-05-13 13:06:29.568433
83cf7eb8-b951-49ec-aaa6-d57985b842bf	b8c1e041-f642-46dc-9eb0-196ac81dbc66	bd48c875-e04e-4f72-bff7-3a42ef26339f	adf31807-ee18-41ee-a26b-3f6b37a895f5	pdf	rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_bd48c875-e04e-4f72-bff7-3a42ef26339f.pdf	/reports/file/rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_bd48c875-e04e-4f72-bff7-3a42ef26339f.pdf	3219	t	0	\N	2026-05-31 16:33:35.21667	2026-05-31 16:33:35.21667
5729aab1-edeb-4e90-a215-48d8266c4d69	be0d4175-1901-4350-b803-664772e06db1	bd48c875-e04e-4f72-bff7-3a42ef26339f	adf31807-ee18-41ee-a26b-3f6b37a895f5	pdf	rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_bd48c875-e04e-4f72-bff7-3a42ef26339f.pdf	/reports/file/rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_bd48c875-e04e-4f72-bff7-3a42ef26339f.pdf	3219	f	0	\N	2026-05-31 16:33:35.221822	2026-05-31 16:33:35.221822
29149a0f-cd08-46b6-8220-34156e84702c	b8c1e041-f642-46dc-9eb0-196ac81dbc66	0dc54e02-d2ec-4ebf-b701-8b33cd387a59	adf31807-ee18-41ee-a26b-3f6b37a895f5	pdf	rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_0dc54e02-d2ec-4ebf-b701-8b33cd387a59.pdf	/reports/file/rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_0dc54e02-d2ec-4ebf-b701-8b33cd387a59.pdf	2839	t	0	\N	2026-06-11 09:54:44.781023	2026-06-11 09:54:44.781023
7c2e1c80-82c1-4848-9349-d7b830f205b7	be0d4175-1901-4350-b803-664772e06db1	0dc54e02-d2ec-4ebf-b701-8b33cd387a59	adf31807-ee18-41ee-a26b-3f6b37a895f5	pdf	rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_0dc54e02-d2ec-4ebf-b701-8b33cd387a59.pdf	/reports/file/rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_0dc54e02-d2ec-4ebf-b701-8b33cd387a59.pdf	2839	f	0	\N	2026-06-11 09:54:44.784842	2026-06-11 09:54:44.784842
5aafabb7-52ff-4aa6-9dac-04271c2d1440	b8c1e041-f642-46dc-9eb0-196ac81dbc66	c9198405-87ed-402a-96e6-483b8b115764	1c66888e-e2f5-4459-9d35-bbf37a9194cc	pdf	rcp_1c66888e-e2f5-4459-9d35-bbf37a9194cc_c9198405-87ed-402a-96e6-483b8b115764.pdf	/reports/file/rcp_1c66888e-e2f5-4459-9d35-bbf37a9194cc_c9198405-87ed-402a-96e6-483b8b115764.pdf	3039	f	0	\N	2026-06-17 19:32:32.106585	2026-06-17 19:32:32.106585
95b7c461-ed94-424d-86c5-bec85013c738	be0d4175-1901-4350-b803-664772e06db1	c9198405-87ed-402a-96e6-483b8b115764	1c66888e-e2f5-4459-9d35-bbf37a9194cc	pdf	rcp_1c66888e-e2f5-4459-9d35-bbf37a9194cc_c9198405-87ed-402a-96e6-483b8b115764.pdf	/reports/file/rcp_1c66888e-e2f5-4459-9d35-bbf37a9194cc_c9198405-87ed-402a-96e6-483b8b115764.pdf	3039	t	0	\N	2026-06-17 19:32:32.114718	2026-06-17 19:32:32.114718
a4559154-8c5b-4e7b-b179-de9a94a44f3e	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	efcbbc93-56cc-489b-8c5f-803d9dbfc3fa	fec52389-c6b8-45e9-bc63-4b54f51f5e00	pdf	rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_efcbbc93-56cc-489b-8c5f-803d9dbfc3fa.pdf	/reports/file/rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_efcbbc93-56cc-489b-8c5f-803d9dbfc3fa.pdf	2517	t	0	\N	2026-08-26 08:43:23.604933	2026-08-26 08:43:23.604933
37482c2f-0f5f-43af-9c8c-4ad5a147a133	9b5285be-a2bb-4600-9c40-68622beb53cd	efcbbc93-56cc-489b-8c5f-803d9dbfc3fa	fec52389-c6b8-45e9-bc63-4b54f51f5e00	pdf	rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_efcbbc93-56cc-489b-8c5f-803d9dbfc3fa.pdf	/reports/file/rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_efcbbc93-56cc-489b-8c5f-803d9dbfc3fa.pdf	2517	f	0	\N	2026-08-26 08:43:23.612185	2026-08-26 08:43:23.612185
edb3b5ba-4619-4737-b7f4-4dee759847b5	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	85c6b34e-5a44-4912-bf46-505a9707bc37	fec52389-c6b8-45e9-bc63-4b54f51f5e00	pdf	rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_85c6b34e-5a44-4912-bf46-505a9707bc37.pdf	/reports/file/rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_85c6b34e-5a44-4912-bf46-505a9707bc37.pdf	3328	t	0	\N	2026-08-26 09:28:50.585185	2026-08-26 09:28:50.585185
3ece142b-094d-4b7f-be4e-12d93ece70b2	9b5285be-a2bb-4600-9c40-68622beb53cd	85c6b34e-5a44-4912-bf46-505a9707bc37	fec52389-c6b8-45e9-bc63-4b54f51f5e00	pdf	rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_85c6b34e-5a44-4912-bf46-505a9707bc37.pdf	/reports/file/rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_85c6b34e-5a44-4912-bf46-505a9707bc37.pdf	3328	f	0	\N	2026-08-26 09:28:50.586916	2026-08-26 09:28:50.586916
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.doctors (doctorid, email, firstname, lastname, roleid, is_active, created_at, password, profile_image_url) FROM stdin;
aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	dr.riviere@hospital.fr	Virginie	Rivière	3	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
b8c1e041-f642-46dc-9eb0-196ac81dbc66	dr.germain@hospital.fr	Adrien	Germain	1	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	dr.michel@hospital.fr	Maggie	Michel	2	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
be0d4175-1901-4350-b803-664772e06db1	dr.clerc@hospital.fr	Virginie	Clerc	4	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
9b5285be-a2bb-4600-9c40-68622beb53cd	dr.chevallier@hospital.fr	Simone	Chevallier	5	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
\.


--
-- Data for Name: medical_images; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.medical_images (image_id, patient_id, patient_number, orthanc_study_id, orthanc_instance_count, modality, study_date, uploaded_at) FROM stdin;
1	7d293646-409e-4dd2-a289-aae4fcae48d5	PAT001	584b769c-633001a7-a34ffc95-a73b71fa-60a85e37	4	CT	2025-12-17	2025-12-17 12:22:19.254606
2	d135460a-f220-4c6b-8964-b55eadbcf7d4	PAT002	fdc694cc-f658ab34-3657669b-e0aaf7bd-505b120f	4	CT	2025-12-17	2025-12-17 12:22:19.294801
3	b805d36c-f676-4e61-bd9c-253715227e6d	PAT003	28efb5ab-afd5a4c8-931780ce-45ed604b-5a8fb793	4	CT	2025-12-17	2025-12-17 12:22:19.318604
4	60e9ffab-49ed-4669-8649-53778191ec8b	PAT004	8ddd9111-7e2a1aa2-40d8fc74-3dfb9c5f-92ec059c	4	CT	2025-12-17	2025-12-17 12:22:19.33856
5	d63ae23d-c555-45fc-822b-161d2d0f9efe	PAT005	6345b31f-d74474d3-51239d0d-c4c4d5b9-e9c7ae36	4	CT	2025-12-17	2025-12-17 12:22:19.362974
6	e0f98792-6c96-4d25-9a10-39bf40f5a206	PAT006	1d1b7e26-33d03000-78231d8e-851df924-2ff776bb	4	CT	2025-12-17	2025-12-17 12:22:19.393261
7	80caf4f8-691d-4b37-a469-87ea34c1f6fb	PAT007	2d7b9933-cbbea422-442f4ed8-138bd89b-3c082a72	4	CT	2025-12-17	2025-12-17 12:22:19.4169
8	2b224d16-dcd8-4608-adde-faec60195032	PAT008	0fc1fb52-c5a0e85a-ce2028ba-1bfccdb2-d489ebc8	4	CT	2025-12-17	2025-12-17 12:22:19.437263
9	dbad0e6e-599c-4aec-804c-a54879cfa580	PAT009	688c2b56-6a4fb985-f078d17b-5530432b-c3cade3f	4	CT	2025-12-17	2025-12-17 12:22:19.463334
10	bc3c4b02-d061-4afc-991a-3f5dbd2d9766	PAT010	d0df8702-1134d125-d4fc2365-6c6912df-cc68c52b	4	CT	2025-12-17	2025-12-17 12:22:19.48137
\.


--
-- Data for Name: meeting_date_options; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.meeting_date_options (id, meeting_id, proposed_start, proposed_end, created_at) FROM stdin;
\.


--
-- Data for Name: meeting_date_votes; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.meeting_date_votes (date_option_id, doctor_id, availability, voted_at) FROM stdin;
\.


--
-- Data for Name: meeting_participants; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.meeting_participants (meeting_id, doctor_id, invitation_status, created_at) FROM stdin;
d509d6b7-afe5-4298-a1db-5d00952bbefe	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	invited	2026-03-24 20:45:13.753792
d509d6b7-afe5-4298-a1db-5d00952bbefe	be0d4175-1901-4350-b803-664772e06db1	invited	2026-03-24 20:45:13.757769
09bb5d34-9948-474c-a669-e20518c07101	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	invited	2026-02-19 14:55:04.343623
09bb5d34-9948-474c-a669-e20518c07101	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-02-19 14:55:04.345023
06bc8b55-37b9-4695-9611-192b204aaccd	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-05-10 16:59:20.601462
06bc8b55-37b9-4695-9611-192b204aaccd	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	invited	2026-05-10 16:59:20.606196
3d07df4d-35b0-4702-9ef1-b9d4bf37baab	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-05-13 13:00:19.741189
3d07df4d-35b0-4702-9ef1-b9d4bf37baab	be0d4175-1901-4350-b803-664772e06db1	invited	2026-05-13 13:00:19.744015
adf31807-ee18-41ee-a26b-3f6b37a895f5	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-05-31 13:23:21.214988
adf31807-ee18-41ee-a26b-3f6b37a895f5	be0d4175-1901-4350-b803-664772e06db1	invited	2026-05-31 13:23:21.218397
06721836-35cb-443a-88e3-f8f5887db900	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-06-12 07:51:51.450212
06721836-35cb-443a-88e3-f8f5887db900	be0d4175-1901-4350-b803-664772e06db1	invited	2026-06-12 07:51:51.451353
1bd75978-d0c5-4f90-b42e-6b0f43c291d3	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-06-12 09:12:48.327779
1bd75978-d0c5-4f90-b42e-6b0f43c291d3	be0d4175-1901-4350-b803-664772e06db1	invited	2026-06-12 09:12:48.329775
1c66888e-e2f5-4459-9d35-bbf37a9194cc	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-06-17 19:20:12.534749
1c66888e-e2f5-4459-9d35-bbf37a9194cc	be0d4175-1901-4350-b803-664772e06db1	invited	2026-06-17 19:20:12.535322
fec52389-c6b8-45e9-bc63-4b54f51f5e00	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	invited	2026-08-26 08:36:49.477218
fec52389-c6b8-45e9-bc63-4b54f51f5e00	9b5285be-a2bb-4600-9c40-68622beb53cd	invited	2026-08-26 08:36:49.479083
8effbda6-ca25-4a14-a73b-bcfb7a8a6df1	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-08-26 10:01:07.242484
8effbda6-ca25-4a14-a73b-bcfb7a8a6df1	be0d4175-1901-4350-b803-664772e06db1	invited	2026-08-26 10:01:07.243294
218c8947-950e-44c5-910a-1d6b8b3e7a65	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	invited	2026-08-26 10:33:03.29629
218c8947-950e-44c5-910a-1d6b8b3e7a65	be0d4175-1901-4350-b803-664772e06db1	invited	2026-08-26 10:33:03.297738
\.


--
-- Data for Name: meeting_patients; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.meeting_patients (meeting_id, patient_id, discussion_order, notes, created_at) FROM stdin;
09bb5d34-9948-474c-a669-e20518c07101	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-02-19 14:55:04.34652
d509d6b7-afe5-4298-a1db-5d00952bbefe	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-03-24 20:45:13.760902
06bc8b55-37b9-4695-9611-192b204aaccd	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-05-10 16:59:20.610963
3d07df4d-35b0-4702-9ef1-b9d4bf37baab	2b224d16-dcd8-4608-adde-faec60195032	1	\N	2026-05-13 13:00:19.751031
adf31807-ee18-41ee-a26b-3f6b37a895f5	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-05-31 13:23:21.22523
06721836-35cb-443a-88e3-f8f5887db900	2b224d16-dcd8-4608-adde-faec60195032	1	\N	2026-06-12 07:51:51.453685
1bd75978-d0c5-4f90-b42e-6b0f43c291d3	2b224d16-dcd8-4608-adde-faec60195032	1	\N	2026-06-12 09:12:48.333019
1c66888e-e2f5-4459-9d35-bbf37a9194cc	2b224d16-dcd8-4608-adde-faec60195032	1	\N	2026-06-17 19:20:12.53635
fec52389-c6b8-45e9-bc63-4b54f51f5e00	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-08-26 08:36:49.482374
8effbda6-ca25-4a14-a73b-bcfb7a8a6df1	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-08-26 10:01:07.244723
218c8947-950e-44c5-910a-1d6b8b3e7a65	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-08-26 10:33:03.300557
\.


--
-- Data for Name: meeting_reports; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.meeting_reports (id, meeting_id, transcript_id, title, summary, structured_data, pdf_url, pdf_filename, pdf_size_bytes, qdrant_point_id, status, error_message, generated_by, generated_at, updated_at) FROM stdin;
bfe5f62c-6462-419a-ab18-312e20b02fa0	06bc8b55-37b9-4695-9611-192b204aaccd	e829ab7d-b751-4ae9-8d30-c775d82d4cef	test	Cette Réunion de Concertation Pluridisciplinaire a abordé un cas unique mentionnant la présence d'une tumeur à gauche. Le contexte clinique détaillé, les antécédents du patient, ainsi que les discussions approfondies et les décisions thérapeutiques n'ont pas été explicitement documentés dans cette transcription.	{"summary": "Cette Réunion de Concertation Pluridisciplinaire a abordé un cas unique mentionnant la présence d'une tumeur à gauche. Le contexte clinique détaillé, les antécédents du patient, ainsi que les discussions approfondies et les décisions thérapeutiques n'ont pas été explicitement documentés dans cette transcription.", "sections": [{"title": "Cas Unique Discuté", "content": "La réunion a abordé un unique cas pour lequel il a été mentionné la présence d'une tumeur à gauche."}], "decisions": [], "key_points": ["Identification d'une tumeur localisée à gauche."], "action_items": [], "participants": [], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": "1"}, "patients_discussed": [{"label": "Patient A", "context": "", "decision": "", "discussion": "La discussion a porté sur la simple identification d'une tumeur localisée à gauche.", "next_steps": ""}]}	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_bfe5f62c-6462-419a-ab18-312e20b02fa0.pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_bfe5f62c-6462-419a-ab18-312e20b02fa0.pdf	2995	bfe5f62c-6462-419a-ab18-312e20b02fa0	ready	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-10 17:17:39.174396	2026-05-10 17:17:39.219717
c6e3968f-d846-475f-bde0-bfc82c7d72ea	09bb5d34-9948-474c-a669-e20518c07101	18b15b4a-1eaf-4d47-b40c-a0a4a8a34700	TestSiv	La Réunion de Concertation Pluridisciplinaire a brièvement identifié la présence d'une tumeur, mais sans autres précisions cliniques ni décisions thérapeutiques ou étapes ultérieures.	{"summary": "La Réunion de Concertation Pluridisciplinaire a brièvement identifié la présence d'une tumeur, mais sans autres précisions cliniques ni décisions thérapeutiques ou étapes ultérieures.", "sections": [{"title": "Cas Patient A", "content": "Il a été mentionné qu'une tumeur est présente à gauche concernant le Patient A."}], "decisions": [], "key_points": ["Identification d'une tumeur à gauche."], "action_items": [], "participants": [], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": [{"label": "Patient A", "context": "Diagnostic principal: Tumeur à gauche.", "decision": "", "discussion": "La présence d'une tumeur à gauche a été signalée concernant le Patient A.", "next_steps": ""}]}	/reports/file/rcp_09bb5d34-9948-474c-a669-e20518c07101_c6e3968f-d846-475f-bde0-bfc82c7d72ea.pdf	rcp_09bb5d34-9948-474c-a669-e20518c07101_c6e3968f-d846-475f-bde0-bfc82c7d72ea.pdf	2867	c6e3968f-d846-475f-bde0-bfc82c7d72ea	ready	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-10 17:29:10.15556	2026-05-10 17:29:10.188815
9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a	06bc8b55-37b9-4695-9611-192b204aaccd	aa2085d6-a02a-4821-ad16-aacb33c92480	test	La Réunion de Concertation Pluridisciplinaire a abordé le cas d'un patient présentant une tumeur localisée à droite.	{"summary": "La Réunion de Concertation Pluridisciplinaire a abordé le cas d'un patient présentant une tumeur localisée à droite.", "sections": [{"title": "Ouverture", "content": "La séance a débuté par l'introduction d'un cas patient."}, {"title": "Cas patient A", "content": "Le cas du Patient A a été présenté, avec l'observation d'une tumeur localisée à droite."}], "decisions": [], "key_points": ["Observation d'une tumeur à droite chez le Patient A."], "action_items": [], "participants": [], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": [{"label": "Patient A", "context": "Présentation d'une tumeur à droite.", "decision": "", "discussion": "La discussion a porté sur l'observation d'une tumeur située à droite chez le patient.", "next_steps": ""}]}	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a.pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a.pdf	2865	9a8e1f5f-a46c-48a1-a16c-fa2842cb3d9a	ready	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-12 08:46:43.749442	2026-05-12 08:46:43.784348
daeb979a-c3f6-4cb0-9e4b-fc48d995b010	06bc8b55-37b9-4695-9611-192b204aaccd	05967f37-709c-497f-9668-63ba823a6013	test	La réunion a abordé le cas d'un patient pour lequel une tumeur a été détectée à droite.	{"summary": "La réunion a abordé le cas d'un patient pour lequel une tumeur a été détectée à droite.", "sections": [{"title": "Présentation du cas", "content": "Une tumeur a été détectée du côté droit chez le Patient A."}], "decisions": [], "key_points": ["Détection d'une tumeur à droite chez le Patient A."], "action_items": [], "participants": [], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": [{"label": "Patient A", "context": "Détection d'une tumeur à droite.", "decision": "", "discussion": "Discussion centrée sur la détection d'une lésion tumorale du côté droit chez le Patient A.", "next_steps": ""}]}	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_daeb979a-c3f6-4cb0-9e4b-fc48d995b010.pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_daeb979a-c3f6-4cb0-9e4b-fc48d995b010.pdf	2772	daeb979a-c3f6-4cb0-9e4b-fc48d995b010	ready	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-12 08:49:54.066746	2026-05-12 08:49:54.087571
3377e940-3c3e-4e15-bd0a-15d0259d1cc2	06bc8b55-37b9-4695-9611-192b204aaccd	129d0504-71dc-4d3b-b21a-8978cc7cd381	test		{"summary": "", "sections": [{"title": "Cas Patient A", "content": "Détection d'une tumeur à gauche."}], "decisions": [], "key_points": ["Détection d'une tumeur à gauche."], "action_items": [], "participants": [], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": [{"label": "Patient A", "context": "Détection d'une tumeur à gauche.", "decision": "", "discussion": "", "next_steps": ""}]}	/reports/file/rcp_06bc8b55-37b9-4695-9611-192b204aaccd_3377e940-3c3e-4e15-bd0a-15d0259d1cc2.pdf	rcp_06bc8b55-37b9-4695-9611-192b204aaccd_3377e940-3c3e-4e15-bd0a-15d0259d1cc2.pdf	2572	3377e940-3c3e-4e15-bd0a-15d0259d1cc2	ready	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-12 09:07:06.310406	2026-05-12 09:07:06.350967
27d13ff2-ecd8-43c7-b853-ddc26acfc59b	3d07df4d-35b0-4702-9ef1-b9d4bf37baab	c78d35e3-b672-45b4-add8-2cd20b044270	Test 2	Le cas d'un patient présentant une tumeur à gauche a été brièvement évoqué.	{"summary": "Le cas d'un patient présentant une tumeur à gauche a été brièvement évoqué.", "sections": [{"title": "Cas Patient A", "content": "Il y a une tumeur à gauche."}], "decisions": [], "key_points": [], "action_items": [], "participants": [], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": [{"label": "Patient A", "context": "diagnostic principal: Tumeur à gauche", "decision": "", "discussion": "La présence d'une tumeur à gauche a été signalée.", "next_steps": ""}]}	/reports/file/rcp_3d07df4d-35b0-4702-9ef1-b9d4bf37baab_27d13ff2-ecd8-43c7-b853-ddc26acfc59b.pdf	rcp_3d07df4d-35b0-4702-9ef1-b9d4bf37baab_27d13ff2-ecd8-43c7-b853-ddc26acfc59b.pdf	2680	27d13ff2-ecd8-43c7-b853-ddc26acfc59b	ready	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-13 13:06:29.554659	2026-05-13 13:06:29.630944
bd48c875-e04e-4f72-bff7-3a42ef26339f	adf31807-ee18-41ee-a26b-3f6b37a895f5	3f53ac1a-2c46-43ab-b31d-606389091b6d	RCP cancer Sein	La discussion de cette RCP est très limitée et se concentre sur un cas unique où la présence d'une tumeur à gauche est évoquée. Aucune décision thérapeutique claire ni étape suivante n'est formulée à partir des informations disponibles.	{"summary": "La discussion de cette RCP est très limitée et se concentre sur un cas unique où la présence d'une tumeur à gauche est évoquée. Aucune décision thérapeutique claire ni étape suivante n'est formulée à partir des informations disponibles.", "sections": [{"title": "Cas Patient A", "content": "Le Dr Adrien Germain a présenté le cas d'un patient pour lequel il suspecte la présence d'une tumeur située à gauche. Il a précisé que la situation ne semblait pas grave, en indiquant qu'il n'y avait \\"pas grand chose\\" à signaler."}], "decisions": [], "key_points": ["Évocation d'une tumeur à gauche chez un patient, jugée de faible importance."], "action_items": [], "participants": ["Dr Adrien Germain", "Dr Virginie Clerc"], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": [{"label": "Patient A", "context": "Tumeur suspectée à gauche.", "decision": "", "discussion": "Le Dr Adrien Germain a évoqué la présence possible d'une tumeur à gauche, mais a minimisé son importance en déclarant qu'il n'y avait \\"pas grand chose\\".", "next_steps": ""}]}	/reports/file/rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_bd48c875-e04e-4f72-bff7-3a42ef26339f.pdf	rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_bd48c875-e04e-4f72-bff7-3a42ef26339f.pdf	3219	bd48c875-e04e-4f72-bff7-3a42ef26339f	ready	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-31 16:33:35.206934	2026-05-31 16:33:35.3179
0dc54e02-d2ec-4ebf-b701-8b33cd387a59	adf31807-ee18-41ee-a26b-3f6b37a895f5	62ad1dfc-8d9e-4293-82cf-750c404cd64b	RCP cancer Sein		{"summary": "", "sections": [{"title": "Vérification Technique", "content": "La majeure partie de la transcription concerne des échanges relatifs à la vérification et au bon fonctionnement des équipements audio entre Adrien Germain et Virginie Clerc. Des propos contradictoires concernant la présence ou l'absence d'une éventuelle tumeur ont été émis par Adrien Germain, sans qu'un contexte patient précis ou une discussion clinique structurée n'en découle."}], "decisions": [], "key_points": [], "action_items": [], "participants": ["Adrien Germain", "Virginie Clerc"], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": []}	/reports/file/rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_0dc54e02-d2ec-4ebf-b701-8b33cd387a59.pdf	rcp_adf31807-ee18-41ee-a26b-3f6b37a895f5_0dc54e02-d2ec-4ebf-b701-8b33cd387a59.pdf	2839	0dc54e02-d2ec-4ebf-b701-8b33cd387a59	ready	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-06-11 09:54:44.77311	2026-06-11 09:54:44.847989
c9198405-87ed-402a-96e6-483b8b115764	1c66888e-e2f5-4459-9d35-bbf37a9194cc	2d273bc2-5fb2-4af4-b682-250ce43ae3ba	test vidéo	Cette transcription ne contient pas de discussion clinique relative à des patients. Elle décrit le fonctionnement d'un système de transcription et le contrôle de l'enregistrement par les participants. Il n'y a donc pas de résumé médical ou thérapeutique à fournir.	{"summary": "Cette transcription ne contient pas de discussion clinique relative à des patients. Elle décrit le fonctionnement d'un système de transcription et le contrôle de l'enregistrement par les participants. Il n'y a donc pas de résumé médical ou thérapeutique à fournir.", "sections": [{"title": "Discussion sur le système de transcription", "content": "Adrien Germain explique qu'un bloc de transcription s'active pour enregistrer ses propos et qu'il peut l'arrêter à volonté. Virginie Clerc ajoute qu'après acceptation, l'autre participant peut également parler et contrôler l'arrêt de l'enregistrement, le contrôle étant mutuel."}], "decisions": [], "key_points": ["Présentation du fonctionnement d'un système de transcription audio en texte.", "Contrôle de l'enregistrement et de l'arrêt du processus par les participants."], "action_items": [], "participants": ["Adrien Germain", "Virginie Clerc"], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": []}	/reports/file/rcp_1c66888e-e2f5-4459-9d35-bbf37a9194cc_c9198405-87ed-402a-96e6-483b8b115764.pdf	rcp_1c66888e-e2f5-4459-9d35-bbf37a9194cc_c9198405-87ed-402a-96e6-483b8b115764.pdf	3039	c9198405-87ed-402a-96e6-483b8b115764	ready	\N	be0d4175-1901-4350-b803-664772e06db1	2026-06-17 19:32:32.100931	2026-06-17 19:32:32.281113
efcbbc93-56cc-489b-8c5f-803d9dbfc3fa	fec52389-c6b8-45e9-bc63-4b54f51f5e00	9483c045-6bd3-4b78-ba6f-d3ce72a987a4	test img		{"summary": "", "sections": [{"title": "Ouverture", "content": "[Virginie Rivière] Allô"}], "decisions": [], "key_points": [], "action_items": [], "participants": ["Virginie Rivière"], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": ""}, "patients_discussed": []}	/reports/file/rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_efcbbc93-56cc-489b-8c5f-803d9dbfc3fa.pdf	rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_efcbbc93-56cc-489b-8c5f-803d9dbfc3fa.pdf	2517	efcbbc93-56cc-489b-8c5f-803d9dbfc3fa	ready	\N	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	2026-08-26 08:43:23.598457	2026-08-26 08:43:23.746607
85c6b34e-5a44-4912-bf46-505a9707bc37	fec52389-c6b8-45e9-bc63-4b54f51f5e00	45dcb7e4-e630-477d-a9d8-05a71e5bafbd	test img	Cette RCP très brève a porté sur la présentation d'un cas oncologique. La discussion a mis en évidence la présence d'une tumeur localisée à gauche et la suspicion d'une autre lésion en haut à droite. Aucun diagnostic précis ni décision thérapeutique n'ont été formalisés à ce stade de la discussion.	{"summary": "Cette RCP très brève a porté sur la présentation d'un cas oncologique. La discussion a mis en évidence la présence d'une tumeur localisée à gauche et la suspicion d'une autre lésion en haut à droite. Aucun diagnostic précis ni décision thérapeutique n'ont été formalisés à ce stade de la discussion.", "sections": [{"title": "Discussion du cas Patient A", "content": "Le Dr Virginie Rivière a présenté le cas d'un patient pour lequel une tumeur a été identifiée à gauche. En complément, le Dr Simone Chevallier a suggéré la présence possible d'une autre lésion, localisée en haut à droite, nécessitant probablement une exploration complémentaire pour confirmation et caractérisation."}], "decisions": [], "key_points": ["Identification d'une tumeur à gauche chez le Patient A.", "Suspicion d'une seconde lésion en haut à droite chez le même patient."], "action_items": [], "participants": ["Dr Virginie Rivière", "Dr Simone Chevallier"], "meeting_metadata": {"type": "RCP", "specialty": "oncologie", "duration_estimate": "1"}, "patients_discussed": [{"label": "Patient A", "context": "", "decision": "", "discussion": "Le Dr Rivière a signalé la présence d'une tumeur à gauche. Le Dr Chevallier a ensuite émis l'hypothèse de l'existence d'une autre lésion située en haut à droite.", "next_steps": ""}]}	/reports/file/rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_85c6b34e-5a44-4912-bf46-505a9707bc37.pdf	rcp_fec52389-c6b8-45e9-bc63-4b54f51f5e00_85c6b34e-5a44-4912-bf46-505a9707bc37.pdf	3328	85c6b34e-5a44-4912-bf46-505a9707bc37	ready	\N	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	2026-08-26 09:28:50.581615	2026-08-26 09:28:50.615766
\.


--
-- Data for Name: meeting_roles; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.meeting_roles (meeting_id, doctor_id, role, created_at, updated_at) FROM stdin;
09bb5d34-9948-474c-a669-e20518c07101	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	organizer	2026-02-19 14:55:04.345637	2026-02-19 14:55:04.345637
d509d6b7-afe5-4298-a1db-5d00952bbefe	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	organizer	2026-03-24 20:45:13.759224	2026-03-24 20:45:13.759224
06bc8b55-37b9-4695-9611-192b204aaccd	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-05-10 16:59:20.608124	2026-05-10 16:59:20.608124
3d07df4d-35b0-4702-9ef1-b9d4bf37baab	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-05-13 13:00:19.746936	2026-05-13 13:00:19.746936
adf31807-ee18-41ee-a26b-3f6b37a895f5	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-05-31 13:23:21.220518	2026-05-31 13:23:21.220518
06721836-35cb-443a-88e3-f8f5887db900	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-06-12 07:51:51.452724	2026-06-12 07:51:51.452724
1bd75978-d0c5-4f90-b42e-6b0f43c291d3	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-06-12 09:12:48.33066	2026-06-12 09:12:48.33066
1c66888e-e2f5-4459-9d35-bbf37a9194cc	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-06-17 19:20:12.535779	2026-06-17 19:20:12.535779
fec52389-c6b8-45e9-bc63-4b54f51f5e00	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	organizer	2026-08-26 08:36:49.480791	2026-08-26 08:36:49.480791
8effbda6-ca25-4a14-a73b-bcfb7a8a6df1	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-08-26 10:01:07.243739	2026-08-26 10:01:07.243739
218c8947-950e-44c5-910a-1d6b8b3e7a65	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	organizer	2026-08-26 10:33:03.299168	2026-08-26 10:33:03.299168
\.


--
-- Data for Name: meeting_transcripts; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.meeting_transcripts (id, meeting_id, raw_transcript, language, duration_seconds, created_by, created_at, updated_at, speaker_blocks, transcription_source) FROM stdin;
e829ab7d-b751-4ae9-8d30-c775d82d4cef	06bc8b55-37b9-4695-9611-192b204aaccd	Il y a une tumeur à gauche.	fr	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-10 17:17:39.025818	2026-05-10 17:17:39.025818	\N	whisper
18b15b4a-1eaf-4d47-b40c-a0a4a8a34700	09bb5d34-9948-474c-a669-e20518c07101	Il y a une tumeur à gauche.	fr	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-10 17:29:10.130596	2026-05-10 17:29:10.130596	\N	whisper
aa2085d6-a02a-4821-ad16-aacb33c92480	06bc8b55-37b9-4695-9611-192b204aaccd	On observe une tumeur à droite.	fr	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-12 08:46:43.732826	2026-05-12 08:46:43.732826	\N	whisper
05967f37-709c-497f-9668-63ba823a6013	06bc8b55-37b9-4695-9611-192b204aaccd	on détecte une tumeur à droite.	fr	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-12 08:49:54.060814	2026-05-12 08:49:54.060814	\N	whisper
129d0504-71dc-4d3b-b21a-8978cc7cd381	06bc8b55-37b9-4695-9611-192b204aaccd	On détecte une tumeur à gauche.	fr	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-12 09:07:06.288796	2026-05-12 09:07:06.288796	\N	whisper
c78d35e3-b672-45b4-add8-2cd20b044270	3d07df4d-35b0-4702-9ef1-b9d4bf37baab	Il y a une tumeur à gauche.	fr	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-13 13:06:29.533317	2026-05-13 13:06:29.533317	\N	whisper
3f53ac1a-2c46-43ab-b31d-606389091b6d	adf31807-ee18-41ee-a26b-3f6b37a895f5	[Adrien Germain] Je pense qu'il y a une tumeur à gauche mais qu'il n'y a pas grand chose\n[Virginie Clerc] Le premier l'industrie la révolution industrielle au siècle	fr	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-05-31 16:33:35.185219	2026-05-31 16:33:35.185219	\N	whisper
62ad1dfc-8d9e-4293-82cf-750c404cd64b	adf31807-ee18-41ee-a26b-3f6b37a895f5	[Adrien Germain] Je pense qu'il y a une tumeur à gauche mais qu'il n'y a pas grand chose\n[Virginie Clerc] Le premier l'industrie la révolution industrielle au siècle\n[Adrien Germain] Je pense que il y a pas de tumeur\n[Virginie Clerc] Tu m'entends ah oui bah non moi je veux que c'est l'autre qui\n[Adrien Germain] C'est trop cool que j'arrive à m'entendre\n[Virginie Clerc] ah là ça fonctionne super\n[Adrien Germain] Ça fonctionne c'est parfait\n[Virginie Clerc] ça bug un tout petit peu\n[Adrien Germain] Tu en entends\n[Virginie Clerc] cours\n[Adrien Germain] C'est incroyable tu peux commencer à parler\n[Virginie Clerc] c'est aussi incroyable tu peux commencer à parler\n[Adrien Germain] Ça ça marche très très bien\n[Virginie Clerc] ça ça fonctionne aussi	fr	\N	b8c1e041-f642-46dc-9eb0-196ac81dbc66	2026-06-11 09:54:44.745222	2026-06-11 09:54:44.745222	\N	whisper
2d273bc2-5fb2-4af4-b682-250ce43ae3ba	1c66888e-e2f5-4459-9d35-bbf37a9194cc	[Adrien Germain] Il y a un bloc qui se crée et qui enregistre en transcription ce que je suis en train de te dire que je peux arrêter lorsque j'ai envie\n[Virginie Clerc] et lorsque j'accepte il y a  un bloc qui se crée et donc cette personne aussi peut parler et arrêter soit lui il arrête soit  l'autre personne	fr	\N	be0d4175-1901-4350-b803-664772e06db1	2026-06-17 19:32:32.003824	2026-06-17 19:32:32.003824	\N	whisper
9483c045-6bd3-4b78-ba6f-d3ce72a987a4	fec52389-c6b8-45e9-bc63-4b54f51f5e00	[Virginie Rivière] Allô	fr	\N	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	2026-08-26 08:43:23.581933	2026-08-26 08:43:23.581933	\N	whisper
45dcb7e4-e630-477d-a9d8-05a71e5bafbd	fec52389-c6b8-45e9-bc63-4b54f51f5e00	[Virginie Rivière] tumeur a gauche\n[Simone Chevallier] je pense qu'il y en a aussi une en haut à droite	fr	\N	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	2026-08-26 09:28:50.573067	2026-08-26 09:28:50.573067	\N	whisper
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.meetings (id, title, description, start_time, end_time, status, created_by, postponed_reason, created_at, updated_at, oncovision_room_id) FROM stdin;
09bb5d34-9948-474c-a669-e20518c07101	TestSiv	sivayanama	2026-02-26 12:30:00	2026-02-20 13:40:00	scheduled	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	\N	2026-02-19 14:55:04.339214	2026-02-19 14:56:08.895961	\N
d509d6b7-afe5-4298-a1db-5d00952bbefe	test supa	\N	2026-03-26 13:40:00	2026-03-26 15:30:00	scheduled	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	\N	2026-03-24 20:45:13.743916	2026-03-24 20:45:13.743916	\N
06bc8b55-37b9-4695-9611-192b204aaccd	test	test	2026-05-13 10:30:00	2026-05-11 12:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-05-10 16:59:20.570273	2026-05-12 08:36:53.189232	\N
3d07df4d-35b0-4702-9ef1-b9d4bf37baab	Test 2	test	2026-05-15 12:30:00	2026-05-15 13:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-05-13 13:00:19.730655	2026-05-13 13:00:19.730655	\N
adf31807-ee18-41ee-a26b-3f6b37a895f5	RCP cancer Sein	Première phase	2026-06-02 12:30:00	2026-06-02 14:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-05-31 13:23:21.205563	2026-05-31 13:23:21.205563	\N
06721836-35cb-443a-88e3-f8f5887db900	test patho 	\N	2026-06-19 12:30:00	2026-06-19 14:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-06-12 07:51:51.443056	2026-06-12 07:51:51.443056	\N
1bd75978-d0c5-4f90-b42e-6b0f43c291d3	test visio	\N	2026-06-18 12:30:00	2026-06-18 12:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-06-12 09:12:48.318844	2026-06-12 09:12:48.318844	\N
1c66888e-e2f5-4459-9d35-bbf37a9194cc	test vidéo	\N	2026-06-25 12:30:00	2026-06-25 13:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-06-17 19:20:12.529494	2026-06-17 19:20:12.529494	\N
fec52389-c6b8-45e9-bc63-4b54f51f5e00	test img	\N	2026-08-30 12:30:00	2026-08-30 14:30:00	scheduled	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	\N	2026-08-26 08:36:49.464332	2026-08-26 08:36:49.464332	\N
8effbda6-ca25-4a14-a73b-bcfb7a8a6df1	test demo 1	test	2026-08-28 12:30:00	2026-08-28 14:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-08-26 10:01:07.237341	2026-08-26 10:01:07.237341	\N
218c8947-950e-44c5-910a-1d6b8b3e7a65	test work	workflow	2026-08-31 12:30:00	2026-08-31 14:30:00	scheduled	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	\N	2026-08-26 10:33:03.287987	2026-08-26 10:33:03.287987	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.messages (id, meeting_id, room_id, sender_id, content, message_type, created_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.patients (patientid, patient_number, lastname, firstname, dateofbirth, sex, created_at) FROM stdin;
7d293646-409e-4dd2-a289-aae4fcae48d5	PAT001	Ferreira	Matthieu	1963-07-26	F	2025-12-15 15:29:46.393647
d135460a-f220-4c6b-8964-b55eadbcf7d4	PAT002	Blot	Thibaut	1970-12-24	M	2025-12-15 15:29:46.393647
b805d36c-f676-4e61-bd9c-253715227e6d	PAT003	Brunet	Susan	1955-06-07	F	2025-12-15 15:29:46.393647
60e9ffab-49ed-4669-8649-53778191ec8b	PAT004	Guillot	Renée	1995-11-14	M	2025-12-15 15:29:46.393647
d63ae23d-c555-45fc-822b-161d2d0f9efe	PAT005	Joly	Olivier	1973-02-21	M	2025-12-15 15:29:46.393647
e0f98792-6c96-4d25-9a10-39bf40f5a206	PAT006	Bousquet	Frédérique	1962-12-10	M	2025-12-15 15:29:46.393647
80caf4f8-691d-4b37-a469-87ea34c1f6fb	PAT007	Rossi	Zacharie	1984-02-02	F	2025-12-15 15:29:46.393647
2b224d16-dcd8-4608-adde-faec60195032	PAT008	Barre	Danielle	1954-09-30	M	2025-12-15 15:29:46.393647
dbad0e6e-599c-4aec-804c-a54879cfa580	PAT009	Gomes	Célina	1983-06-18	F	2025-12-15 15:29:46.393647
bc3c4b02-d061-4afc-991a-3f5dbd2d9766	PAT010	Fournier	Alice	1956-12-03	M	2025-12-15 15:29:46.393647
\.


--
-- Data for Name: prise_en_charge_patient; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.prise_en_charge_patient (prise_en_charge_id, patientid, responsableid, type, status_id, date_modification) FROM stdin;
1	7d293646-409e-4dd2-a289-aae4fcae48d5	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Cancer du poumon stade II	1	2026-02-16 22:10:59.368376
2	d135460a-f220-4c6b-8964-b55eadbcf7d4	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Cancer colorectal stade I	2	2026-02-16 22:10:59.368376
3	b805d36c-f676-4e61-bd9c-253715227e6d	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Cancer du sein stade III	3	2026-02-16 22:10:59.368376
4	60e9ffab-49ed-4669-8649-53778191ec8b	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Lymphome non hodgkinien	1	2026-02-16 22:10:59.368376
5	d63ae23d-c555-45fc-822b-161d2d0f9efe	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Cancer du pancréas	2	2026-02-16 22:10:59.368376
6	e0f98792-6c96-4d25-9a10-39bf40f5a206	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Cancer de la prostate	3	2026-02-16 22:10:59.368376
7	80caf4f8-691d-4b37-a469-87ea34c1f6fb	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Cancer du foie	1	2026-02-16 22:10:59.368376
8	2b224d16-dcd8-4608-adde-faec60195032	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Mélanome cutané	2	2026-02-16 22:10:59.368376
9	dbad0e6e-599c-4aec-804c-a54879cfa580	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Cancer de l’ovaire	3	2026-02-16 22:10:59.368376
10	bc3c4b02-d061-4afc-991a-3f5dbd2d9766	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Cancer gastrique	1	2026-02-16 22:10:59.368376
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.roles (roleid, rolename) FROM stdin;
1	Oncologue
2	Radiologue
3	Pathologiste
4	Chirurgien
5	Infirmier
6	Coordinateur
7	Pharmacien
8	Admin
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.rooms (id, "roomId", name, active) FROM stdin;
1	bcf2551c-28e2-4f4d-8700-1ded81021cfb	RCP Oncologie Thoracique	t
2	fe1b32e0-47cb-482a-b9a5-daa4c4e7810f	RCP Oncologie Thoracique	t
3	02af0ffa-1c35-4b31-bf90-8f85c0ecc7e8	RCP Oncologie Thoracique	t
4	221c97f0-dfb2-416d-932e-3a461468dfd9	RCP Oncologie Thoracique	t
5	7693b8ba-5047-4804-ad33-925a3ad6d4fa	RCP Oncologie Thoracique	t
6	ec0f12ac-0d18-419c-8c0a-7c18695a7b63	RCP Oncologie Thoracique	t
7	00d8a60a-b1fe-414e-9b92-efe3f92cf7f5	RCP Oncologie Thoracique	t
8	64570c81-70b9-417e-bec5-ca2643158478	RCP Thoracique	t
9	725b03f3-d75c-4300-bc3f-4082730abd7b	RCP Thoracique	t
10	c19d46d6-e10e-4aca-ab7b-3c57f7578c0a	RCP Thoracique	t
11	df544ced-b38a-4964-aadd-bf3cc12b229a	RCP Thoracique	t
12	920d878a-1238-4989-80c6-6f2eef4de6d3	RCP Thoracique	t
13	d88d2840-8b3b-4d89-8feb-241139825eca	RCP Thoracique	t
14	b1de3590-eeb0-4d5d-b93f-64a1fc15b85f	RCP Thoracique	t
15	09871899-4e2e-470d-8dde-311a627dfd64	RCP Thoracique	t
16	c5482fe1-6101-43eb-b26e-2701ae21d3c2	RCP Thoracique	t
17	64209f88-a505-4b07-a8eb-828d1bffae6d	RCP Thoracique	t
18	3012312c-8cac-452a-b3ed-7e76a36b3ce5	RCP Thoracique	t
19	dfce2fab-a486-4246-b9be-f263115f318e	RCP Thoracique	t
20	563f7ee6-b683-492c-bec0-5bc9896ecf8c	RCP Thoracique	t
21	5a1b09ff-9d00-42c3-9085-86e573611f40	RCP Thoracique	t
22	99adcc89-00c0-4c28-b953-95ea893e0d9c	RCP Thoracique	t
23	3af4b5d2-2a80-454d-aa2f-28e43ceb98f3	RCP Thoracique	t
24	3495d181-ec8e-48d0-b641-65dc11dda269	RCP Thoracique	t
25	226ec27f-2caa-48f9-91d2-bb81b9af61f5	RCP Thoracique	t
26	3c499eae-6bc4-4ec3-8c37-7fac0d0efcb2	RCP Thoracique	t
27	766073cf-dcd1-4235-a078-83df9b864816	RCP Thoracique	t
28	acda67c6-8740-43ff-9c80-71b1c22f52a9	RCP Thoracique	t
29	16459622-abe4-482b-85f0-0224c027648f	RCP Thoracique	t
30	aabd9fe2-0c3d-4cc5-9a04-dc29ea563de0	RCP Thoracique	t
31	c6274ff9-f67b-4adc-b02f-ccbb6d3f4bbd	RCP Thoracique	t
32	3992b06f-473d-4f83-8344-d388929f5508	RCP Thoracique	t
33	354cc8f4-c3f6-422e-ad96-f0eea2afe533	RCP Thoracique	t
34	dd317270-c9f2-4de0-bd1f-21ed7dab524a	RCP	t
35	ad2ce0f3-0e83-46f2-a47b-468d00e1baf7	RCP Thoracique	t
36	c2ed8c34-aa28-4f6c-98a7-a335fb9df927	RCP Thoracique	t
37	24f6256b-9da8-4666-b58a-d888faac2075	RCP	t
38	48a707db-d717-4886-a004-6e0c01fd82fd	RCP	t
39	4a68eff4-b4d2-416f-9717-c20377b8870a	RCP	t
40	492b12a9-bed5-4144-bdb5-a9d746cc0318	RCP	t
41	e8b3cb56-d535-44d2-91b7-c9fa73b0ba26	RCP	t
42	ae7593c2-9d54-4231-ad7c-2a1bb451fb05	RCP	t
43	28308a56-90f2-4da9-a4dc-328d9615e623	RCP Cancers Digestifs	t
44	a4f56d61-7859-4908-b287-f49357bd7587	RCP	t
45	d55b1030-87da-42f8-a5c1-8d50b8e7992f	RCP	t
46	01354e09-b377-489f-9bf7-d61ae432c6af	RCP Cancer Sein – PAT001	t
47	8b00dd41-5a7a-4061-a73d-3cecc845e44b	RCP Cancer Sein – PAT001	t
48	31a2cfe9-9981-4411-ac0f-b1131410a06d	RCP Cancer Sein – PAT001	t
49	eb0df8e4-5f52-4e70-8e63-3ded3dea3a12	RCP Cancer Sein – PAT001	t
50	eafba77f-7568-42a4-91b1-2fbe12b19879	RCP Cancer Sein – PAT001	t
51	fc33284f-3073-4d4a-8436-3de69a0bbe38	RCP Cancer Sein – PAT001	t
52	f99813ff-eadb-48e2-afe0-3b6589e49169	RCP Cancer Sein – PAT001	t
53	55f85dcf-4ee0-4a1c-93e1-774118f4eb8f	RCP Cancer Sein – PAT001	t
54	90dbe9d5-19c2-471d-b41a-db55d546934a	RCP Cancer Sein – PAT001	t
55	5017ea2f-9a40-4eed-90f1-318aad081347	RCP Cancer Sein – PAT001	t
56	bbacfb09-7d10-449a-966e-06f24167c36c	RCP Cancer Sein – PAT001	t
57	638e781c-b5a3-4779-a6a2-e5e008dfeb72	RCP Cancer Sein – PAT001	t
58	58451d82-c50b-405b-ac0c-cb714a7a0cbb	Onco - cancer sein	t
59	6d850704-969f-42a1-bae6-2309b36d12b4	Onco - cancer sein	t
60	22d894a1-c798-440a-8ae0-9ec40175d96a	RCP - Cancer Poumon	t
61	9926f5a2-c29d-4636-9bf8-79eae87a3ee7	TEST - RCP cancer Sein	t
62	c279b17e-70cd-4da1-89ad-ab249f4f56d8	RCP - Cancer Poumon	t
63	dc8cc826-13f5-4fee-b92b-0d5fb329ace2	RCP test	t
64	e21788bc-579d-4ad7-90ba-29d405e9dfba	RCP test	t
65	d4125586-64dd-4a84-b58f-660b1da33ac4	RCP Cancer Poumon – PAT003	t
66	39626058-1e3f-4b7f-9a03-b52cb53f1165	RCP - Cancer Poumon	t
67	aefb889b-506c-43d6-83c9-cd4e6b8037c6	RCP - Cancer Poumon	t
68	5a671e22-bc6b-4465-aafe-da983489ea1d	RCP - Cancer Poumon	t
69	8c8003d6-a356-4c5b-98a5-221f19aae384	RCP - Cancer Poumon	t
70	7c5362cc-c2d1-405f-906e-e8c0bd6faa2b	RCP - Cancer Poumon	t
71	698b39c8-f04d-41bd-b8c6-b0acb6d72e6e	RCP - Cancer Poumon	t
72	855d2687-fcde-4e75-acc5-c6886fbb745c	RCP - Cancer Poumon	t
73	e3772347-4549-4c89-ad85-6aec4e3ff56a	RCP - Cancer Poumon	t
74	9f8f5ce6-3e8a-4703-afc0-23ffcacc5337	RCP - Cancer Poumon	t
75	904890d6-71d1-4d2d-adec-59b3daeaca62	RCP - Cancer Poumon	t
76	41af06c1-3d6d-4eea-bfd4-d8dd26470d56	RCP	t
77	31315aad-2565-4064-8841-60bba401d493	RCP	t
78	f6edf63c-f3bc-4b40-819a-392e9dfea6b0	RCP test1	t
79	bcda4418-8c90-45a1-bf32-f7b47c9449e9	RCP test1	t
80	7dc35a62-7abc-4139-9dc1-6a641b4502cd	RCP Cancer Ovarien – PAT008	t
81	9b114819-d2ff-4c39-bad1-cc929d8ed880	RCP test1	t
82	dd681a2e-0a28-4aab-8a5e-30b18ba58f56	RCP test1	t
83	af71c4b1-e9b2-44f4-b6b6-d39f8d130add	RCP test1	t
84	d12431a4-4f03-4c02-b3e2-0275a29712c2	RCP test	t
85	ecc6b8fd-8e76-49f4-beab-ee9e000aa792	RCP test	t
86	7cd5cc04-7d63-4c12-a0dc-d1c693ee2f58	RCP test	t
87	e61844d9-6150-4666-b709-4edb2e9e077d	RCP test	t
88	3cefbd68-d60d-4ace-9cd6-0971ea1a3395	RCP Cancer Colorectal – PAT004	t
89	1799553a-6598-473e-b63c-234fc8616d97	RCP test	t
90	c4c01888-cacf-4e48-a1ed-cb24f790113b	RCP test	t
91	aef11d90-749d-4bd0-9886-bdecf427d1fb	RCP test	t
92	d426bc10-4f81-4b5d-b1b7-9d12243e1795	RCP test	t
93	78c0a8af-5927-4186-9a45-f8127689f1a7	RCP test	t
94	26e995a9-7ab8-4e07-b235-85104a6b52b0	RCP test	t
95	a388d4be-50b8-4465-b834-cb1a998787c2	RCP Cancer Poumon – PAT003	t
97	399f7c22-2f94-4251-a660-476097255dac	RCP test	t
96	9360835f-c02c-44ec-9f2c-97b9847ea51e	RCP test	t
98	2f83a810-c551-461b-b279-ee8f7156fa8b	RCP test	t
99	eeb56368-961e-4f07-9882-7f2cb4099ced	RCP test1	t
100	66a5e8c1-b41d-4601-9d64-78fd47df7b05	RCP test1	t
101	5ea55be9-f97f-4038-9927-3c80cce4b0bf	RCP test1	t
102	380077c9-6745-4e4b-9dc9-754f7a43fb12	RCP test1	t
103	9b167133-e3f1-4bf4-be9f-b25256164687	RCP test1	t
104	33653628-92eb-45db-9eb3-f98d23861c7b	test	t
105	4e6ac271-a1b4-4a22-a944-bf5a2c6be197	RCP test	t
106	22222222-2222-2222-2222-222222222222	RCP Cancer Poumon – PAT003	t
107	ea0e6908-f827-4c5b-94f6-ac2ea45c8b24	SIVA	t
108	94629ec2-3dfc-402e-aa3c-9e1b67f6ded0	siva	t
109	29e8276b-767a-49eb-851c-e3fe35cb0a0e	test SIVA	t
110	09bb5d34-9948-474c-a669-e20518c07101	TestSiv	t
111	329c2bb8-6aad-4cbc-9c92-abca68ca71e1	Test-DEMO	t
112	0b78959b-9528-4d04-b413-2186e4d86555	Test-demo2	t
113	42ccaacf-5368-4826-8691-5cdc216cf9cf	Test demo 3	t
114	7fd159c2-f840-43d9-ac78-81e8fff02900	Test DEMO	t
115	bfaf6c73-c22b-477a-8fea-7e1b0877f28f	rcp onco	t
116	586fcfef-d670-4a2c-99e2-4618cbd198c4	onco	t
117	90776f3a-5772-42e9-854e-1678623c8adf	test-lak	t
118	b1630414-ec04-4af9-955a-779221dd00d0	sivama	t
119	c1759fdc-30dc-475b-a1d5-56930e289888	SIVAMA	t
120	a49294d9-b486-4ffb-bdff-0de791fc3a5d	sivama TEST	t
121	0e9379b5-73ad-4a5f-a1b8-ea4632a77ba7	tests	t
122	9fcfa49d-6143-4b2f-bc55-ed1b10f4e66e	test demo	t
123	06bc8b55-37b9-4695-9611-192b204aaccd	test	t
124	3d07df4d-35b0-4702-9ef1-b9d4bf37baab	Test 2	t
125	adf31807-ee18-41ee-a26b-3f6b37a895f5	RCP cancer Sein	t
126	3355761b-2b21-4efe-b397-b4d88c6a98f9	test patio 	t
127	1c66888e-e2f5-4459-9d35-bbf37a9194cc	test vidéo	t
128	06721836-35cb-443a-88e3-f8f5887db900	test patho 	t
129	fec52389-c6b8-45e9-bc63-4b54f51f5e00	test img	t
130	8effbda6-ca25-4a14-a73b-bcfb7a8a6df1	test demo 1	t
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.status (status_id, label) FROM stdin;
1	en_cours
2	en_attente
3	valide
\.


--
-- Data for Name: transcription_blocks; Type: TABLE DATA; Schema: public; Owner: oncocollab
--

COPY public.transcription_blocks (id, meeting_id, speaker_id, speaker_name, text, block_order, timestamp_seconds, source, created_at, updated_at) FROM stdin;
0da5ff86-e0dc-431f-9135-7796dbc0d1b6	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Adrien Germain	Je pense qu'il y a une tumeur à gauche mais qu'il n'y a pas grand chose	0	1780242492	speechcore	2026-05-31 15:48:12.093158	2026-05-31 15:48:12.093158
65945004-61c0-48f6-b5b1-daa967fb4402	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Virginie Clerc	Le premier l'industrie la révolution industrielle au siècle	1	1780243802	speechcore	2026-05-31 16:10:02.273153	2026-05-31 16:10:02.273153
4b27e26c-5d75-44c3-9317-76173f1baf31	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Adrien Germain	Je pense que il y a pas de tumeur	2	1780246523	speechcore	2026-05-31 16:55:23.549348	2026-05-31 16:55:23.549348
8ca72904-16e7-4c38-ad98-382f0b24e533	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Virginie Clerc	Tu m'entends ah oui bah non moi je veux que c'est l'autre qui	3	1780246611	speechcore	2026-05-31 16:56:51.397511	2026-05-31 16:56:51.397511
87561c62-3be9-4934-81da-1f7ee358c5f3	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Adrien Germain	C'est trop cool que j'arrive à m'entendre	4	1780247293	speechcore	2026-05-31 17:08:13.463012	2026-05-31 17:08:13.463012
da9a14f2-0063-44c6-9732-820f4f8bfec7	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Virginie Clerc	ah là ça fonctionne super	5	1780248660	speechcore	2026-05-31 17:31:00.258088	2026-05-31 17:31:00.258088
7c0789bc-995f-4650-935b-ffa6a732c85e	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Adrien Germain	Ça fonctionne c'est parfait	6	1780248670	speechcore	2026-05-31 17:31:10.532404	2026-05-31 17:31:10.532404
ecc9bd09-0509-4cbf-a06d-d6e8a26ca2cf	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Virginie Clerc	ça bug un tout petit peu	7	1780249578	speechcore	2026-05-31 17:46:18.774344	2026-05-31 17:46:18.774344
f5ebb661-f0fc-4c59-8a9a-291729829404	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Adrien Germain	Tu en entends	8	1780249601	speechcore	2026-05-31 17:46:41.143329	2026-05-31 17:46:41.143329
d2713eba-b865-4d37-b983-46ef876ee6b8	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Virginie Clerc	cours	9	1780252665	speechcore	2026-05-31 18:37:45.023162	2026-05-31 18:37:45.023162
402303d2-8157-4c51-9bb7-646c1d031e54	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Adrien Germain	C'est incroyable tu peux commencer à parler	10	1780254944	speechcore	2026-05-31 19:15:44.516241	2026-05-31 19:15:44.516241
f37968b6-92eb-4f6e-8f74-cebfa0ab640a	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Virginie Clerc	c'est aussi incroyable tu peux commencer à parler	10	1780254952	speechcore	2026-05-31 19:15:52.392832	2026-05-31 19:15:52.392832
2099f739-e11e-44ec-87ce-7441a1883cb0	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Adrien Germain	Ça ça marche très très bien	12	1780259166	speechcore	2026-05-31 20:26:06.904436	2026-05-31 20:26:06.904436
b8051078-4222-4e41-8850-25c40cb82d7f	adf31807-ee18-41ee-a26b-3f6b37a895f5	\N	Virginie Clerc	ça ça fonctionne aussi	12	1780259222	speechcore	2026-05-31 20:27:02.904289	2026-05-31 20:27:02.904289
2a64950f-5f71-4c24-87db-0ba9daa472e5	1c66888e-e2f5-4459-9d35-bbf37a9194cc	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Adrien Germain	Il y a un bloc qui se crée et qui enregistre en transcription ce que je suis en train de te dire que je peux arrêter lorsque j'ai envie	0	1781724221	speechcore	2026-06-17 19:23:41.874876	2026-06-17 19:23:41.874876
8993746a-b9bf-429a-b97e-b90abb41d037	1c66888e-e2f5-4459-9d35-bbf37a9194cc	\N	Inconnu	Il y a un bloc qui se crée et qui enregistre en transcription ce que je suis en train de te dire ensuite je peux arrêter lorsque j'ai envie	1	1781724256	speechcore	2026-06-17 19:24:16.496921	2026-06-17 19:24:16.496921
c13bc589-8e48-4130-ab06-7b1a2a91563e	1c66888e-e2f5-4459-9d35-bbf37a9194cc	b8c1e041-f642-46dc-9eb0-196ac81dbc66	Adrien Germain	Donc je me donne la parole et je peux voir la transcription en temps réel de ce que je suis en train de dire donc le bloc qui sera enregistré et qui sera Pris en compte pour le rapport de synthèse je	0	1781724688	speechcore	2026-06-17 19:31:28.486527	2026-06-17 19:31:28.486527
68e4bbc3-20ec-4a3d-a177-08e31b79761c	1c66888e-e2f5-4459-9d35-bbf37a9194cc	be0d4175-1901-4350-b803-664772e06db1	Virginie Clerc	et lorsque j'accepte il y a  un bloc qui se crée et donc cette personne aussi peut parler et arrêter soit lui il arrête soit  l'autre personne	1	1781724725	speechcore	2026-06-17 19:32:06.059727	2026-06-17 19:32:06.059727
a8534f6d-bead-4247-bf1d-973a309ab96b	fec52389-c6b8-45e9-bc63-4b54f51f5e00	aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	Virginie Rivière	Allô	0	1787733788	speechcore	2026-08-26 08:43:08.182743	2026-08-26 08:43:08.182743
21a104b6-82a1-4aae-b3cb-bdc3c2f1bf6d	fec52389-c6b8-45e9-bc63-4b54f51f5e00	9b5285be-a2bb-4600-9c40-68622beb53cd	Simone Chevallier	je pense qu'il y en a aussi une en haut à droite	1	1787736402	speechcore	2026-08-26 09:26:42.737907	2026-08-26 09:26:42.737907
\.


--
-- Name: medical_images_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oncocollab
--

SELECT pg_catalog.setval('public.medical_images_image_id_seq', 10, true);


--
-- Name: prise_en_charge_patient_prise_en_charge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oncocollab
--

SELECT pg_catalog.setval('public.prise_en_charge_patient_prise_en_charge_id_seq', 10, true);


--
-- Name: roles_roleid_seq; Type: SEQUENCE SET; Schema: public; Owner: oncocollab
--

SELECT pg_catalog.setval('public.roles_roleid_seq', 8, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oncocollab
--

SELECT pg_catalog.setval('public.rooms_id_seq', 130, true);


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

\unrestrict PQcPlxrouok1r1I9zDva3ESF2pgaBT0wcZxtSZimS8nm7vTHhcR2Q8UbBRKpWte

