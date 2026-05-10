--
-- PostgreSQL database dump
--

\restrict IO2tBtUJY7zQgpDYScu7qe7z1hszK7h7pShDDxeALEKmsancdNydyFIfWla1emr

-- Dumped from database version 15.14 (Homebrew)
-- Dumped by pg_dump version 15.14 (Homebrew)

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
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: COLUMN doctors.profile_image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.doctors.profile_image_url IS 'URL de la photo de profil stockée dans Supabase Storage';


--
-- Name: medical_images; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: medical_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.medical_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: medical_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.medical_images_image_id_seq OWNED BY public.medical_images.image_id;


--
-- Name: meeting_date_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_date_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    proposed_start timestamp without time zone NOT NULL,
    proposed_end timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: meeting_date_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_date_votes (
    date_option_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    availability text NOT NULL,
    voted_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meeting_date_votes_availability_check CHECK ((availability = ANY (ARRAY['available'::text, 'maybe'::text, 'unavailable'::text])))
);


--
-- Name: meeting_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_participants (
    meeting_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    invitation_status text DEFAULT 'invited'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meeting_participants_invitation_status_check CHECK ((invitation_status = ANY (ARRAY['invited'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: meeting_patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_patients (
    meeting_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    discussion_order integer DEFAULT 1,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: meeting_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_roles (
    meeting_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT meeting_roles_role_check CHECK ((role = ANY (ARRAY['organizer'::text, 'co_admin'::text, 'participant'::text])))
);


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT meetings_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'live'::text, 'postponed'::text, 'finished'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    room_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'system'::character varying])::text[])))
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: prise_en_charge_patient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prise_en_charge_patient (
    prise_en_charge_id integer NOT NULL,
    patientid uuid NOT NULL,
    responsableid uuid NOT NULL,
    type character varying(500),
    status_id integer NOT NULL,
    date_modification timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: prise_en_charge_patient_prise_en_charge_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prise_en_charge_patient_prise_en_charge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prise_en_charge_patient_prise_en_charge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prise_en_charge_patient_prise_en_charge_id_seq OWNED BY public.prise_en_charge_patient.prise_en_charge_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    roleid integer NOT NULL,
    rolename character varying(50) NOT NULL
);


--
-- Name: roles_roleid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_roleid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_roleid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_roleid_seq OWNED BY public.roles.roleid;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    "roomId" character varying NOT NULL,
    name character varying NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status (
    status_id integer NOT NULL,
    label character varying(50) NOT NULL
);


--
-- Name: medical_images image_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_images ALTER COLUMN image_id SET DEFAULT nextval('public.medical_images_image_id_seq'::regclass);


--
-- Name: prise_en_charge_patient prise_en_charge_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge_patient ALTER COLUMN prise_en_charge_id SET DEFAULT nextval('public.prise_en_charge_patient_prise_en_charge_id_seq'::regclass);


--
-- Name: roles roleid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN roleid SET DEFAULT nextval('public.roles_roleid_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doctors (doctorid, email, firstname, lastname, roleid, is_active, created_at, password, profile_image_url) FROM stdin;
aa6ac14f-40b3-4229-a11f-93b7e63bd8e1	dr.riviere@hospital.fr	Virginie	Rivière	3	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
b8c1e041-f642-46dc-9eb0-196ac81dbc66	dr.germain@hospital.fr	Adrien	Germain	1	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	dr.michel@hospital.fr	Maggie	Michel	2	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
be0d4175-1901-4350-b803-664772e06db1	dr.clerc@hospital.fr	Virginie	Clerc	4	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
9b5285be-a2bb-4600-9c40-68622beb53cd	dr.chevallier@hospital.fr	Simone	Chevallier	5	t	2025-12-15 15:29:46.393647	$argon2id$v=19$m=65536,t=3,p=4$Fdw1zn3D6rC+vxDh8X+qeg$GWq5X1f06+dgKrfNFF81XinB0gDcwEtNnlkGe0iwMSw	\N
\.


--
-- Data for Name: medical_images; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: meeting_date_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_date_options (id, meeting_id, proposed_start, proposed_end, created_at) FROM stdin;
\.


--
-- Data for Name: meeting_date_votes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_date_votes (date_option_id, doctor_id, availability, voted_at) FROM stdin;
\.


--
-- Data for Name: meeting_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_participants (meeting_id, doctor_id, invitation_status, created_at) FROM stdin;
c1759fdc-30dc-475b-a1d5-56930e289888	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-03-16 22:53:41.843346
c1759fdc-30dc-475b-a1d5-56930e289888	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	invited	2026-03-16 22:53:41.845646
a49294d9-b486-4ffb-bdff-0de791fc3a5d	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-03-17 22:44:17.707749
a49294d9-b486-4ffb-bdff-0de791fc3a5d	9b5285be-a2bb-4600-9c40-68622beb53cd	invited	2026-03-17 22:44:17.711128
0e9379b5-73ad-4a5f-a1b8-ea4632a77ba7	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-03-23 10:50:27.964318
0e9379b5-73ad-4a5f-a1b8-ea4632a77ba7	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	invited	2026-03-23 10:50:27.967045
d509d6b7-afe5-4298-a1db-5d00952bbefe	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	invited	2026-03-24 20:45:13.753792
d509d6b7-afe5-4298-a1db-5d00952bbefe	be0d4175-1901-4350-b803-664772e06db1	invited	2026-03-24 20:45:13.757769
9fcfa49d-6143-4b2f-bc55-ed1b10f4e66e	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-03-29 21:36:06.517637
9fcfa49d-6143-4b2f-bc55-ed1b10f4e66e	9b5285be-a2bb-4600-9c40-68622beb53cd	invited	2026-03-29 21:36:06.523681
09bb5d34-9948-474c-a669-e20518c07101	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	invited	2026-02-19 14:55:04.343623
09bb5d34-9948-474c-a669-e20518c07101	b8c1e041-f642-46dc-9eb0-196ac81dbc66	invited	2026-02-19 14:55:04.345023
\.


--
-- Data for Name: meeting_patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_patients (meeting_id, patient_id, discussion_order, notes, created_at) FROM stdin;
09bb5d34-9948-474c-a669-e20518c07101	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-02-19 14:55:04.34652
c1759fdc-30dc-475b-a1d5-56930e289888	2b224d16-dcd8-4608-adde-faec60195032	1	\N	2026-03-16 22:53:41.8493
a49294d9-b486-4ffb-bdff-0de791fc3a5d	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-03-17 22:44:17.714851
0e9379b5-73ad-4a5f-a1b8-ea4632a77ba7	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-03-23 10:50:27.96974
d509d6b7-afe5-4298-a1db-5d00952bbefe	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-03-24 20:45:13.760902
9fcfa49d-6143-4b2f-bc55-ed1b10f4e66e	d135460a-f220-4c6b-8964-b55eadbcf7d4	1	\N	2026-03-29 21:36:06.5294
\.


--
-- Data for Name: meeting_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meeting_roles (meeting_id, doctor_id, role, created_at, updated_at) FROM stdin;
09bb5d34-9948-474c-a669-e20518c07101	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	organizer	2026-02-19 14:55:04.345637	2026-02-19 14:55:04.345637
c1759fdc-30dc-475b-a1d5-56930e289888	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-03-16 22:53:41.847217	2026-03-16 22:53:41.847217
a49294d9-b486-4ffb-bdff-0de791fc3a5d	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-03-17 22:44:17.712684	2026-03-17 22:44:17.712684
0e9379b5-73ad-4a5f-a1b8-ea4632a77ba7	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-03-23 10:50:27.968667	2026-03-23 10:50:27.968667
d509d6b7-afe5-4298-a1db-5d00952bbefe	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	organizer	2026-03-24 20:45:13.759224	2026-03-24 20:45:13.759224
9fcfa49d-6143-4b2f-bc55-ed1b10f4e66e	b8c1e041-f642-46dc-9eb0-196ac81dbc66	organizer	2026-03-29 21:36:06.526049	2026-03-29 21:36:06.526049
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meetings (id, title, description, start_time, end_time, status, created_by, postponed_reason, created_at, updated_at) FROM stdin;
09bb5d34-9948-474c-a669-e20518c07101	TestSiv	sivayanama	2026-02-26 12:30:00	2026-02-20 13:40:00	scheduled	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	\N	2026-02-19 14:55:04.339214	2026-02-19 14:56:08.895961
c1759fdc-30dc-475b-a1d5-56930e289888	SIVAMA	TEST	2026-03-26 12:30:00	2026-03-26 13:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-03-16 22:53:41.837453	2026-03-16 22:53:41.837453
a49294d9-b486-4ffb-bdff-0de791fc3a5d	sivama TEST	TEST	2026-03-18 12:30:00	2026-03-18 13:00:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-03-17 22:44:17.700686	2026-03-17 22:44:17.700686
0e9379b5-73ad-4a5f-a1b8-ea4632a77ba7	tests	\N	2026-03-25 12:30:00	2026-03-25 13:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-03-23 10:50:27.954263	2026-03-23 10:50:27.954263
d509d6b7-afe5-4298-a1db-5d00952bbefe	test supa	\N	2026-03-26 13:40:00	2026-03-26 15:30:00	scheduled	19f210fa-7fab-47a8-badd-fdb7cf1a5c0d	\N	2026-03-24 20:45:13.743916	2026-03-24 20:45:13.743916
9fcfa49d-6143-4b2f-bc55-ed1b10f4e66e	test demo	test	2026-03-30 12:30:00	2026-03-30 13:30:00	scheduled	b8c1e041-f642-46dc-9eb0-196ac81dbc66	\N	2026-03-29 21:36:06.505701	2026-03-29 21:36:06.505701
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, meeting_id, room_id, sender_id, content, message_type, created_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: prise_en_charge_patient; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
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
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.status (status_id, label) FROM stdin;
1	en_cours
2	en_attente
3	valide
\.


--
-- Name: medical_images_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.medical_images_image_id_seq', 10, true);


--
-- Name: prise_en_charge_patient_prise_en_charge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prise_en_charge_patient_prise_en_charge_id_seq', 10, true);


--
-- Name: roles_roleid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_roleid_seq', 8, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rooms_id_seq', 122, true);


--
-- Name: rooms PK_0368a2d7c215f2d0458a54933f2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY (id);


--
-- Name: doctors doctors_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_email_key UNIQUE (email);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (doctorid);


--
-- Name: medical_images medical_images_orthanc_study_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_images
    ADD CONSTRAINT medical_images_orthanc_study_id_key UNIQUE (orthanc_study_id);


--
-- Name: medical_images medical_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_images
    ADD CONSTRAINT medical_images_pkey PRIMARY KEY (image_id);


--
-- Name: meeting_date_options meeting_date_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_date_options
    ADD CONSTRAINT meeting_date_options_pkey PRIMARY KEY (id);


--
-- Name: meeting_date_votes meeting_date_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_date_votes
    ADD CONSTRAINT meeting_date_votes_pkey PRIMARY KEY (date_option_id, doctor_id);


--
-- Name: meeting_participants meeting_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT meeting_participants_pkey PRIMARY KEY (meeting_id, doctor_id);


--
-- Name: meeting_patients meeting_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_patients
    ADD CONSTRAINT meeting_patients_pkey PRIMARY KEY (meeting_id, patient_id);


--
-- Name: meeting_roles meeting_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_roles
    ADD CONSTRAINT meeting_roles_pkey PRIMARY KEY (meeting_id, doctor_id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: patients patients_patient_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_number_key UNIQUE (patient_number);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patientid);


--
-- Name: prise_en_charge_patient prise_en_charge_patient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge_patient
    ADD CONSTRAINT prise_en_charge_patient_pkey PRIMARY KEY (prise_en_charge_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (roleid);


--
-- Name: roles roles_rolename_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_rolename_key UNIQUE (rolename);


--
-- Name: status status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_pkey PRIMARY KEY (status_id);


--
-- Name: idx_medical_images_orthanc_study; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_images_orthanc_study ON public.medical_images USING btree (orthanc_study_id);


--
-- Name: idx_medical_images_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_images_patient_id ON public.medical_images USING btree (patient_id);


--
-- Name: idx_medical_images_patient_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_images_patient_number ON public.medical_images USING btree (patient_number);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);


--
-- Name: idx_messages_meeting_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_meeting_id ON public.messages USING btree (meeting_id);


--
-- Name: idx_messages_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_room_id ON public.messages USING btree (room_id);


--
-- Name: doctors doctors_roleid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_roleid_fkey FOREIGN KEY (roleid) REFERENCES public.roles(roleid);


--
-- Name: meeting_date_options fk_date_option_meeting; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_date_options
    ADD CONSTRAINT fk_date_option_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meetings fk_meeting_creator; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT fk_meeting_creator FOREIGN KEY (created_by) REFERENCES public.doctors(doctorid);


--
-- Name: meeting_patients fk_meeting_patient_meeting; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_patients
    ADD CONSTRAINT fk_meeting_patient_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_patients fk_meeting_patient_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_patients
    ADD CONSTRAINT fk_meeting_patient_patient FOREIGN KEY (patient_id) REFERENCES public.patients(patientid) ON DELETE CASCADE;


--
-- Name: messages fk_messages_meeting; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: messages fk_messages_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: meeting_participants fk_participant_doctor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT fk_participant_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: meeting_participants fk_participant_meeting; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT fk_participant_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: prise_en_charge_patient fk_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge_patient
    ADD CONSTRAINT fk_patient FOREIGN KEY (patientid) REFERENCES public.patients(patientid) ON DELETE CASCADE;


--
-- Name: prise_en_charge_patient fk_responsable; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge_patient
    ADD CONSTRAINT fk_responsable FOREIGN KEY (responsableid) REFERENCES public.doctors(doctorid);


--
-- Name: meeting_roles fk_role_doctor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_roles
    ADD CONSTRAINT fk_role_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: meeting_roles fk_role_meeting; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_roles
    ADD CONSTRAINT fk_role_meeting FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: prise_en_charge_patient fk_status; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prise_en_charge_patient
    ADD CONSTRAINT fk_status FOREIGN KEY (status_id) REFERENCES public.status(status_id);


--
-- Name: meeting_date_votes fk_vote_doctor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_date_votes
    ADD CONSTRAINT fk_vote_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctorid) ON DELETE CASCADE;


--
-- Name: meeting_date_votes fk_vote_option; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_date_votes
    ADD CONSTRAINT fk_vote_option FOREIGN KEY (date_option_id) REFERENCES public.meeting_date_options(id) ON DELETE CASCADE;


--
-- Name: medical_images medical_images_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_images
    ADD CONSTRAINT medical_images_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patientid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict IO2tBtUJY7zQgpDYScu7qe7z1hszK7h7pShDDxeALEKmsancdNydyFIfWla1emr

