--
-- PostgreSQL database dump
--

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activities (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category_type integer NOT NULL,
    play_type integer NOT NULL,
    reward_token_type integer NOT NULL,
    reward_amount character varying(78) NOT NULL,
    reward_slots character varying(20) NOT NULL,
    start_at timestamp without time zone NOT NULL,
    end_at timestamp without time zone NOT NULL,
    cover_image character varying(500),
    token_id integer,
    initiator_type integer NOT NULL,
    audience_type integer NOT NULL,
    creator_id integer,
    status integer DEFAULT 1,
    min_daily_trade_amount character varying(78),
    invite_min_count character varying(20),
    invitee_min_trade_amount character varying(78),
    heat_vote_target character varying(20),
    comment_min_count character varying(20),
    reward_token_id integer,
    reward_token_address character varying(42),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activities OWNER TO postgres;

--
-- Name: activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activities_id_seq OWNER TO postgres;

--
-- Name: activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activities_id_seq OWNED BY public.activities.id;


--
-- Name: activity_participations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_participations (
    id integer NOT NULL,
    activity_id integer NOT NULL,
    user_id integer NOT NULL,
    status integer DEFAULT 1,
    reward_claimed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_participations OWNER TO postgres;

--
-- Name: activity_participations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_participations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_participations_id_seq OWNER TO postgres;

--
-- Name: activity_participations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_participations_id_seq OWNED BY public.activity_participations.id;


--
-- Name: agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents (
    id integer NOT NULL,
    user_id integer NOT NULL,
    address character varying(42) NOT NULL,
    invitation_code character varying(20) NOT NULL,
    level integer DEFAULT 1,
    parent_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agents OWNER TO postgres;

--
-- Name: agents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agents_id_seq OWNER TO postgres;

--
-- Name: agents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agents_id_seq OWNED BY public.agents.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    token_id integer NOT NULL,
    user_id integer NOT NULL,
    content text,
    img character varying(500),
    holding_amount numeric(78,0) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: indexer_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indexer_state (
    id integer NOT NULL,
    contract_address character varying(42) NOT NULL,
    last_block_number bigint NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.indexer_state OWNER TO postgres;

--
-- Name: indexer_state_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.indexer_state_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.indexer_state_id_seq OWNER TO postgres;

--
-- Name: indexer_state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.indexer_state_id_seq OWNED BY public.indexer_state.id;


--
-- Name: invites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invites (
    id integer NOT NULL,
    inviter_id integer NOT NULL,
    invitee_id integer NOT NULL,
    inviter_address character varying(42) NOT NULL,
    invitee_address character varying(42) NOT NULL,
    invitation_code character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invites OWNER TO postgres;

--
-- Name: invites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invites_id_seq OWNER TO postgres;

--
-- Name: invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invites_id_seq OWNED BY public.invites.id;


--
-- Name: klines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.klines (
    id integer NOT NULL,
    token_address character varying(42) NOT NULL,
    "interval" character varying(10) NOT NULL,
    open_time timestamp without time zone NOT NULL,
    open_price numeric(78,18) NOT NULL,
    high_price numeric(78,18) NOT NULL,
    low_price numeric(78,18) NOT NULL,
    close_price numeric(78,18) NOT NULL,
    volume numeric(78,0) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.klines OWNER TO postgres;

--
-- Name: klines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.klines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.klines_id_seq OWNER TO postgres;

--
-- Name: klines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.klines_id_seq OWNED BY public.klines.id;


--
-- Name: nonce_sequence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nonce_sequence (
    id integer NOT NULL,
    chain_id integer NOT NULL,
    current_nonce bigint DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.nonce_sequence OWNER TO postgres;

--
-- Name: nonce_sequence_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nonce_sequence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nonce_sequence_id_seq OWNER TO postgres;

--
-- Name: nonce_sequence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nonce_sequence_id_seq OWNED BY public.nonce_sequence.id;


--
-- Name: rebate_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rebate_records (
    id integer NOT NULL,
    user_id integer NOT NULL,
    trader_id integer NOT NULL,
    user_address character varying(42) NOT NULL,
    amount numeric(18,8) NOT NULL,
    status integer DEFAULT 0,
    tx_hash character varying(66),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rebate_records OWNER TO postgres;

--
-- Name: rebate_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rebate_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rebate_records_id_seq OWNER TO postgres;

--
-- Name: rebate_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rebate_records_id_seq OWNED BY public.rebate_records.id;


--
-- Name: token_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_balances (
    id integer NOT NULL,
    token_address character varying(42) NOT NULL,
    holder_address character varying(42) NOT NULL,
    balance numeric(78,0) DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.token_balances OWNER TO postgres;

--
-- Name: token_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.token_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.token_balances_id_seq OWNER TO postgres;

--
-- Name: token_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.token_balances_id_seq OWNED BY public.token_balances.id;


--
-- Name: token_bought_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_bought_events (
    id integer NOT NULL,
    token_address character varying(42) NOT NULL,
    buyer_address character varying(42) NOT NULL,
    bnb_amount numeric(78,0) NOT NULL,
    token_amount numeric(78,0) NOT NULL,
    trading_fee numeric(78,0) DEFAULT 0 NOT NULL,
    virtual_bnb_reserve numeric(78,0) DEFAULT 0 NOT NULL,
    virtual_token_reserve numeric(78,0) DEFAULT 0 NOT NULL,
    available_tokens numeric(78,0) DEFAULT 0 NOT NULL,
    collected_bnb numeric(78,0) DEFAULT 0 NOT NULL,
    transaction_hash character varying(66) NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp without time zone NOT NULL,
    log_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.token_bought_events OWNER TO postgres;

--
-- Name: token_bought_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.token_bought_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.token_bought_events_id_seq OWNER TO postgres;

--
-- Name: token_bought_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.token_bought_events_id_seq OWNED BY public.token_bought_events.id;


--
-- Name: token_created_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_created_events (
    id integer NOT NULL,
    token_address character varying(42) NOT NULL,
    creator_address character varying(42) NOT NULL,
    name character varying(255) NOT NULL,
    symbol character varying(50) NOT NULL,
    total_supply numeric(78,0) NOT NULL,
    request_id character varying(66) NOT NULL,
    transaction_hash character varying(66) NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp without time zone NOT NULL,
    log_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.token_created_events OWNER TO postgres;

--
-- Name: token_created_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.token_created_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.token_created_events_id_seq OWNER TO postgres;

--
-- Name: token_created_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.token_created_events_id_seq OWNED BY public.token_created_events.id;


--
-- Name: token_creation_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_creation_requests (
    id integer NOT NULL,
    request_id character varying(66) NOT NULL,
    creator_address character varying(42) NOT NULL,
    name character varying(100) NOT NULL,
    symbol character varying(50) NOT NULL,
    description text,
    logo character varying(500),
    banner character varying(500),
    total_supply numeric(78,0) NOT NULL,
    sale_amount numeric(78,0) NOT NULL,
    virtual_bnb_reserve numeric(78,0) NOT NULL,
    virtual_token_reserve numeric(78,0) NOT NULL,
    launch_mode integer DEFAULT 1 NOT NULL,
    launch_time bigint DEFAULT 0 NOT NULL,
    creation_fee numeric(78,0) DEFAULT 0,
    nonce integer NOT NULL,
    salt character varying(66),
    predicted_address character varying(42),
    signature character varying(132),
    encoded_data text,
    initial_buy_percentage integer DEFAULT 0,
    margin_bnb numeric(78,0) DEFAULT 0,
    margin_time bigint DEFAULT 0,
    vesting_allocations jsonb,
    website character varying(500),
    twitter character varying(500),
    telegram character varying(500),
    discord character varying(500),
    whitepaper character varying(500),
    contact_email character varying(255),
    contact_tg character varying(255),
    tags text[],
    status integer DEFAULT 0,
    tx_hash character varying(66),
    error_message text,
    "timestamp" bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.token_creation_requests OWNER TO postgres;

--
-- Name: token_creation_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.token_creation_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.token_creation_requests_id_seq OWNER TO postgres;

--
-- Name: token_creation_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.token_creation_requests_id_seq OWNED BY public.token_creation_requests.id;


--
-- Name: token_graduated_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_graduated_events (
    id integer NOT NULL,
    token_address character varying(42) NOT NULL,
    liquidity_bnb numeric(78,0) NOT NULL,
    liquidity_tokens numeric(78,0) NOT NULL,
    liquidity_result numeric(78,0) NOT NULL,
    transaction_hash character varying(66) NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp without time zone NOT NULL,
    log_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.token_graduated_events OWNER TO postgres;

--
-- Name: token_graduated_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.token_graduated_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.token_graduated_events_id_seq OWNER TO postgres;

--
-- Name: token_graduated_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.token_graduated_events_id_seq OWNED BY public.token_graduated_events.id;


--
-- Name: token_sold_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_sold_events (
    id integer NOT NULL,
    token_address character varying(42) NOT NULL,
    seller_address character varying(42) NOT NULL,
    token_amount numeric(78,0) NOT NULL,
    bnb_amount numeric(78,0) NOT NULL,
    trading_fee numeric(78,0) DEFAULT 0 NOT NULL,
    virtual_bnb_reserve numeric(78,0) DEFAULT 0 NOT NULL,
    virtual_token_reserve numeric(78,0) DEFAULT 0 NOT NULL,
    available_tokens numeric(78,0) DEFAULT 0 NOT NULL,
    collected_bnb numeric(78,0) DEFAULT 0 NOT NULL,
    transaction_hash character varying(66) NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp without time zone NOT NULL,
    log_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.token_sold_events OWNER TO postgres;

--
-- Name: token_sold_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.token_sold_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.token_sold_events_id_seq OWNER TO postgres;

--
-- Name: token_sold_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.token_sold_events_id_seq OWNED BY public.token_sold_events.id;


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokens (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    symbol character varying(50) NOT NULL,
    logo character varying(500) NOT NULL,
    banner character varying(500),
    description text,
    token_contract_address character varying(42) NOT NULL,
    creator_address character varying(42) NOT NULL,
    launch_mode integer DEFAULT 1 NOT NULL,
    launch_time bigint NOT NULL,
    bnb_current numeric(78,0) DEFAULT 0,
    bnb_target numeric(78,0) NOT NULL,
    margin_bnb numeric(78,0) DEFAULT 0,
    total_supply numeric(78,0) NOT NULL,
    status integer DEFAULT 1,
    website character varying(500),
    twitter character varying(500),
    telegram character varying(500),
    discord character varying(500),
    whitepaper character varying(500),
    tags text[],
    hot integer DEFAULT 0,
    token_lv integer DEFAULT 0,
    token_rank integer DEFAULT 0,
    request_id character varying(66),
    nonce integer NOT NULL,
    salt character varying(66),
    pre_buy_percent numeric(5,4) DEFAULT 0,
    margin_time bigint DEFAULT 0,
    contact_email character varying(255),
    contact_tg character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tokens OWNER TO postgres;

--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_id_seq OWNER TO postgres;

--
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- Name: trades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trades (
    id integer NOT NULL,
    token_address character varying(42) NOT NULL,
    user_address character varying(42) NOT NULL,
    trade_type integer NOT NULL,
    bnb_amount numeric(78,0) NOT NULL,
    token_amount numeric(78,0) NOT NULL,
    price numeric(78,18) NOT NULL,
    usd_amount numeric(18,2),
    transaction_hash character varying(66) NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.trades OWNER TO postgres;

--
-- Name: trades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trades_id_seq OWNER TO postgres;

--
-- Name: trades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trades_id_seq OWNED BY public.trades.id;


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_favorites OWNER TO postgres;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_favorites_id_seq OWNER TO postgres;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_favorites_id_seq OWNED BY public.user_favorites.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    address character varying(42) NOT NULL,
    username character varying(100),
    email character varying(255),
    avatar character varying(500),
    nonce character varying(64),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities ALTER COLUMN id SET DEFAULT nextval('public.activities_id_seq'::regclass);


--
-- Name: activity_participations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_participations ALTER COLUMN id SET DEFAULT nextval('public.activity_participations_id_seq'::regclass);


--
-- Name: agents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents ALTER COLUMN id SET DEFAULT nextval('public.agents_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: indexer_state id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indexer_state ALTER COLUMN id SET DEFAULT nextval('public.indexer_state_id_seq'::regclass);


--
-- Name: invites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites ALTER COLUMN id SET DEFAULT nextval('public.invites_id_seq'::regclass);


--
-- Name: klines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.klines ALTER COLUMN id SET DEFAULT nextval('public.klines_id_seq'::regclass);


--
-- Name: nonce_sequence id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nonce_sequence ALTER COLUMN id SET DEFAULT nextval('public.nonce_sequence_id_seq'::regclass);


--
-- Name: rebate_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rebate_records ALTER COLUMN id SET DEFAULT nextval('public.rebate_records_id_seq'::regclass);


--
-- Name: token_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_balances ALTER COLUMN id SET DEFAULT nextval('public.token_balances_id_seq'::regclass);


--
-- Name: token_bought_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_bought_events ALTER COLUMN id SET DEFAULT nextval('public.token_bought_events_id_seq'::regclass);


--
-- Name: token_created_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_created_events ALTER COLUMN id SET DEFAULT nextval('public.token_created_events_id_seq'::regclass);


--
-- Name: token_creation_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_creation_requests ALTER COLUMN id SET DEFAULT nextval('public.token_creation_requests_id_seq'::regclass);


--
-- Name: token_graduated_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_graduated_events ALTER COLUMN id SET DEFAULT nextval('public.token_graduated_events_id_seq'::regclass);


--
-- Name: token_sold_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_sold_events ALTER COLUMN id SET DEFAULT nextval('public.token_sold_events_id_seq'::regclass);


--
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- Name: trades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades ALTER COLUMN id SET DEFAULT nextval('public.trades_id_seq'::regclass);


--
-- Name: user_favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites ALTER COLUMN id SET DEFAULT nextval('public.user_favorites_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activities (id, name, description, category_type, play_type, reward_token_type, reward_amount, reward_slots, start_at, end_at, cover_image, token_id, initiator_type, audience_type, creator_id, status, min_daily_trade_amount, invite_min_count, invitee_min_trade_amount, heat_vote_target, comment_min_count, reward_token_id, reward_token_address, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: activity_participations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_participations (id, activity_id, user_id, status, reward_claimed, created_at) FROM stdin;
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents (id, user_id, address, invitation_code, level, parent_id, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, token_id, user_id, content, img, holding_amount, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: indexer_state; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.indexer_state (id, contract_address, last_block_number, updated_at) FROM stdin;
15664	0xb91288fd6ab205623d72a2dda29230efe04d6dfd	69443556	2026-01-06 14:55:37.292248
15682	0x69207f321cfdfd30d73d1d9278e4132e15080ec9	83432334	2026-01-09 21:02:50.857599
\.


--
-- Data for Name: invites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invites (id, inviter_id, invitee_id, inviter_address, invitee_address, invitation_code, created_at) FROM stdin;
\.


--
-- Data for Name: klines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.klines (id, token_address, "interval", open_time, open_price, high_price, low_price, close_price, volume, created_at) FROM stdin;
\.


--
-- Data for Name: nonce_sequence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nonce_sequence (id, chain_id, current_nonce, updated_at) FROM stdin;
1	97	100	2026-01-09 20:45:00.183934
\.


--
-- Data for Name: rebate_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rebate_records (id, user_id, trader_id, user_address, amount, status, tx_hash, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: token_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_balances (id, token_address, holder_address, balance, updated_at) FROM stdin;
\.


--
-- Data for Name: token_bought_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_bought_events (id, token_address, buyer_address, bnb_amount, token_amount, trading_fee, virtual_bnb_reserve, virtual_token_reserve, available_tokens, collected_bnb, transaction_hash, block_number, block_timestamp, log_index, created_at) FROM stdin;
1	0x34321291A4aB6B1FcC38d28c9512752536f7f67f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	9900000000000000	791216695471483231600716	100000000000000	10009900000000000000	799208783304528516768399284	799208783304528516768399284	9900000000000000	0x3bb386d159031979dab9625acd2bec31aabb5ec9c047a2ea64574ac520b93a97	82803334	2026-01-06 14:03:32	1	2026-01-06 14:56:10.379746
2	0x12bBa5DB3DCb373216B636b01F1472948CD9d69b	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	9900000000000000	791216695471483231600716	100000000000000	10009900000000000000	799208783304528516768399284	799208783304528516768399284	9900000000000000	0x61c07198ffb1dc78c6ba5ba937bf8e85012795d7d6810264627196eca0d76569	82808746	2026-01-06 14:44:12	7	2026-01-06 14:56:41.282481
3	0x5b02EBe72762596BA90884ee717e049833eD3500	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	9900000000000000	791216695471483231600716	100000000000000	10009900000000000000	799208783304528516768399284	799208783304528516768399284	9900000000000000	0x6791f9171df35f840d3b27a89eb5bbf90f1fbb8c43eb439761dd362e63e5a252	83030484	2026-01-07 18:34:53	7	2026-01-07 21:12:45.501866
4	0x9cFcDc67e30c73558a141Fe071cF4a98428e4e32	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	99000000000000000	12782040315489925130013025	1000000000000000	8318178082191780000	1061190561684510074869986975	787217959684510074869986975	99000000000000000	0x6c83ba6759602da91ab037a50126c453720cac2f08ed3715269c4fed20472b6b	83051880	2026-01-07 21:15:47	1	2026-01-07 21:15:48.508758
5	0x8ae0B09003dd6608FC42475BF6c02BA10781AF6f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	99000000000000000	12782040315489925130013025	1000000000000000	8318178082191780000	1061190561684510074869986975	787217959684510074869986975	99000000000000000	0x5c3851826065c39cbf0438fe2f19fd6b78acfa444e66996483b18a07953b8139	83053299	2026-01-07 21:26:28	3	2026-01-07 21:26:30.590859
6	0x38687d9061DB30a9cD8c0c04324F60dB2783C4D6	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	99000000000000000	12782040315489925130013025	1000000000000000	8318178082191780000	1061190561684510074869986975	787217959684510074869986975	99000000000000000	0x1c99bf03cc870d978b9507c654248ebfe1cbee3418b74853ae159fd7bd331865	83070474	2026-01-07 23:36:09	1	2026-01-07 23:36:13.023894
7	0x8ae0B09003dd6608FC42475BF6c02BA10781AF6f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	99000000000000000	12631260258136253738905892	1000000000000000	8367381753083871047	1054950321584113821131081083	780977719584113821131081083	148203670892091047	0x460c97654d4ea547eb8671bf49f68bc3e1eba15dd8bf483a60c7235b30de2137	83396518	2026-01-09 16:33:09	1	2026-01-09 17:02:44.889912
8	0xBbfa3b3DD93D93454fc68A768758C6cC8FC336e5	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	99000000000000000	12782040315489925130013025	1000000000000000	8318178082191780000	1061190561684510074869986975	787217959684510074869986975	99000000000000000	0xc64cadeabfb87dc339f3317d1e371bf33457e7ed4feb40eebb467c72baeb0089	83404883	2026-01-09 17:36:07	1	2026-01-09 17:36:08.543969
9	0x4e5Bf06a2474573220d43a3C94c788f6018d8E71	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	99000000000000000	12782040315489925130013025	1000000000000000	8318178082191780000	1061190561684510074869986975	787217959684510074869986975	99000000000000000	0xda43532cd32e3900931aa80451a2c66414f6801f122e4bb20f76b87a5f798a63	83430025	2026-01-09 20:45:30	3	2026-01-09 20:45:33.179517
\.


--
-- Data for Name: token_created_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_created_events (id, token_address, creator_address, name, symbol, total_supply, request_id, transaction_hash, block_number, block_timestamp, log_index, created_at) FROM stdin;
17	0x34321291A4aB6B1FcC38d28c9512752536f7f67f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 1	TEST1	1000000000000000000000000000	0x98673ec6022af7c5e8047de47ebf84c6ad8c75c92095a0dde91470330b6771e1	0xabddd58e07d0334b44c156b06f605fbfe7f07955632f21debda0f3028dd57e6b	82803326	2026-01-06 14:03:29	5	2026-01-06 14:56:10.364598
18	0x092e020Fa1929207b6bBa4F4c588863634DE50eb	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 2 InitialBuy	TEST2	1000000000000000000000000000	0x78ff5184bfed1bb04f10c8d566da34ebffbda7daed86a20456bd42cf6bc0d097	0x4bc35c51edef1e0837c439f01d317a78907929da0064b139c259ed5cd3c3574c	82803357	2026-01-06 14:03:43	7	2026-01-06 14:56:10.364598
19	0xB3Ec7E0dD45A397C966B22d2dE911F0145503c82	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 3 Vesting	TEST3	1000000000000000000000000000	0x9fd72506a409cbe5e679eb52271e15d3f116acfd17f94c81eb4fd8e44359f09b	0xbfc62b15a142de42ab1b12d1a01be4e30d84b98d331d58ff19265b1d53f0195c	82803363	2026-01-06 14:03:45	9	2026-01-06 14:56:10.364598
20	0x12bBa5DB3DCb373216B636b01F1472948CD9d69b	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 1	TEST1	1000000000000000000000000000	0x5fca43a01703870508a63d9122a30e8b1020cb3907f789bfca2b04cb7fd90bf1	0x3ffcf1ea10f5fd73a1d86efc1899e312d962062bff537121ce2e92a87d286c4a	82808746	2026-01-06 14:44:12	5	2026-01-06 14:56:41.270046
21	0x96060d0b291284e6b7D4ccffBB8656c11348B6Bf	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 2 InitialBuy	TEST2	1000000000000000000000000000	0xd1f50982229cc7801feda0d7a2af16cd38fa48207b122a9f0ef1ab79bf92b7d6	0x73c7bf24b5e49cc3d3a60af5461f40acdf639b86873ddeccb7141d5bb2025c21	82808746	2026-01-06 14:44:12	19	2026-01-06 14:56:41.270046
22	0x0c0FE9b6AF42999FE16d0ABE9aEF6681C78ca7Fe	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 3 Vesting	TEST3	1000000000000000000000000000	0x1613083e31a1b1b1d79961d07e2851a852b6bad52bbd8e7e9984676fe0d9d899	0x6b628799b62536dc6758643e0131a20bc59b6203811134a7930febb6c146cdb5	82808746	2026-01-06 14:44:12	33	2026-01-06 14:56:41.270046
23	0x5b02EBe72762596BA90884ee717e049833eD3500	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 1	TEST1	1000000000000000000000000000	0x742a3a04701ba2b8901a024fdbaca95c8526caf4388efe470436e6ddc951ad5e	0x29fd58b09532014fb188418fba063a1aba11493e97c59535283a61d03f32d0ed	83030484	2026-01-07 18:34:53	5	2026-01-07 21:12:45.480225
24	0x681855F1982D1eFfA97d3Fcb7f9A4949691ccC30	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 2 InitialBuy	TEST2	1000000000000000000000000000	0x9fd6e853c800cd0dbc57e4086c458a63dcbdc09a7fa3fc38940e4b3436767689	0x9cb78578abb52512d92b5d233d9257efeddc7d779744a77b33d18142688f39c3	83030484	2026-01-07 18:34:53	19	2026-01-07 21:12:45.480225
25	0x7ce8C0C1d47EC51Ed8BfD4d93581E8e1655A47b1	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	Test Token 3 Vesting	TEST3	1000000000000000000000000000	0xe26bd51401558f6fc9dde65ef30701f3f690c2e7002d196035847b69f190b921	0xc49a47642dbf60ab083d4ab5ab10fe13e35677539c2aeddf4daa4b8b14bb84fb	83030484	2026-01-07 18:34:53	33	2026-01-07 21:12:45.480225
26	0x9cFcDc67e30c73558a141Fe071cF4a98428e4e32	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	ZOOD	ZOOD	1000000000000000000000000000	0xe3fada928f7aaecc3c62e15ea4074f55c799760fe057a7cac334f70d6f5614ed	0x22f8fc65a8c8e26e2fb32d1e6ab755dadf8f58602d0a419ea9809b14852b3b62	83045033	2026-01-07 20:24:18	5	2026-01-07 21:14:12.444065
27	0xF078D72AadcBfBD8a96EbD61E127a98a2f63ebdC	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	WPC	WPC	1000000000000000000000000000	0x483f85bb16759a114fe377e4e9ac1efbc714d23bbe74d36266f66c39d0e91393	0x33e14f2ff5d17e4901f2260fce6460d300c63d598ac7f3b47e61fbdcf6955afb	83051554	2026-01-07 21:13:20	11	2026-01-07 21:14:51.499996
28	0x8ae0B09003dd6608FC42475BF6c02BA10781AF6f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	www	WWW	1000000000000000000000000000	0x43d7a165528ad1f32c3874826cae84a8deb87b9ace012b1bdc99c8ccd1a591e6	0x38daae6706a998fcd461714812c89af1c49afde4056ceb834714a0a7cd3f065b	83052836	2026-01-07 21:23:00	5	2026-01-07 21:23:03.536299
29	0x38687d9061DB30a9cD8c0c04324F60dB2783C4D6	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	ZOOD	ZOOD	1000000000000000000000000000	0x70d5b9f83f292fd5d2cb374e76e1a677ca2ac8ef1fc3679e86729b725686ad12	0xa72174d6d5d534ce3f401eafa4082f24cb27eaed6bb1938c497115de7c97bb83	83070372	2026-01-07 23:35:23	5	2026-01-07 23:35:24.652344
30	0x86eD235EA32bC8900E9081cA28142f5C1eFd343c	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	ZOOD	ZOOD	1000000000000000000000000000	0x8c6e4d451b9943e1b8edc7ba57f2472c54e2dd22b865bf4cf39206a171715ce4	0x5ff888e3b0740ebbbdd93685b38e11538d6fd6847a556e8f64ee60bcdaac07ff	83396110	2026-01-09 16:30:06	5	2026-01-09 17:02:41.543581
31	0x8780506a1Dc1a082f7aa0b4F9Dd17C873edDcC40	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	ZOOD	ZOOD	1000000000000000000000000000	0x1f047c97a48cd0d1ddf9b51e1755bacc803518db4acb378faba33211bf4363ac	0x72ceba703b21362dcfd9ac3346d586ccfe792e016f995b1fef82e3ad4c1ea3f4	83396300	2026-01-09 16:31:31	7	2026-01-09 17:02:44.886536
32	0xBbfa3b3DD93D93454fc68A768758C6cC8FC336e5	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	OKR	OKR	1000000000000000000000000000	0x591a57deebbbc0d797e05e092efd22ed98acb8698e6517eebf1cc3634e66fb40	0x401359b3c48824bf84ab9a4f9354b6baf72cc8a287acebfab17a49e0dbb5ccd6	83404834	2026-01-09 17:35:45	8	2026-01-09 17:35:47.63757
33	0x4e5Bf06a2474573220d43a3C94c788f6018d8E71	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	WPC	WPC	1000000000000000000000000000	0x4c6886aaf4ace5420e3a05df6e6920555b5ed1114b264b125ff72129bd3eb4bd	0x64ddd661847a4dcd97f794518a080070f4018fdf4fddfff9736dcdb82b62348c	83429967	2026-01-09 20:45:04	5	2026-01-09 20:45:06.546449
\.


--
-- Data for Name: token_creation_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_creation_requests (id, request_id, creator_address, name, symbol, description, logo, banner, total_supply, sale_amount, virtual_bnb_reserve, virtual_token_reserve, launch_mode, launch_time, creation_fee, nonce, salt, predicted_address, signature, encoded_data, initial_buy_percentage, margin_bnb, margin_time, vesting_allocations, website, twitter, telegram, discord, whitepaper, contact_email, contact_tg, tags, status, tx_hash, error_message, "timestamp", created_at, updated_at) FROM stdin;
1	0xa223b68f452759a7e601573d7fe0efb8b65b8618d63a5b0e90d8c07924ba2c20	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/48c55139-a276-4fb1-a9b3-0323ebab5d6e.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	1	0xc99ab6c152e3cb8124442db54e038d4da7b8080bf93a6034bfe2fbf47ac46350	0x5b7f3156d82f98a487a71f9df3f1b55bdc140534	0x4fec188e0189cfc76d33814c547d19f343747b15d7dee65d1e0ded540e83eea30adf529a3ea0a60538db6cadc15403f7d0bed72a4f722d7bf51377d24ee349041b	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cddb0a223b68f452759a7e601573d7fe0efb8b65b8618d63a5b0e90d8c07924ba2c20000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767693744	2026-01-06 18:02:24.033913	2026-01-06 18:02:24.033913
2	0x08e58a2ef3b67b8cb19df88f8bfe925ed79de1e4fff5dd04da17fa56e9353c5b	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/48c55139-a276-4fb1-a9b3-0323ebab5d6e.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	2	0xc1e4a1abdc5272f476d065b5a403d32ac840cd9eb2508178c1f2a08ce9fac36e	0x09427779f02fa482d43912afa71a89528f59334f	0x9469d03939894c3e14574ea5257a9f65df79a15fe7a1913a94923b20a1dc515c115acc6e4e73cb3fd333062055df72ec24c51ade71a68d44cb73374ce477d3841b	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cddbb08e58a2ef3b67b8cb19df88f8bfe925ed79de1e4fff5dd04da17fa56e9353c5b000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767693755	2026-01-06 18:02:35.072313	2026-01-06 18:02:35.072313
3	0xc977a97ee1ff01d59b24a46d219f834f574876d1d27fee3cd400d21f30f61640	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/2d3d330b-e51c-4e6b-9031-1afa4fbe23c4.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	3	0x0c3615a66f1424c040d948cb525cbdc47a0b098b8c2a4a6b2a5c398b4e308337	0x230732934ba09c41786f82c97b688e2feb9a8da2	0xaf17f5ff675cf1ad6f7e9dddedafc1fac6f6c3cd5c3ab1bfd6831af1ded2554341b8643aa369a8ae1a202665b174fd4f1b40642f56631de3c5dce5a223963a761c	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cdddfc977a97ee1ff01d59b24a46d219f834f574876d1d27fee3cd400d21f30f61640000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767693791	2026-01-06 18:03:11.666068	2026-01-06 18:03:11.666068
4	0x3319bcbbc749b86a47eea2515949ec21f5b907635c6a0d55c95f30529d0d5d3f	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/2d3d330b-e51c-4e6b-9031-1afa4fbe23c4.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	4	0xc56d53efb368e3b19037ebe53fcb9dd57359c57bb2796f431c3b919cfc9d5174	0x1dc8305993cfd040f693993c397153659b1a5e2e	0x56bfa113449f0b37e69dad7433060c980f997935dceaac0d3d365f5d3ae872c3762362c3de4962ad0ded77c4deb715628d020edce4cafae7d53bb975e9ad32761c	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cdef03319bcbbc749b86a47eea2515949ec21f5b907635c6a0d55c95f30529d0d5d3f000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767694064	2026-01-06 18:07:44.40965	2026-01-06 18:07:44.40965
5	0xe35e904c66b00b49bd094833e3c65aa03e21d6e4c5da0db812ab1115c105632b	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/2d3d330b-e51c-4e6b-9031-1afa4fbe23c4.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	5	0xef05957e8ebb9ef39e165e83fa9ef9200d406c4092be505552857ff388f1db6b	0x184a515b0f0986168107269797cf0b66177f25a6	0xf3475d670482917ea4d8e21ce0a45ced7923a0b00e18b27cfe0e85d2a5208046612da44373f077faccdd96e9cd133a482c0c925d2db3a00314f092acd501baf41c	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cdfc7e35e904c66b00b49bd094833e3c65aa03e21d6e4c5da0db812ab1115c105632b000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767694279	2026-01-06 18:11:19.8435	2026-01-06 18:11:19.8435
6	0x6093de0af4301d6240149bae8f2f846c1ccd4f6924aeb7b7d384d78805f79751	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/2d3d330b-e51c-4e6b-9031-1afa4fbe23c4.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	6	0xa7bed3f15613cc767ebcf4c2b2241f7430be08fe35fc1657b2128d5102be9a61	0x5f5d4765c2d020cfd21363051b3488cfd347a01a	0xbd1f5e5822fc437e2ecda1e12d447ea25094f0fc639b9c91163a984c1cf0a05876d148750a1ff41d82f56cba15e51a48e51a4dda4ffac8e52f3ef654f3a239c61c	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cdfce6093de0af4301d6240149bae8f2f846c1ccd4f6924aeb7b7d384d78805f79751000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767694286	2026-01-06 18:11:26.868675	2026-01-06 18:11:26.868675
7	0xc8fa6d08a867c9e637f51dce9d4ea3b1869d263fa92a4a4bf115ae40975b7e98	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/2d3d330b-e51c-4e6b-9031-1afa4fbe23c4.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	7	0xd128bf8b12f4ff933ffc6b3f1584ad5b6bda072c1f205ada817cb84f90681ed7	0x31f2a1027c014fd962fd47c96f3a817f7e788c7a	0xcbb80f03445f8d05f2393fd5712b1eee15e349e05e3085e21602ccd1633b0c053dd25547e0e7a3f0137bd483dc669f99139246be7cf9b7714ee0ed59ec4c89f91b	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cdfd4c8fa6d08a867c9e637f51dce9d4ea3b1869d263fa92a4a4bf115ae40975b7e98000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767694292	2026-01-06 18:11:32.834911	2026-01-06 18:11:32.834911
8	0x2f5760713cb7acb4ec5ece0c45998831ec401d491d5fc6af6b71a1a8deaafde5	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/2d3d330b-e51c-4e6b-9031-1afa4fbe23c4.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	8	0x6653bd15b56ffd10afca529a314f73e9da08af2c39c16d9f38b16769095d51cf	0xe431ab1653fbde71d50e8dcf4c3def79cb4b37d4	0x9f9674da673f3eaf41bd157f8ce1ce9553d2d99c859d543a596bf86ee91b57472d35d8b62846a2a5ceafd829a98904f3b85da7cf69b15f119ce497ed7a63be421c	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce0cb2f5760713cb7acb4ec5ece0c45998831ec401d491d5fc6af6b71a1a8deaafde5000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767694539	2026-01-06 18:15:39.768914	2026-01-06 18:15:39.768914
9	0x35bde1c1b535a393a69c77d18376226f00feba4de9db5cb701a6b016693ba19c	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC	WPC	http://upload.metanode.tech/token-logo/97/2d3d330b-e51c-4e6b-9031-1afa4fbe23c4.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	9	0x29288204151e02b672c38bcd5f71618b3ebee592f530c1303e7465f00364803b	0xcca8baaef0d72273751701c61ab5c2e27f0ccfc7	0x1291f66dbf9ea596dc1a567b8cec6808bdf65a93b31ca6f05f664e11e0dff69a75350eef39a726185c957d8994e8b5a568d873d0c56eb152be17e82432b53fc41c	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce0cd35bde1c1b535a393a69c77d18376226f00feba4de9db5cb701a6b016693ba19c000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,infra}	0	\N	\N	1767694541	2026-01-06 18:15:41.101574	2026-01-06 18:15:41.101574
10	0x791f7778640cab0dfa3c697946012383969552cc6924ad841f97ccd04cc319da	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	www	WWW	www	http://upload.metanode.tech/token-logo/97/5f4ce340-4e70-4126-9914-4e0871e33043.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	10	0xe4d9c0bb57b49025783bd52d1f73f7fe5440e9bd9049200391bc5f78743345a8	0x920f0faf8a9efc19ce59a9eeede7a4e5ac0169cb	0x9208696f2f2776defd016e437a316d6426211803f494b95d6af1499a807b9796080aad994f61a8fe44034cc7e5d724fa1f410d3ef8336bb5ad65dcf9d73916da1c	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce0e6791f7778640cab0dfa3c697946012383969552cc6924ad841f97ccd04cc319da000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000037777770000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357575700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{defi,meme}	0	\N	\N	1767694566	2026-01-06 18:16:06.851	2026-01-06 18:16:06.851
11	0xc428e562a0c21e7fde159e38ba5e149e6d53a4b692f07dd762bfa57437d6f95a	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	www	WWW	www	http://upload.metanode.tech/token-logo/97/5f4ce340-4e70-4126-9914-4e0871e33043.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	11	0xc3825941d96bdad5160e65e117e7740fa854f8d7fce555b7a27a2c2ba4b8802f	0x2e6eb2b49bbe069bfb91b4bd70273605c052592d	0xc32a6c88fa60de3ead9044c80453e6059d82cccb38b2b0ffe639a6d33af637ee7be0301c87f33feb31fd32a4a3f3856fb5d395047d37a596a9963c42beae6ca61b	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce0e8c428e562a0c21e7fde159e38ba5e149e6d53a4b692f07dd762bfa57437d6f95a000000000000000000000000000000000000000000000000000000000000000b00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000037777770000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357575700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{defi,meme}	0	\N	\N	1767694568	2026-01-06 18:16:08.609771	2026-01-06 18:16:08.609771
12	0x54891676e8ab27d0dc4dbe2791ea60137d8b51adb65270c07c017d2bb336ee7a	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/2235ba36-a7a6-4863-bbce-8e31f72f2809.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	12	0x735b83f164ac578577b16d2415d4b9087a2f9652b354b351ab4439dac513221b	0xac50dedb5eaf69b4c182c29d55a0a478eac08dc7	0xff77781d54898b40959fef24b15a18041971aaf3604bfa5b3f10145ae4b48d465a26000483da5010a56123773c9f577abea1637ae8c8dcfb26e99bd06a236c1b1c	0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce1b954891676e8ab27d0dc4dbe2791ea60137d8b51adb65270c07c017d2bb336ee7a000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767694777	2026-01-06 18:19:37.112184	2026-01-06 18:19:37.112184
13	0x765f7380ab9f6dc520f8a35ec6f72da845382a5073b1ef763913574663f6a15e	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/2235ba36-a7a6-4863-bbce-8e31f72f2809.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	16	0xdaf8ddbbfde39aad5d4ea0599279face022b020516cb82c75c295aacbe004540	0xf8b6e23c0efd1ed52730ea05c61587f4c1ec0fda	0x53a147ffa2084effc015571d7deba871ac1a41c3c93bd1f4a3a319e33d62a1b53bbafc118af3c7bf807d1fa8d5e6357029bd4275e6de1c9879fcd343dca3d6a51b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce325765f7380ab9f6dc520f8a35ec6f72da845382a5073b1ef763913574663f6a15e000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767695141	2026-01-06 18:25:41.957055	2026-01-06 18:25:41.957055
14	0x7a79bd68717955cde80b98d4bae5e00cd796f43a25da4ed48c7afc4b17d286be	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/2235ba36-a7a6-4863-bbce-8e31f72f2809.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	17	0x2891ad4042857ee4084b50b68d610c2aee0413995fe5c9f7eacae2cb66ffd674	0x95e80d8848a621b841c1667803aa5f88293c9d3b	0x8cabbd84ce9763898dbaf1d37cc4e949944e2a1b7be0fddb4caad0cd10093f3c10e24f2d4b45e6d9bdc7004f376993f929d296b71be78c37267eaa493685d1df1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce36b7a79bd68717955cde80b98d4bae5e00cd796f43a25da4ed48c7afc4b17d286be000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767695211	2026-01-06 18:26:51.14734	2026-01-06 18:26:51.14734
15	0xe66fb66d1a8edb1471d0d1f7a8dcf44e308d9a8ede1fda1eed8b6d698a9317c2	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/6e7c038c-41a6-4abc-8177-058543a7fcf8.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	18	0xbde1518aadb90b7cf9a47a51d81b2145bad9c223bd3a04caeea16bcd088774ea	0x7200dd47cf4add5059b022ef63e20a1c3b3ad4e5	0x115760afc3f23857e9ea4d5d31f94c2c1a7124ef163d573eb5ced1d4b02df3c17cb15d9c54232a8ad34b23438a8550af87af56eb42aa36a011152ea6281c1a611c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce3a1e66fb66d1a8edb1471d0d1f7a8dcf44e308d9a8ede1fda1eed8b6d698a9317c2000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767695265	2026-01-06 18:27:45.807431	2026-01-06 18:27:45.807431
16	0x9ad0c31c8af665164e298d1ff3f4fab92381c0857192c35cf6486e4ae817eace	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/6e7c038c-41a6-4abc-8177-058543a7fcf8.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	19	0x59b47bcb5dc6409c796f5ca7ae0184e704cbb54ac1b7cfa6990ba12eb78b32fd	0x88dfabe4ef6fe560fa4f82319bd7f197cb542041	0x226a8133759b1e374d9cc121fa4b3b8ae16ce826b5ce26bee71ad7e6762cede0126faf869c7e3291e6d6c17350b7c5080e1fe0590fad600cd4fb71410051e00c01	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce4c09ad0c31c8af665164e298d1ff3f4fab92381c0857192c35cf6486e4ae817eace000000000000000000000000000000000000000000000000000000000000001300000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767695552	2026-01-06 18:32:32.695342	2026-01-06 18:32:32.695342
17	0xca402a16a43467b9536138411554b27077aac0ebf8c8f2595b609c71c4643fb2	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/6e7c038c-41a6-4abc-8177-058543a7fcf8.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	20	0x7f5c067902646923c7d26376b7de7be5e1ebf807cddb2f35f08a68cf0bd56bc8	0x3117b1750ead79cbd5002721e3e64bcc919942f8	0xafe75c5ea33db54fcd9a07c06f8d26cdb40713702b60833cf8367414dd7360b5278a9c9733925d503d99fb43693ed83b6c08ec55f66eaa618cff0c66cea3b06000	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695ce4c5ca402a16a43467b9536138411554b27077aac0ebf8c8f2595b609c71c4643fb2000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767695557	2026-01-06 18:32:37.120404	2026-01-06 18:32:37.120404
18	0xf1dc4b74cd1bf8a2279b351cec4b211a9d54dbc084ecd5bb6a9138a285220eb7	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/6e7c038c-41a6-4abc-8177-058543a7fcf8.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	21	0x4e2b359dcda03afe1ace0aa1a3858cd1b54de8690e8bc6bf664ab80993b0fd42	0xdd18bde10e8c85056237948cdf6d802619029224	0xcedc55064e0afd427bd72976722644969884bb71ba5fb7675281351d1162bb3c66c58719797e2c84b0a740bcf2d6cbeb0e20add43f50bc786006c3c4ae8d2d9500	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cf525f1dc4b74cd1bf8a2279b351cec4b211a9d54dbc084ecd5bb6a9138a285220eb7000000000000000000000000000000000000000000000000000000000000001500000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767699749	2026-01-06 19:42:29.680602	2026-01-06 19:42:29.680602
19	0x9b4eb814ae20419cbfaa473d245de7b4bb79b084340c7921a95bb01b8a3f5275	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/6e7c038c-41a6-4abc-8177-058543a7fcf8.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	22	0x0abbc216c9fbaf945847ce381680f798da4ac0799732779cf070c6b7e9ee431d	0xaa262bdb2d1949213426031b309bac4754668a7c	0xfed355ea1bfae72691ac512f9fdf3a12f2cdbfe48b86a49685fc22cf8797c79d4ea30d5764e5db98cd1b1c4008b762dde85bb0a3860114418407c95f13ae114401	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695cf52a9b4eb814ae20419cbfaa473d245de7b4bb79b084340c7921a95bb01b8a3f5275000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767699754	2026-01-06 19:42:34.925174	2026-01-06 19:42:34.925174
20	0xb516ff4ee266c4d7ac9284d37a41ac78bdcd216de2708931bf479854958ef89d	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	23	0xf491cec63b7946c5335c0ca6327ccbf85f26f0210ea05caab657f5192c901e00	0xf32b31d651ad41592675f037301b4c6402b227a0	0x87dad477b4888d2805acc4cca070d6f7411c48123c71caa5a5f74d7c2a7625d525c625480aa81d62d6934e271c2bc7076cede7ae42f5dbc2dd60e4908a1f632f01	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d332bb516ff4ee266c4d7ac9284d37a41ac78bdcd216de2708931bf479854958ef89d000000000000000000000000000000000000000000000000000000000000001700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715627	2026-01-07 00:07:07.876824	2026-01-07 00:07:07.876824
21	0x7cd8baf9d4863eb8962433943fc89867af92b4552fdc83b9addfe5c67c0178ce	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	24	0xa092d72245a9898a74371dc62beb52907cd8685dc239bdf83a3b6452b783c1a1	0x3e8a17e5daac22a70c19c18f7fee7a948b12bb9f	0xaa91107eadb9e07152dabecd9dfc328807fac6533caa32ccfcdcdebe6d53fce15d42e470607411968c1b900faa3dd76f71e035625e0cd1526145c52afa8ed99c00	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d332d7cd8baf9d4863eb8962433943fc89867af92b4552fdc83b9addfe5c67c0178ce000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715629	2026-01-07 00:07:09.594217	2026-01-07 00:07:09.594217
22	0x8853c0130d4c0825c67ec6c6f932895f31110d2aaf8af58e9ad2dd945cbbe5e8	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	25	0x3b74f4925e16e17ceae6b644c32ea9b9a5ddcc4961f1b4b9427ba59bc269f443	0x4eb83ea85797ebb6d104115f9ee7a6f3e4fcf232	0x4338ffe70282aa111a8466c40f8641e173ca81a48c4583c7cee772d5872e8e1f35b1980be7798eb6303abc64b812db5ca1b642929e9a89b8527fa62022a387e801	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d332e8853c0130d4c0825c67ec6c6f932895f31110d2aaf8af58e9ad2dd945cbbe5e8000000000000000000000000000000000000000000000000000000000000001900000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715630	2026-01-07 00:07:10.683339	2026-01-07 00:07:10.683339
23	0x0a3d317219c429464fbf56569b26c74039ac68086e2e533c4809114c6840d66a	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	26	0x50b5c8c000afe499aad6007b5799946a032dd0894bafca7eab71cf10833c5eed	0x46c53e849e2ca3a5e74b53eda61c644870205f3a	0xddd3945b81548ff621f749726b2075b88d5c83ac25701dfebb35b2c78360cca2150d71ffbb76a84846767415976fb9c9dc1c9f76579e76114dc7fc8216aadd7a00	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d332f0a3d317219c429464fbf56569b26c74039ac68086e2e533c4809114c6840d66a000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715631	2026-01-07 00:07:11.263446	2026-01-07 00:07:11.263446
24	0xaff8769b23edabf45920883a2f3f88827b89df4423a554d3bd9bfb671ed32221	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	27	0x638e90b376a90d3605d279c157eace3984e0132f1afc7f930436a857c0902132	0x2ef552fe9b19933676c10821bd11268ac27d3391	0x3a699d5c439a3cd8aad21c956c5784235f1ab37f7cd30530f4bca575d056c5f51648961dc4f9906e775f6ac4359324b1c8b5fd2dae0617bda46875fc869bc51701	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3336aff8769b23edabf45920883a2f3f88827b89df4423a554d3bd9bfb671ed32221000000000000000000000000000000000000000000000000000000000000001b00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715638	2026-01-07 00:07:18.768035	2026-01-07 00:07:18.768035
25	0xda1e352859bbfa909def40d82f5d48c65d5c977f35f48c94b5681946657d867a	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	28	0xd3f696f79275feecb51ab57b6c38a39092c68ba469e957e65964f7988fac2903	0xbd47cc52b0aa6b3590d6294b73ea5ef35702e50d	0x4e8cedaf5705530df99ebf60aafc306a86b56eec85e7743f10006afbfd1d9334321c3ae56ed77e221fe37f87142b92cd511c16ce6dcef9ffbbc59a71cd3f249101	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3337da1e352859bbfa909def40d82f5d48c65d5c977f35f48c94b5681946657d867a000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715639	2026-01-07 00:07:19.752718	2026-01-07 00:07:19.752718
26	0xbf65f4fb73c3def7c66d9434724bcff5dd5493d9074b1942b012aa2cce4d6c2d	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	29	0xb9fb9c8d586e405b1d5098db67884144b656cb37e0097f0275825c4d36e2a90e	0x6673a28dbccc915f33887ebd311eff116019add2	0x0512cb13e1b12d231609db05de32533074c501dba24c2cfbd842e1712fc07c2962f05421f4576627ac27940a874b82b785838c369524ebe6026ad0c5cf21e66200	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3366bf65f4fb73c3def7c66d9434724bcff5dd5493d9074b1942b012aa2cce4d6c2d000000000000000000000000000000000000000000000000000000000000001d00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715686	2026-01-07 00:08:06.774511	2026-01-07 00:08:06.774511
27	0xd824f2f72fd0950dfb0f4e9267a10294baf6b49d440b9e87e53a649a4fd4e5d0	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	30	0xa0118df3432448e548c1483aa35655801b9969fca30f5fa5a0e3f4ebbeb8ad8c	0x2dd24f529bd4c5b94a2aea4b4e842ae7becb98fc	0x23b636d798366b29f9ecf4ab3b2f803cf5f72cac48f88234d3ae5dcec5b78def2b4685403114ad507bc6ac213482560500226676cb3287f30fba5e92105e379b01	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3367d824f2f72fd0950dfb0f4e9267a10294baf6b49d440b9e87e53a649a4fd4e5d0000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715687	2026-01-07 00:08:07.902694	2026-01-07 00:08:07.902694
28	0xf797a900ecb88beb0ced03624a05bf6c4b0c1e51528526c664d1818e5507826e	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	31	0x91bb6a52a93a5f72cdb619243687bb59b9f15570ef81b339a490bdf104e9f0b9	0x03fc9b6be5f1c01e73af92f0b0cfb1d3860b6d0c	0x31f1e933019918173eb388207dadea712090aa0f065d1fbc4a181e2eebb7eb61187f40ea864f21afe62173ce733a34f5b2343c1f395f173d92ca512aeae6d0cf01	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d336ef797a900ecb88beb0ced03624a05bf6c4b0c1e51528526c664d1818e5507826e000000000000000000000000000000000000000000000000000000000000001f00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715694	2026-01-07 00:08:14.582371	2026-01-07 00:08:14.582371
29	0x55ea9327e3cea238d39decf20f7c7b416f62bd7537a76ce3282e858f8785e3d7	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	32	0xe1bfb37abb694d1c22ef980502d8060b92c38feacd24b381404ec24f96dddf5a	0x23237df53553929532f83eddafe49e38aa904ff5	0xe167e4044fc2577520094dc50a3e97f1b662f8192654cfba089fc2a69b4c1bd0538c19abfe2ffc35b852646df84360dadd860b321b91b658aaada4381d52ee031b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d342755ea9327e3cea238d39decf20f7c7b416f62bd7537a76ce3282e858f8785e3d7000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715879	2026-01-07 00:11:19.339217	2026-01-07 00:11:19.339217
30	0x166f1784dcb7aade261431907a7b18dae4eef7afb9a115db1f63b51025f2c9fb	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD	ZOOD	http://upload.metanode.tech/token-logo/97/6373d096-b3d5-4abb-a91b-f3c543bf39f0.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	33	0x6a0a01c4ffed479e49cdfc722fd946eff61ded9ac865eb8f26d724d5a73049b2	0x709ca9e734c952c30b26170edb175a6616471200	0xc11182503b2176e9112b3122328bbf81a5197743f2a0efc0b391498c7f357a0f6047b1819caf45114c4e108805ba308c2119bc434d9af377fe713b0b84661d541c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d342b166f1784dcb7aade261431907a7b18dae4eef7afb9a115db1f63b51025f2c9fb000000000000000000000000000000000000000000000000000000000000002100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767715883	2026-01-07 00:11:23.911602	2026-01-07 00:11:23.911602
31	0x957af6d0f4e2184b445de843ffd93c41f2f3c54dc7196ef6345fe31d887716eb	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/10c2f74a-7cdb-4936-95c3-74b614c1efb2.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	34	0x6ab937cbbd9cd383a1c38834c86d023af9af84e6f1270703e699cd6d1e145e05	0x38d3a0688fb42644dddea7790b18ca6130cc57d8	0x77c0914f73628e66350cd2d19b30620fe5b13b47103f67e79573096450ae7d4d017f466e5f132d6c9d2aa19a580ef09f49a007bd525caa565cb5d6ca2aab415f1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d351f957af6d0f4e2184b445de843ffd93c41f2f3c54dc7196ef6345fe31d887716eb000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,ai,defi}	0	\N	\N	1767716127	2026-01-07 00:15:27.322953	2026-01-07 00:15:27.322953
32	0x4c811a9b4ecee0899d507f75495b3e535945967eb167d9f39a345b7d67ae0637	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/33abb4c3-32c6-482b-8a9e-5b7c95a4f060.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	35	0x5dbf90769fd2e31744f32db89b4ff6f10433c4e4d0b8e794df1343bdb1f8a5c8	0x4dc69a707e79611c217e9e9517e9e2f372d341c8	0xdc0599cd002a4d42651d7e5640dea3bed33e89544fce8b19db6c0f39c02bfc217fefd9856d896fb0ea4f2e8b3b475d22829c44c19bd2181553d336aacc26733c1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d35ec4c811a9b4ecee0899d507f75495b3e535945967eb167d9f39a345b7d67ae0637000000000000000000000000000000000000000000000000000000000000002300000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767716332	2026-01-07 00:18:52.900027	2026-01-07 00:18:52.900027
33	0x55abccbb27c19814f077ba1827a238bdb5d9ae38b6b595e6700857ec9417add2	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/33abb4c3-32c6-482b-8a9e-5b7c95a4f060.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	36	0x75f0f4ecffb0dc39d5faf80da87edc5686fabf6a8bb07ebb692f253c6bae1fbf	0x4f5ce460da9a35f9d28d983a3f038e084588c2b0	0x7890514f8add3b61b2beaf2cc044a9393b64f8da3282ac1899fa48b9acae00b6602846217b925821700563eefd6ca29ef3b450f2b8875ee63bb9c28e904d1ab41b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d35fb55abccbb27c19814f077ba1827a238bdb5d9ae38b6b595e6700857ec9417add2000000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767716347	2026-01-07 00:19:07.420628	2026-01-07 00:19:07.420628
34	0xbb735eb9c48ed905ef5945a8cbed3035cab72a28203bbf75a43a731ea77bf75e	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/33abb4c3-32c6-482b-8a9e-5b7c95a4f060.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	37	0x6f537e89c7f92d7bb79035e744baac827b24c3cf5d1d76aa6fc2bfc85a4cd866	0x4ab8311816ec8f38812141168d0c5b10e34aac8d	0xf6e1c4d4f551fbbdbbf133cd66546cef59f9ecaa2be541624bd73ccf8a5efc5d1c9b90d442fa885a9a82ae2df9c8adeb38a79043d8f475dd4eafd6b743d371f11c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3600bb735eb9c48ed905ef5945a8cbed3035cab72a28203bbf75a43a731ea77bf75e000000000000000000000000000000000000000000000000000000000000002500000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767716352	2026-01-07 00:19:12.677353	2026-01-07 00:19:12.677353
35	0xac420a7589a06a90ad14c5229bf9271da519c9c7fcdb5ef9ff65e762698e155a	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/33abb4c3-32c6-482b-8a9e-5b7c95a4f060.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	38	0x01416b5d51dca8d6a4ac1d82b57282dfdb566bc16dbc3c73f16d9d5c8e99e8f3	0xa7394d4b3808937c2c420911919c2d4865ab7f15	0x2a88459d62d89b14ba9ed009a74a8218b6eb19209100d08376e309f60cc8643f0c5c0412520fe7ffd530397493140de754d90ea3dbe23269aef16e0959ac70831c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3605ac420a7589a06a90ad14c5229bf9271da519c9c7fcdb5ef9ff65e762698e155a000000000000000000000000000000000000000000000000000000000000002600000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767716357	2026-01-07 00:19:17.798221	2026-01-07 00:19:17.798221
36	0xce4770abd10d7cdafdd98302c62c7bed128ddcf3d531c5fb70102b8e3e91dd60	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/33abb4c3-32c6-482b-8a9e-5b7c95a4f060.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	39	0xb0aaa73a6372460ae2b50333454da5ae9ea7770d0e556e8451144661ecb48bf8	0x0d2cfeb8db8b68ed6df7dc9badba6d3a13d6349c	0x5334a4067e90ae8afc395e7628b9a378157366480193aa3451d10e6d47650276069b3200ec9d716e1d0c0d7f1fa9875b5dc9762b01a1c692f2795e15115bd6b31b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d366bce4770abd10d7cdafdd98302c62c7bed128ddcf3d531c5fb70102b8e3e91dd60000000000000000000000000000000000000000000000000000000000000002700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767716459	2026-01-07 00:20:59.367761	2026-01-07 00:20:59.367761
37	0xa7d86f654f6331a551cacd9897f3ed1d32d678bbb0b428452c2ba0406ccde97e	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/33abb4c3-32c6-482b-8a9e-5b7c95a4f060.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	40	0x95bf11daca885fb8508b510e9747e76883cb01020d121866f8b8fe7fc246b38f	0xf98ed9caad6f6281b7a4da82207a83e38d804d1b	0x89d9b9cfc82262ee40a37baa9dfcfc7f84ade1d7488d03fbc9a01a71a989bb2748a5c5ecedf5333471911f92114432c97c5fb6f31a426f82afce6079452978fd1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d366fa7d86f654f6331a551cacd9897f3ed1d32d678bbb0b428452c2ba0406ccde97e000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767716463	2026-01-07 00:21:03.219293	2026-01-07 00:21:03.219293
38	0xcbf1a60cd36727a7ee8cc4ebfeb200773a0ef929a7df4d31b74a7ff577f587a6	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/33abb4c3-32c6-482b-8a9e-5b7c95a4f060.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	41	0xbeef2b26612b37a6e265c0ce9b417b80884b57326e6a68721970fa1cb1efc8f9	0xcbfa403d522d212410cde94881ca9e7f986aea86	0x9279eab59663a386608d4bb1a10998cdb16c3d9dfbd6f13b6c76ed56ed1584034dd865a6f7f3604fedc41aef2df966e6290116a13d7bb73c58e494423dabb5781b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d36b3cbf1a60cd36727a7ee8cc4ebfeb200773a0ef929a7df4d31b74a7ff577f587a6000000000000000000000000000000000000000000000000000000000000002900000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,defi,ai}	0	\N	\N	1767716531	2026-01-07 00:22:11.294435	2026-01-07 00:22:11.294435
39	0x00bdb6308bd75a94f93209d2b3f2d926083ffc2f9b3be5044a952fc00b160d24	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/a84de691-bf29-4b3b-9bb0-af1d5d2b6b3d.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	42	0x6f4e6274ce6f7266f68fb7f93d895924597cbc466417d807a1db96659fd0c0d1	0xbb05c8c903092d7ab20231527d3f9caf0ac27a52	0x0aa03af491223ecc4320f34074a35080988341de69649d171512cc85e2bcbc6b1394767657fec8c8f42d1052f8c290d8aff0ee02f2eaddc78bb3d8f2cbdd1d391c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d37e500bdb6308bd75a94f93209d2b3f2d926083ffc2f9b3be5044a952fc00b160d24000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,ai,social}	0	\N	\N	1767716837	2026-01-07 00:27:17.933215	2026-01-07 00:27:17.933215
40	0x0a5983fe30a67c516a4ee940c168c32bf18a90c3bc3ff92de3b3e810b94db544	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/a84de691-bf29-4b3b-9bb0-af1d5d2b6b3d.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	43	0x04c4ec2e3f8335f148ed104b7410cc464dbff31c6cf83a9e9c2d347506915923	0xb749a15cd6f09b45444d24e18bc4a4a63ae40b2e	0x6bdab288e2ab8541aba683a3f35eedadf359d45b238906cb2d3506a42cfd02c87737af57c9e491e9391cf017f2d0d33d51d0edce1ccde029f7515a8d881b262a1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d380e0a5983fe30a67c516a4ee940c168c32bf18a90c3bc3ff92de3b3e810b94db544000000000000000000000000000000000000000000000000000000000000002b00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,ai,social}	0	\N	\N	1767716878	2026-01-07 00:27:58.477566	2026-01-07 00:27:58.477566
41	0x7641867af96a736449fa0f3e2cddcf02c41542448175359f91c68b354d7f5ff5	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/8abb7143-c978-4f52-8491-a8ae0bf750d3.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	44	0x874e4d84d2a2ded2ef075f0ab48db6ca31f9891acf18db5c3c491dfaaa9b66d1	0x6493c5688d3fe861b2d44a22a18df13e4b754c18	0xf830ec39f4c8eb5feca14e4e02d68a9e4853c4b89986fb845a60c606354af9aa01aa2d51ec94d82af13bb20c02102a5169e0eff826817379e3c967b78874d8c11b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d38d57641867af96a736449fa0f3e2cddcf02c41542448175359f91c68b354d7f5ff5000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{ai,meme,social}	0	\N	\N	1767717077	2026-01-07 00:31:17.057695	2026-01-07 00:31:17.057695
42	0xa13505feba7806fabf3a0a9460d78d4dcc80dc265c015a78a4c250881999d332	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/ba37c1c1-b5f8-4009-9129-b028d26253a3.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	45	0x6cedfcc5c9f4db18c6a5efd8e8df6f8c67647f0d274ba91c2627e268fc3f1b3a	0x5a6b08e4b6cf8a10408df7ba5e55694a02e78683	0xc6dbf3bfcc5506f8e31e132359d822720fcaa6d740567c70370f1327617fc16e6786e1298b732950c07826088f89d8b8c20483989cf9779c7a23e86a177561dd1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d39b1a13505feba7806fabf3a0a9460d78d4dcc80dc265c015a78a4c250881999d332000000000000000000000000000000000000000000000000000000000000002d00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,ai,social}	0	\N	\N	1767717297	2026-01-07 00:34:57.806449	2026-01-07 00:34:57.806449
43	0xe9e22c397b8bb57a9a065d6903a7fd1d29d93c39eae4bf48a0919c3053f27233	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/ba37c1c1-b5f8-4009-9129-b028d26253a3.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	46	0x022171dfd15ed28bc2596819b057d96f51d98c3d6cbf0328e02bf944d7d10b89	0x583dcb48c963723e0180d4115971b8c089ae510f	0x93e7f97464b57e9bd820300739c933971fa3d550cb888e9b64e403693112981f36eee30e119d46263817ba774845aa6bfcbc93a1886f1f9a9d61b6b902c606491c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d39b8e9e22c397b8bb57a9a065d6903a7fd1d29d93c39eae4bf48a0919c3053f27233000000000000000000000000000000000000000000000000000000000000002e00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,ai,social}	0	\N	\N	1767717304	2026-01-07 00:35:04.148983	2026-01-07 00:35:04.148983
44	0x1829ab8b4c9ad679f8cfab42710cc352e133504ba43d822e0dd4e4b0e807d0b0	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/e8220218-e9b5-4b7f-a556-eae6e79025eb.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	47	0xf63950ebb79a868708eda0bddf80fc0034ab7ca3f9113a37a358bc99cec697ac	0x5eb0316d8800eb4306cd6848b86e66d0a3fb7f96	0x803b1e967f49000b52538d4fd265ff9e05c97ce4bbe527fd5f014c5453362e1e7b02d2a315a65aea85106a128f43fd1281197844642ff94bcdc4b86ea1e9f4fc1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3a8e1829ab8b4c9ad679f8cfab42710cc352e133504ba43d822e0dd4e4b0e807d0b0000000000000000000000000000000000000000000000000000000000000002f00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{ai,social,meme}	0	\N	\N	1767717518	2026-01-07 00:38:38.288114	2026-01-07 00:38:38.288114
45	0xf004aa1a07b2035f0dcf338a6f6994e151863d4f41ed053416eca5707fb88942	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/2cb8fabd-f9e5-468c-9e08-3f9a09dede52.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	48	0xbc3086bbd6bc975f0fd507673d019eedeba59e6f39cf0426221814dda66fa278	0xd482591c0fb5fa51eea1a12530e45929a4c2dd1b	0x06dbcf347182922b3a8f990b1414806c77669df32319de8bdd4d1e4e8fbf0d2d42d7964ccdb056c910ccbe220e215dd286a59b7ba9d38a4c372526a6323bcea11b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3b33f004aa1a07b2035f0dcf338a6f6994e151863d4f41ed053416eca5707fb88942000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,ai,social}	0	\N	\N	1767717683	2026-01-07 00:41:23.851652	2026-01-07 00:41:23.851652
46	0x2e9ad6e55974f2153d4a1be59848af62c0cb24a775a0b34cc1b13c93e8262664	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/2cb8fabd-f9e5-468c-9e08-3f9a09dede52.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	49	0x5a71b4cac49dec719667b2109dfb0426ede8af8425478e164214653fbf050159	0x16a711f8bf38804bef26623b67f61133c3d1e18c	0xd790042a63ff288c29c345d2edd96132a78c67da3841528bfbb9b822d8347de511ed37642e391c60c0a8c34c1b42bd69b3e10531dcf0576d0e18df8e8bb2173b1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3b962e9ad6e55974f2153d4a1be59848af62c0cb24a775a0b34cc1b13c93e8262664000000000000000000000000000000000000000000000000000000000000003100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,ai,social}	0	\N	\N	1767717782	2026-01-07 00:43:02.362663	2026-01-07 00:43:02.362663
47	0x8e280f9f332459efde0f83fefb50a001c875d470e168791b23c8df6a2712e09d	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/001f5ee1-9992-4f66-babb-f4fa6535dc5b.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	50	0x3932a7c9feb43618660950e9538cd1538356d1651c1d96e5728439d7f004a674	0xbc5475f816e2febb976cd7a37c124e12763facc6	0xbc17ef41308372fe08f1d6acbdf2dfeb0f67920929b34c9267194e3b667e806b2143411a52ed1d3e85253e22896a2bfaf7d3f4b2f7b1d6c193b5a1abee7b6db81b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3ca68e280f9f332459efde0f83fefb50a001c875d470e168791b23c8df6a2712e09d000000000000000000000000000000000000000000000000000000000000003200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{ai,meme,social}	0	\N	\N	1767718054	2026-01-07 00:47:34.316767	2026-01-07 00:47:34.316767
48	0x34d7591cb3a61e761e5fc9d0cbdb801fdda90ab23a4235a907b71188883672a7	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/2c3ee7aa-ed8c-4a60-ac47-f509289921a9.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	51	0xf3dd6c486ce082ff806ae02a94a77c68d88c0fa6d2e4ae42be46a51cb50284e6	0x7dff48ccab0e92c84e46310ff3e0c8809799bfa5	0x06138867e00693b58a75d94df19946bc528867c130e755c802514b23a3ce9a661c82d93b462c61b346a08da57bf21dfc6b648a544527d2f9a42b839d4a55ecc31c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3d5734d7591cb3a61e761e5fc9d0cbdb801fdda90ab23a4235a907b71188883672a7000000000000000000000000000000000000000000000000000000000000003300000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{ai,social,meme}	0	\N	\N	1767718231	2026-01-07 00:50:31.800159	2026-01-07 00:50:31.800159
49	0xb1b58c2bad2c12c02179f766520c10d0de20c307ba1626b74cb4f9f0458a467b	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/866da92f-508a-4ce2-a508-2d4a69c61d20.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	52	0x1ab1a00bd42eb4e0a5875b4af99d71cffa4c7db3b49218a7df90673cd3829379	0xac2a0e4b78776e73165de3e3a732c39e96b266a5	0xb8d66daf3704a5317edade2a29d3bd37abae317d30a3f1ba70e4aafc8b7a35e86d9481948e8e4b90545a13b8fa2de5f48e2a1fa67c880f167dcbc8dedd980c391c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3e96b1b58c2bad2c12c02179f766520c10d0de20c307ba1626b74cb4f9f0458a467b000000000000000000000000000000000000000000000000000000000000003400000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social,depin}	0	\N	\N	1767718550	2026-01-07 00:55:50.729226	2026-01-07 00:55:50.729226
50	0xa6014ebe8ffb5700bdeace1657d06aca65c1f98870cb761265e4cd1539cb1cba	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/866da92f-508a-4ce2-a508-2d4a69c61d20.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	53	0xd6b02b629eb8fbb141fc18bad73a187a03165357e159551bc34f0b515c6edd2c	0x1ba081d986aed3a063cffe38c270552b56f3f8f8	0x7d9a5dbbdd876e7fa0200b6136aa07119473a41f8e7e3803429b3c9541611d6c31076ee254060a2cda9837030d1d977816c1a1dec3a4b16fd4ca1a1607749a001b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3eaca6014ebe8ffb5700bdeace1657d06aca65c1f98870cb761265e4cd1539cb1cba000000000000000000000000000000000000000000000000000000000000003500000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social,depin}	0	\N	\N	1767718572	2026-01-07 00:56:12.576512	2026-01-07 00:56:12.576512
51	0x73fe7cd74dd6cde94b53186231151d8bdbc2692398bf9c93e94c70864289d5d6	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/866da92f-508a-4ce2-a508-2d4a69c61d20.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	54	0x908fbe231373c96b7f9bae9c35f4f6d8c04fc8ed296c0b755410444921236525	0xfbfab2d4f97a275bc5a0483e02868b9ed48474cf	0xc02c05be68fcf3aedebbfe613ba01bf053412a3f90f653045c4629c6ff3f2b831d175951eda2d08e93eabdac5729897317f316c82770291cb6b63df11546d4ca1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3ec773fe7cd74dd6cde94b53186231151d8bdbc2692398bf9c93e94c70864289d5d6000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social,depin}	0	\N	\N	1767718599	2026-01-07 00:56:39.259079	2026-01-07 00:56:39.259079
52	0x4babe23afb03f1a796f0ab3d5b60e04b48eadad35c6a1a09cf73f26738e12f50	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/bca3f212-616b-40e1-87fb-df99edef42b4.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	55	0x2cece6e31ad1564d3ea6262259e2cc85c54d734d96dcd32452f6c03909d7aacc	0x50685d89dc323c3706ed1670bdc35711776a39a7	0xb92a2844d609eef2347de0abea907fbb985084efe8246e8ea596da040bf47347735f6a39bbf47c43f7d459938f8a2730f305998725f22ac66c9894ccd62748921b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d3fc64babe23afb03f1a796f0ab3d5b60e04b48eadad35c6a1a09cf73f26738e12f50000000000000000000000000000000000000000000000000000000000000003700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social,ai}	0	\N	\N	1767718854	2026-01-07 01:00:54.69139	2026-01-07 01:00:54.69139
53	0x552898d946d4ced3ada96d06e77e7929d49899bf959d7fa9fa1ddd5fbac995a6	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/c0abcac7-133f-4cdb-a982-be8f465c0d83.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	56	0xf37bf687f0a6429a28f2496f85d64e1d14befae908a81d727e66e1d3391686d3	0x1e1eacd6affc57bf6fa7c8cb7467ca16134cbdc8	0x2892eb5a55bf1f2279bceadc397c784e6a973ae9401a1a05f5f681bbf79e6ed12d2abc4997f32e08ee547d00c754ca289f1f41ef522974d2e1778ea0509fff5b1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d40ae552898d946d4ced3ada96d06e77e7929d49899bf959d7fa9fa1ddd5fbac995a6000000000000000000000000000000000000000000000000000000000000003800000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767719086	2026-01-07 01:04:46.569299	2026-01-07 01:04:46.569299
54	0xbe80a3948107f757982b84d93c5dd799c5f1a03e1b28f90398e471006d0b077b	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/37dade7f-940b-4c92-9b53-98c5a9a17e16.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	57	0x501a45289c70ffbbccad9307f50fa1d6948239f5b91160cfb1e2e1539215d8e6	0xee337855ded4f35a996cc5b958ef1acf3844ed4d	0x0e285279391ae931c8730079ed6ee2c92ee5be38b87ed828edef398924fde8b138ca31822c421d37f620276517861a78f4ba748fa3a367f19d364cc6eb0967f21b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d4214be80a3948107f757982b84d93c5dd799c5f1a03e1b28f90398e471006d0b077b000000000000000000000000000000000000000000000000000000000000003900000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767719444	2026-01-07 01:10:44.438165	2026-01-07 01:10:44.438165
55	0x4c01a0b6e13a9798e5cca489b86467fd79299e58a12f4771b31d4d6f34f0c529	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/4bf20b18-745e-42b4-91ba-84953c94b9fb.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	58	0x0855f808eef451e6adbaa67e18dbb009b09652d5128d9f24d5a8b6ffcaa00623	0xc77a2f3efc5f51d8922e6c394eaae7703cfd6bb1	0x032f9593feab29bbdc10df969409063714f4c5e5cc6eccbdd21055123b33d1a43e8a5ce415cd504c97d3bb5baa7104bdddf156df76e99de894a10ac02450675c1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d44914c01a0b6e13a9798e5cca489b86467fd79299e58a12f4771b31d4d6f34f0c529000000000000000000000000000000000000000000000000000000000000003a00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767720081	2026-01-07 01:21:21.885251	2026-01-07 01:21:21.885251
56	0xff18a28cd8e52859552e00c2d16adbdb77cd9316f86c5e49052bb4cb8ca84226	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/eebe1432-b53e-4df6-a93f-44a603d4fbed.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	59	0x1abb9567bdde4ab827d2b91aff0bd8b773a7c95c692dedc6bb7a7a20df9e1a61	0xbacc271562a0d6dce22342582f3eca0438eb6e1c	0xeb4b4568feaf902969ec6984b630b9601f22099fc4fe907d39c0fddfb0f2c5e52d76941f39fcda3fd629f65e452c0a05e1b3f8bbc1b7cd0cc81213766a2a82261b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d461aff18a28cd8e52859552e00c2d16adbdb77cd9316f86c5e49052bb4cb8ca84226000000000000000000000000000000000000000000000000000000000000003b00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767720474	2026-01-07 01:27:54.891918	2026-01-07 01:27:54.891918
57	0x0094d9769ba2861e4640fac6f9cfe356adf00db3040634998941ded2eb0e55b4	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/eebe1432-b53e-4df6-a93f-44a603d4fbed.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	60	0x97f95c6fc45505b0f8fb3d34b7824da9e7f57fa10f5650e83652d0371cd13387	0xabd888dae594f7153336db1aacdb50948fe40491	0x1c245e40ada10264fb9f8e26f46f540db5fff3709d6a01398e7316acee3e74cd1cd911f2ba0762c9b8e2e7b2e3b5c345c153df371649b6548c3b7db3d3d427c61c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d462b0094d9769ba2861e4640fac6f9cfe356adf00db3040634998941ded2eb0e55b4000000000000000000000000000000000000000000000000000000000000003c00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767720491	2026-01-07 01:28:11.198397	2026-01-07 01:28:11.198397
58	0x6e67291de13bbf7dfd714e2cefe29a550d23ec76aeda9b7e7ad1db0d66419052	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/91a8d4b8-b9de-4db4-9ea1-131cfc4698e2.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	61	0x3d1e9ab50ba1cff0de0d27596e5708fb58bdf4f96c74fcfe6d8d4fb02f42afd0	0x4f42e99581e38a0b9ad091faecb69a7af139caf0	0x0ae2d2a641f52c564418ee47bcf74148c07356134a32c6eeb35da2619a9071f664bcdbeeb153857f723522a5bd7036946eb0d3ad9049aaa8add3c2ebcacde0841c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d47266e67291de13bbf7dfd714e2cefe29a550d23ec76aeda9b7e7ad1db0d66419052000000000000000000000000000000000000000000000000000000000000003d00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767720742	2026-01-07 01:32:22.502451	2026-01-07 01:32:22.502451
59	0x7bbab1aec980906c6315afd33c62498062bf016ed84f0900b777773cb72a4be4	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/c86509ae-ce05-45c0-b9e7-367f427e4f71.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	62	0x59f9ee88810b7654eef2584bd4d63a240e8a94fd7e56a4e39a2bb5990e711530	0x97d8809633ad574fc90041757af238ecf246af84	0x6bbf16a1d8cce89343acc94c0849fae35b611522366cc30c786ddceeced474ec2f5d223665494cdd1858802a83a8cfda5c37592bf3ff202b3bed1c99f6f01a1f1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d49157bbab1aec980906c6315afd33c62498062bf016ed84f0900b777773cb72a4be4000000000000000000000000000000000000000000000000000000000000003e00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767721237	2026-01-07 01:40:37.602178	2026-01-07 01:40:37.602178
60	0x6384731b56c949788ed29cd08984611706ef70e1fa9f229ee77568eee31e90ac	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/a7fbadd0-1ca9-42b5-944d-62b1b6cb659c.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	63	0xea5f711e91499cbb96902c93f0c95ed060665aa18b7ed3564f7b99aef2147393	0x55f38d2bb36e00ae25af4cbe039159b39dd9161c	0xa0787626748291f77a056b1318464fedfc640601e691f2444de3eca53decc24a3370550a71de2d7cf25af1eef18e7a7b5c51a357d8862855c134350be1deeb1a1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d4abd6384731b56c949788ed29cd08984611706ef70e1fa9f229ee77568eee31e90ac000000000000000000000000000000000000000000000000000000000000003f00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767721661	2026-01-07 01:47:41.955154	2026-01-07 01:47:41.955154
61	0xd1f3a7e590bf40bf2fb0eac0a4b113dcd85db6a88b1973e66df983a8f5a70d33	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/e2758e74-103f-473f-8683-cf0dc1d11e87.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	64	0x1256e49830da914f9482b554a24cfaf09d14976ad2613362d813001b1a50ba05	0x2a4867b65032444ae0efb7e7f6fd539141e1dd5d	0xd7c0e85e60d10ddaf63da7bf9bed3815cd23a1da2be524a9b0e17d6b9a7507fa20b836f4e7ebf749166b8f4f8ca96dfd620b2f76888c2da0d3c556292d0d67191c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d4d11d1f3a7e590bf40bf2fb0eac0a4b113dcd85db6a88b1973e66df983a8f5a70d33000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767722257	2026-01-07 01:57:37.469884	2026-01-07 01:57:37.469884
62	0x3dace64dd7aef55b4c12ff81eb38bd34713d0621dff087f0f3adf6801867756f	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	WPC		http://upload.metanode.tech/token-logo/97/cc02e0bd-fb9e-439d-934b-2d3e80ef1e68.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	65	0xc9d8b1d82e8bd72f314dd6ce1cc1ce65a7446ef1e718cd7ef25621daeaa52122	0xf78fddfe98fc2f1703074a05fe6238c444a2c1d5	0xfc546c108b1060803eb709a9e7f6f0c808480c49b4931cbde74fa2c5999650502cf2b682c5ef830940a5774503bd40b0342f75a4824d5dff45b0f79e1b26bed11c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d4efc3dace64dd7aef55b4c12ff81eb38bd34713d0621dff087f0f3adf6801867756f000000000000000000000000000000000000000000000000000000000000004100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f4400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767722748	2026-01-07 02:05:48.380574	2026-01-07 02:05:48.380574
63	0x03a5dc3349c8a1e55185f05a1e114f62c74a7aad9ebb81b67f5016ed811219d4	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	WPC		http://upload.metanode.tech/token-logo/97/cc02e0bd-fb9e-439d-934b-2d3e80ef1e68.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	66	0x3d3207e6cadf74f3c3f83067a6f5cac180b7805dd783ab844b503cdccff192be	0xb57ec0cbec1e63b9dfb511f15daa9a9ba2243192	0x9d8767a58bed356e3270e2af94a28afdf6afeb5ba0569f62c3948c3c2cbe663c7a3d13e773435d32322e5753eecb4061707b9f466769b2ca2f74da1f1a5314c11c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d4f0503a5dc3349c8a1e55185f05a1e114f62c74a7aad9ebb81b67f5016ed811219d4000000000000000000000000000000000000000000000000000000000000004200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f4400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767722757	2026-01-07 02:05:57.738339	2026-01-07 02:05:57.738339
64	0x5f13e4aaadc26277f67b9db38465ff3e87073301038166c5cf7d22e768ad5ed7	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	WPC		http://upload.metanode.tech/token-logo/97/cc02e0bd-fb9e-439d-934b-2d3e80ef1e68.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	67	0xe4f6cc12a8b5aa6a94ffbdb66f561f5aa72cdc896b261811db2085e35456ca5d	0xfff229efeaa711204ca092d0dce5a3683bf253f1	0x398a8756970ea0f60576a71f6c7aedd5c7fdac7886130ece174635ac3b046b924d685fb62d34c90b7e03124635a745dd603e9b24bf9b21d34831fa19ba22139d1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d4f275f13e4aaadc26277f67b9db38465ff3e87073301038166c5cf7d22e768ad5ed7000000000000000000000000000000000000000000000000000000000000004300000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f4400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme}	0	\N	\N	1767722791	2026-01-07 02:06:31.581292	2026-01-07 02:06:31.581292
65	0x7f75a39488d238c112dc3d5eeeb7a26d1d07e6588ee7dd704f38d0a00656cad9	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/3b139c68-582f-4ed9-b52b-e37c2163a398.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	69	0x512ad0efc8bae10324e50124e28854c9bfb709d2ef4af8d9dad52989db0bc8ae	0xc58b2f4c6b3e75bf500b504b513fb90357a3218a	0x13feeccd750c53901a096923aaa18dd9d04e2bf561f6d1e8413ac58a8dfaa315348dd3a7e1a4e283c331c51b9977ecd444680310516b2d6f76000969e84184e81c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d55e57f75a39488d238c112dc3d5eeeb7a26d1d07e6588ee7dd704f38d0a00656cad9000000000000000000000000000000000000000000000000000000000000004500000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{defi,meme}	0	\N	\N	1767724517	2026-01-07 02:35:17.772257	2026-01-07 02:35:17.772257
66	0xe68f398fc86707492756eb75f4628617be917becda107e01360d13c14f3a3c27	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/b3a1b92f-4e28-4d99-8137-8113493f61d8.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	70	0xe07994d5ca1eceb7763aa16926f0f1dd5e776e1c2d0dc379d4f1741ffb330843	0x3dfe1b946ee4f8c6941f29897f72f6986cfe1c82	0xd843ca4c1cc5dee5a40e40ad98d8b4243536070f56b52ca8c2e30d9711e984b056376b7d5c3abfd06bbc452c710e0f9b90bd8d9b83b5c382f2cd4dec282a1d701b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695d5882e68f398fc86707492756eb75f4628617be917becda107e01360d13c14f3a3c27000000000000000000000000000000000000000000000000000000000000004600000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767725186	2026-01-07 02:46:26.169626	2026-01-07 02:46:26.169626
67	0x1f320e9957bfc537a03f4769ba88762d5c0537619e2e8099210e6c7211526f7c	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/affb0c20-6897-4d99-bebf-3c4218ce3d85.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	71	0x7ebc8e34ddb835e66e06d7e3129a90307e3edcd7f619942dcd6f33185ddbe9ca	0xed025a965bf6ca269e9b5e2a27a12b97f2f61551	0x32f729e7b97d31db33c264a40f7cceaa3ecf1d166f6a669bf20279c737a845264469de615c4317c3dff2a5851d1ee06e00860c0e6c4f3a4976e65e712ccfaa2a1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e294a1f320e9957bfc537a03f4769ba88762d5c0537619e2e8099210e6c7211526f7c000000000000000000000000000000000000000000000000000000000000004700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767778634	2026-01-07 17:37:14.109263	2026-01-07 17:37:14.109263
68	0xeb80b43f243ddc198f69566e5222a9e413d0a04ca5eb70530aa0bc908d055f25	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/6873414d-bd5f-4c7a-a3f4-9ca030fde5f6.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	72	0x29aec76f3320ae4d3dced4c82cfcad642277374104e548103bcff198218f8d78	0xdfb3b2bd70f44ab81f82ae854eb7bfa44c2c00ad	0xebcf3a2c939705c16a0a4d8d2b45bc53400d25a3ba7ad314e9de8d575dc7840f02ca9dcb6da54c9b630caaba1cfafaffcf5ce0bdf648e93290a604deb0e6af9e1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e2ad1eb80b43f243ddc198f69566e5222a9e413d0a04ca5eb70530aa0bc908d055f25000000000000000000000000000000000000000000000000000000000000004800000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767779025	2026-01-07 17:43:45.468099	2026-01-07 17:43:45.468099
69	0x4da3318805460393179bd34e9cb401fd525607b9377af7b1d09e10bae93e0069	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/4a42b25b-e256-4209-8f36-435bd2477e72.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	73	0x1ebac7d8c5663b8bcd3ee977f8ad7ce0adba162a9dc0fec7b42b51d905583316	0x464781b5f63dbbc06d2991267584adeba999e556	0x220ab44adb621ecc6979146ff07555d8fc9a0701e5b4a5767387508416c855f56d3d93ecc9eba9cfc827045248e115572c092d26ddaa179cf7772d1d9879cb031c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e32a94da3318805460393179bd34e9cb401fd525607b9377af7b1d09e10bae93e0069000000000000000000000000000000000000000000000000000000000000004900000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767781033	2026-01-07 18:17:13.818501	2026-01-07 18:17:13.818501
70	0xe3b52a0833e657907721d9fb966b4b6ff69203e101bb027b9ed65f77481d504e	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/5e23e986-7abb-4fa1-b985-c166d4572897.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	74	0x1819118e529cb480824a337806900bc8095e10f9bdc27bdf9c8ba83459e4e018	0xe483daa5eb7a624dbbed50829347cc549cc6991e	0xad618fed5c8c88358fb24827b621b387a6180fa367822bc1794ff335b758c59f523647bc8fba4f1c63b61d1452cd9cedae1bb1c6d81415aabfdd8ad8b268b7581b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e33f0e3b52a0833e657907721d9fb966b4b6ff69203e101bb027b9ed65f77481d504e000000000000000000000000000000000000000000000000000000000000004a00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767781360	2026-01-07 18:22:40.43605	2026-01-07 18:22:40.43605
71	0x487eb1fec9df40344f93f4716baa7ad2d879d6b5cf42e26951552b54c741da91	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/d8193269-5089-467e-be51-087ad55aa107.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	75	0xdb6bc0cdf348cae5670a21bf9e5dfdbb3cf43f74be265dc558268fb2dcb7790f	0xe5cda1638689c608d2974a8b244b11229329d23b	0xea8d40d58d2d5dd564af8c8e25e5fb0e6dcb049f0c86cd3a08ca7508d809b1631349f166c13b8fee884383ebf06970b440f458b06c270a2403284fe82bcf8d4d1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e352f487eb1fec9df40344f93f4716baa7ad2d879d6b5cf42e26951552b54c741da91000000000000000000000000000000000000000000000000000000000000004b00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{games,social}	0	\N	\N	1767781679	2026-01-07 18:27:59.972597	2026-01-07 18:27:59.972597
72	0x0fd25ee165689f952c391b506ddcb08aa3240fe2e3f479dade27bf6345c7bc6a	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/3e1f3f8b-a820-4f2d-8cda-3426a9062f0f.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	76	0x500ea6019b1c7485599c96d28412c9a4e1c13b38fe0c9c16c2973ce6b031951c	0x63f0ea31aaf73f5e720de2c5246bdfcc3667dec6	0x17099d8b2e2985e6af021297d1834258e4ecc2719ae0fe9251a6c9ba99e42b0f0b5bd22ad23bb7851c1836fe872279110fd5da644af02f9b52d0b285e30ca3e500	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e37eb0fd25ee165689f952c391b506ddcb08aa3240fe2e3f479dade27bf6345c7bc6a000000000000000000000000000000000000000000000000000000000000004c00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767782379	2026-01-07 18:39:39.756307	2026-01-07 18:39:39.756307
73	0x4c3910c0bf38d0b4caa2594ba28cc7f76634439f48837b5870e4233195e131d4	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/fdbf7bc9-be63-462d-8ff8-5c44e82927cc.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	77	0x12b16445247292f7b95f1a3d8f70cd4177775b4afd33f20ee8ecd02f7f162560	0x87c28b9d5048cf84c9fa4e30aafe55e46cfcca58	0x4700e58044d86c25ebb62eca96eb1d28022c30ba1c33b8599b804921832a1bd75ff6dd07ea9b5ee663bc0636645f3a81dc4762ea9d2bc061ccfe572afc5cb9db1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e38d34c3910c0bf38d0b4caa2594ba28cc7f76634439f48837b5870e4233195e131d4000000000000000000000000000000000000000000000000000000000000004d00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{depin,ai,meme}	0	\N	\N	1767782611	2026-01-07 18:43:31.078658	2026-01-07 18:43:31.078658
74	0x7d9d84abb69009d0921c9f2d98e391878e57103aeec46e175a4c365cfd5f4a36	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/f729b87a-fa30-4bb9-ad07-bc57d0d4030b.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	78	0x3387e632cc32650648c857664ef4befc9514708641b7392847884a371cbc8609	0xb15995b1f89ef8713db240b300d763b626acceec	0x733be12b8f7185ba14a5923d339ccd701028e1592870139a167e0cac8a7961bb4ac9baa7eeb5fba6d5a4acd4c031fcd49a05676263b3d0d50629620f0201e1fd1c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e39b97d9d84abb69009d0921c9f2d98e391878e57103aeec46e175a4c365cfd5f4a36000000000000000000000000000000000000000000000000000000000000004e00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767782841	2026-01-07 18:47:21.213208	2026-01-07 18:47:21.213208
75	0x2ff67149b686c2db2f354deff7e8354c16a9ff53e4a892c7b382d1f0f4066249	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/402f29b3-d103-48a2-a660-5cf30792b1c6.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	79	0xd743386ab1dfbd2eb86b12ccf41c0da77bc68d7176c2f91df0133e5124a014a2	0x3b9d8432fca9848d0a9e045faae04352b45c815c	0x2beb863449cef87be0ac95028cf75cc451a0e15586aef486af74a664d1f517201d475c3fef047b05095159217687db299c9017e6a8b9db3ca726e0787453b8d51c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e3ace2ff67149b686c2db2f354deff7e8354c16a9ff53e4a892c7b382d1f0f4066249000000000000000000000000000000000000000000000000000000000000004f00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767783118	2026-01-07 18:51:58.720298	2026-01-07 18:51:58.720298
76	0xca1eec78fb4b48ad7d21bb9d74048054a07f9313c859fff76cd32b27dc895885	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/607312c1-1e47-480f-9ab5-cb5a9b2a06ba.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	80	0x58e661ece678606745b1950281b6fadf9995595a322db3fddb83a3e6da918b73	0x3d84f3e6d727fd83f009fd0d026f862202b9e580	0x8a0373b06d7151af4d19cceb96ebae145288b703d5423fb45f755023e2cf154241f52397e216325e573da809e57eb8fe6ea4924bf58669777bcdf1ed93bd865b1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e3badca1eec78fb4b48ad7d21bb9d74048054a07f9313c859fff76cd32b27dc895885000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767783341	2026-01-07 18:55:41.331397	2026-01-07 18:55:41.331397
77	0x830b008c12d9229ee6893e790238b1ba55503505ed018a01a12be9b52a305e5d	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/fbba86b0-a767-4c52-b622-016eac0ceb63.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	81	0xf6b56ea95d41b1ec023c4ff46452de79adbbcaa359a57abdc00fed7242a81cb3	0x2740aa4a43085c7dc3f1aca735e9c098ee89cfe3	0xf76ac9e70d3679aa319988451e1fe5af42ee6af9baaf0b0e9c53fccf0cdda41b5e4db684d9a38cb41577fbee7aeefa30e1b7880ba94e86ac2cb10f86038ba3b81c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e3c7c830b008c12d9229ee6893e790238b1ba55503505ed018a01a12be9b52a305e5d000000000000000000000000000000000000000000000000000000000000005100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767783548	2026-01-07 18:59:08.159566	2026-01-07 18:59:08.159566
78	0x4757cb26c9c07488c50abfb8e98fffe3fc832c3b752e746ac098b1c80af8c859	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/9124ec24-03fd-4389-a905-15c75de4f257.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	82	0x1287c9d540d1087703184159116a62e5e5fa9eba4c597bc8297920e7e03b9b40	0xfa0e1327290bc22a1d72e7fdd64493ad0608e5ae	0x752588bd020ee6d71eb7fa2993057df75c11f8889bd80f0dbdace73c0df36a2f57a4735bf2f66b79e97b515f356c663e85e848b3b18a0698aec482f963e765d31c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e3d404757cb26c9c07488c50abfb8e98fffe3fc832c3b752e746ac098b1c80af8c859000000000000000000000000000000000000000000000000000000000000005200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767783744	2026-01-07 19:02:24.831177	2026-01-07 19:02:24.831177
79	0x53dd1997fbd445272d62d81f726ae03204becd3695cb01b0a91e146e7592e8cf	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/1ac1c002-82e9-4ab0-8782-22d636b65a7b.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	83	0x026582a29e2e1a248a690459b09c8a5a42ff969daf251b48f8e954fbf13a114b	0xc153b3266113651c9d287e16469414ad669366bc	0xa37b72292bfc6bd364d101a83abe7a7072bd202f3a2f810271d5d82487e6a8720c5ac070bf480de5221333a0a92205faba7d47ec618b793ae01c8d5d1ff4d2681b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e47ea53dd1997fbd445272d62d81f726ae03204becd3695cb01b0a91e146e7592e8cf000000000000000000000000000000000000000000000000000000000000005300000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767786474	2026-01-07 19:47:54.101628	2026-01-07 19:47:54.101628
80	0x63e953ab338227afde3e75e3245768ec3a985cafbe74ce266d232e324fb5e11e	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/3c89a808-7087-43ce-8519-078afbcf5ff5.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	84	0x0c4a0870950fea66858261b49b43e11d2e0ab3e6598012a2eca7f7e74f1394ac	0xce36dbb8e58b9db0cdf827e82da8057890cbf571	0x81b024978393cda1050a3dffa471fde21c5f87b76d30c5e06787bba382a0f75856a41853b54aec6e35799010281a36dda11ce9dd649bd1e0afa4ad2d216171481c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e482b63e953ab338227afde3e75e3245768ec3a985cafbe74ce266d232e324fb5e11e000000000000000000000000000000000000000000000000000000000000005400000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social,ai}	0	\N	\N	1767786539	2026-01-07 19:48:59.148333	2026-01-07 19:48:59.148333
81	0xb25afc919eeea28a269af6d1bdd48dec70434077642a125e8139e9e9e56fd023	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/053048d4-210f-4215-b19e-80483b5aa3c1.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	85	0xdb51c15f4d462d7c5eebbd2bafe9a78052c5ad5f42f40c6a646ed9c47e4d5ea8	0x0071aa30c9d1ece0cb6271fa1fabb39f944c1dc6	0xfc528579068087daa170ab04dcfd603a97219e6255b13d67922bccb68709ffc208cfd1a9892a7305183612fe701b0c57e9363f7f1d548545cf98f1ff98c109c31c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e4957b25afc919eeea28a269af6d1bdd48dec70434077642a125e8139e9e9e56fd023000000000000000000000000000000000000000000000000000000000000005500000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767786839	2026-01-07 19:53:59.739366	2026-01-07 19:53:59.739366
82	0x964a0683120cf3d21e3c18c0dae58389255c416a6dbc5477546f415f5b5ff87d	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/053048d4-210f-4215-b19e-80483b5aa3c1.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	86	0xce506ff6944ed094e455e4f9587200df1d498898c769bbd1ca28ed888d441ab4	0x1485b97e1b2c6744e831fe69c78adb4c3f7b1ba6	0x63077816f8355e4b2d7e00c7ad27f384adb9ecd38f7c4b225b1e5532b3bd7b795815fd395a00803eb0d3ebb311673530a54af33a6a63f2f2d3981d1ec47759b81c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e4962964a0683120cf3d21e3c18c0dae58389255c416a6dbc5477546f415f5b5ff87d000000000000000000000000000000000000000000000000000000000000005600000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767786850	2026-01-07 19:54:10.739723	2026-01-07 19:54:10.739723
83	0x291f2ad022a5f89cef3866a618994e6496e04f7da915d66fde58661a9c80e90d	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/7346296f-ba21-45e4-b602-e45404adc2c5.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	87	0x5d233149f98e05830251eaa0670010ab3664179b894f67e98d564b01b107a578	0x5223392167ca729d1173d0616f9b7678b31104f2	0xd3e8fd66fefd4f8e6771122e08c562baa4ab9cc856bef1ed55f11d9a72c924c85bcbf90cb3b930774d1aee7650d0b95668d3ee1a250a193b85693f6fd73732791b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e49c8291f2ad022a5f89cef3866a618994e6496e04f7da915d66fde58661a9c80e90d000000000000000000000000000000000000000000000000000000000000005700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767786952	2026-01-07 19:55:52.490427	2026-01-07 19:55:52.490427
84	0x39149b03c355a5102d8d866aa543f4aeed0b98d13512eca87dcf384266f80e5c	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/74c1b030-7766-4964-a69c-da4185f679c6.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	88	0x6b7227e776984e683a6f1d2beec0676be265eabb010163877a30e0765e7f5b70	0xd5641a7200875033d48c6b905aec16fee35fa6db	0x01c429aa032738fc8dfc854d5db8a2c70c0cfe8f5434f50a2b3ebbb4871c1e4831d0e89c7b94c922609fe1469f9daab2fdbee5ccd1e27090ae50f1961d5f221a1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e4b5139149b03c355a5102d8d866aa543f4aeed0b98d13512eca87dcf384266f80e5c000000000000000000000000000000000000000000000000000000000000005800000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767787345	2026-01-07 20:02:25.186042	2026-01-07 20:02:25.186042
85	0xbadbfc540edef005b41330139c0c860d32e3d25d7a15363855b0d945c7cbf395	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/24ac33c6-f9a7-4739-9e60-be3d8a062933.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	89	0x1731c8e7147f563dd6b01b91c12e134e9e6365c8a1060b651a4707d3c8c26e88	0xe476eebffa42fdb516038ab1936802c04f0009ac	0x8582b74bd23a1ecc335d9f5fd24dc5c23e9395a24a26828280e35852aba9d6616bb275f01348a82af12f54ad237075d014f99f6284da8e886287f914a2b915941b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e4bf8badbfc540edef005b41330139c0c860d32e3d25d7a15363855b0d945c7cbf395000000000000000000000000000000000000000000000000000000000000005900000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767787512	2026-01-07 20:05:12.821997	2026-01-07 20:05:12.821997
86	0xdf6360d06c58f9f0660cb245e5e2161ec5de3078e505209531cb996d5fcb820a	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/23ea4808-4410-4595-b534-4403b7bc0787.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	90	0x4b896bc34e49a533fe22e9de759d1ee50774b1008d8bd735f2c5ed557a92154d	0x882a46faf53f3d57eba7adaa8655b7fda273ed83	0x991178ebd9dc5de82b7f92ffb12da1d45d28612ad53b48116600a973c7580acd5241916cfcefff49f34c5024ecd804947739e7cd23a23fbcde7c2acad993f8bc1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e4cebdf6360d06c58f9f0660cb245e5e2161ec5de3078e505209531cb996d5fcb820a000000000000000000000000000000000000000000000000000000000000005a00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								{meme,social}	0	\N	\N	1767787755	2026-01-07 20:09:15.656312	2026-01-07 20:09:15.656312
87	0x8ef56a8effff8ee6bae5c70978215e363d4c0abd1021e19ee8027df79344cbd4	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/981b0582-88aa-4c41-8ca4-cf8afd95914a.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	91	0x33f2d181efd7725837ef764ab94fdfbcda3894a48bf266af9f7f4a3719caa52e	0x35aef0c75444d8c2b7b97c8fd69b788fb3f7cb08	0xd440894a7d391a2eb1120abcc16d00b26094d612f28fd6d69bdec9a6afc6fbec4ebb4fe4dfb6ac20066c730e348d6717da81d3cd552d26f68c3a86d66b167bb21c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e4e308ef56a8effff8ee6bae5c70978215e363d4c0abd1021e19ee8027df79344cbd4000000000000000000000000000000000000000000000000000000000000005b00000000000000000000000000000000000000000000000000000000000009c400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	2500	0	0	[]								{meme,social}	0	\N	\N	1767788080	2026-01-07 20:14:40.156817	2026-01-07 20:14:40.156817
88	0xa577e89335f564c25adf01075e788aeaa1a1842f0b7a83eb24b6933130c0b961	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/78615787-b344-4b99-9dba-eb75f317e3c6.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	92	0xfc05adcd1b92e9a5210df9387c2428df3c951578821441e02ec57baffff6e187	0xcb2141a473e70c9f81606b45591b66348b7c273e	0x51b393f240b5d7f69cec47847461212a2f2e74538651cc66db973eb2310752ce7cfb1db369cc650f61b217b396128f675405580862eba8edc366e983b13239591c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e4e44a577e89335f564c25adf01075e788aeaa1a1842f0b7a83eb24b6933130c0b961000000000000000000000000000000000000000000000000000000000000005c00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	1000	0	0	[]								\N	0	\N	\N	1767788100	2026-01-07 20:15:00.192513	2026-01-07 20:15:00.192513
89	0xe3fada928f7aaecc3c62e15ea4074f55c799760fe057a7cac334f70d6f5614ed	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/cd1ab25e-4172-4f45-85de-871f9aced056.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	2	0	0	93	0x5a142e54c195df54691a9110388bbbe5030929a086ea76519680bb0521245457	0xec8a31b6878669e2e829722f0fc9f42e94c56068	0x3d23b0b695fbba05c878d12b8ccc5d9c51c8ab0067e74c8902bfc4b3b79ab9634c7fae496fa5d3b82713b79f5e1185f6eaa5aedb4ee17cee52f5cd38b212ff2f1b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e506ce3fada928f7aaecc3c62e15ea4074f55c799760fe057a7cac334f70d6f5614ed000000000000000000000000000000000000000000000000000000000000005d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	0	0	0	[]								{meme,social}	0	\N	\N	1767788652	2026-01-07 20:24:12.815422	2026-01-07 20:24:12.815422
90	0x483f85bb16759a114fe377e4e9ac1efbc714d23bbe74d36266f66c39d0e91393	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC		http://upload.metanode.tech/token-logo/97/0a876cb0-e769-445d-9c5a-9205a61972ca.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	2	0	0	94	0x74f68d94e01e89e0ae9e4ed62490d9c550eb49e256ff488cda42a0d94353241d	0x29d06e72140826cc8a45d1969f70a81cb7d21591	0x1ce933205a1cef0a55993d4199d13d96be2d2ab9cccc2c3f8225509ad14b06102ef4e99d70f0b3ae30da92da0d24c5ca3d910b7af59ee8ec1486d01b879854951b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e5be9483f85bb16759a114fe377e4e9ac1efbc714d23bbe74d36266f66c39d0e91393000000000000000000000000000000000000000000000000000000000000005e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	0	0	0	[]								{ai,meme,social}	0	\N	\N	1767791593	2026-01-07 21:13:13.717615	2026-01-07 21:13:13.717615
91	0x43d7a165528ad1f32c3874826cae84a8deb87b9ace012b1bdc99c8ccd1a591e6	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	www	WWW		http://upload.metanode.tech/token-logo/97/e18302f2-9f63-4a82-8617-448304752653.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	2	0	0	95	0x4e6ac5d6ed3c676964d2ca7d6b3f413a5d109ac5ecfc33f036067443b9f46445	0xdc63d29cddbd009b2dce17dea530feecbf23c3a0	0xdd3d04a0f77d2457075f253ff0ca643b20b777129f2727366bbe8b42c3c9f50b7ddd9abdc98ddf1115ae2a325a2a82af171df3d330ac9d3d01ac67b4e848a6021b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e5e2b43d7a165528ad1f32c3874826cae84a8deb87b9ace012b1bdc99c8ccd1a591e6000000000000000000000000000000000000000000000000000000000000005f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000037777770000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357575700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	0	0	0	[]								{defi,depin,social}	0	\N	\N	1767792171	2026-01-07 21:22:51.787818	2026-01-07 21:22:51.787818
92	0x70d5b9f83f292fd5d2cb374e76e1a677ca2ac8ef1fc3679e86729b725686ad12	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/60f79ed7-30b7-4d02-9aeb-d1bbc0c8a96f.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	2	0	0	96	0xa084d0f70c1b101609b4ff4d0c145428c136dde83c5dbe053c206f78aee5ca4a	0xb4658b331404c0c7831cb4e98552d2b6dfd4fb9e	0xc8e959d9a60a775a8cfae436cfd59e7025f4ceda2f22a4dbcd7df52dbfa13b332207d8206e171acf2499e8b4340fe9d0829bec5350513ef9b12ff4f01b35e7351b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a00000000000000000000000000000000000000000000000000000000695e7d3170d5b9f83f292fd5d2cb374e76e1a677ca2ac8ef1fc3679e86729b725686ad120000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	0	0	0	[]								{defi,ai}	0	\N	\N	1767800113	2026-01-07 23:35:13.44572	2026-01-07 23:35:13.44572
93	0x8c6e4d451b9943e1b8edc7ba57f2472c54e2dd22b865bf4cf39206a171715ce4	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/35f578ad-5a9c-4d1b-8533-c977b576c4d3.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	97	0x37abd330d134a06a9e6381d1c9c31706dbcd972546ae8a2ec78305e0deec46f4	0xdd9b0aedfe4b59709e831fe97ea6834a075b385f	0x20d6b1bfa851a9c751644688d53a9109910d07f5686a9716c830feec2afa28974f5bfb5d2a40fb307df995d8a0f0390520ddbec78ffacd1aa5add001c6199a461c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a000000000000000000000000000000000000000000000000000000006960bc888c6e4d451b9943e1b8edc7ba57f2472c54e2dd22b865bf4cf39206a171715ce40000000000000000000000000000000000000000000000000000000000000061000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	0	0	0	[]								{meme,social}	0	\N	\N	1767947400	2026-01-09 16:30:00.337197	2026-01-09 16:30:00.337197
94	0x1f047c97a48cd0d1ddf9b51e1755bacc803518db4acb378faba33211bf4363ac	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	ZOOD	ZOOD		http://upload.metanode.tech/token-logo/97/f1d41f4f-9f11-4ed3-b9c6-c0b2ddd9d5c5.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	98	0x8afab842fa94f657895ae7a0cbfe27a82b6acc88f5ace1fc24b0b1c3e9287600	0xd0f51678b40ac58ece745a7b045816816a2a355b	0x11e2f78e68de5c87c1b388fffea68462ae676edc2674b2b08a2faf5773b57fdc7141100e99314509341713c6017a7fb319b08ca5b13666dbf1f2feffecb702571c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a000000000000000000000000000000000000000000000000000000006960bcde1f047c97a48cd0d1ddf9b51e1755bacc803518db4acb378faba33211bf4363ac0000000000000000000000000000000000000000000000000000000000000062000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000045a4f4f440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045a4f4f44000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	0	0	0	[]								{meme,social}	0	\N	\N	1767947486	2026-01-09 16:31:26.315748	2026-01-09 16:31:26.315748
95	0x591a57deebbbc0d797e05e092efd22ed98acb8698e6517eebf1cc3634e66fb40	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	OKR	OKR		http://upload.metanode.tech/token-logo/97/e4d32233-37eb-4053-bbc3-84e427041255.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	99	0x14e81493273fceaa6592f3e6641cb5b3961a419c214ba814433296ecc66c4ae1	0x53e5830469a52aeb89ab7b14fe49da7138274b6b	0x2395421c5fd8b632c8f01c725ea5e5babafb63e3ddffb96956a1884ebb4815e6453f89701b24b27874880be6e40a4693eb0bba9ca59910307972c1a9a218e5681c	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a000000000000000000000000000000000000000000000000000000006960cbec591a57deebbbc0d797e05e092efd22ed98acb8698e6517eebf1cc3634e66fb400000000000000000000000000000000000000000000000000000000000000063000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000034f4b52000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034f4b5200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	0	0	0	[]								{meme,social}	0	\N	\N	1767951340	2026-01-09 17:35:40.086628	2026-01-09 17:35:40.086628
96	0x4c6886aaf4ace5420e3a05df6e6920555b5ed1114b264b125ff72129bd3eb4bd	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	WPC	WPC		http://upload.metanode.tech/token-logo/97/1aff1e83-098d-41fd-9572-c651209fc6d5.png		1000000000000000000000000000	800000000000000000000000000	8219178082191780000	1073972602000000000000000000	1	0	0	100	0x9ef16aa51495934ef14d75fde5a440183c2ac6c5e20c4086a049418b2417b377	0x933d6c501e295510c6703c46e0a5b1fd4997eb15	0x0a462d4314d20cbd4a5eef09f25b7c6e5c5294835b6c7c4ab5e67b177534888c1b1e5537ff439c492f1528097de438b48a4d808e7088775ac7f3ec71769a7cc51b	0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000033b2e3c9fd0803ce800000000000000000000000000000000000000000000000295be96e640669720000000000000000000000000000000000000000000000000000000721062eb2eb7a8a0000000000000000000000000000000000000000003785e8b69f65dc0b9a8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005a7157d6fd2ad4a9edc4686758be77ae480bfe6a000000000000000000000000000000000000000000000000000000006960f84c4c6886aaf4ace5420e3a05df6e6920555b5ed1114b264b125ff72129bd3eb4bd0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000000035750430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000357504300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000	0	0	0	[]								{meme,social}	0	\N	\N	1767962700	2026-01-09 20:45:00.190783	2026-01-09 20:45:00.190783
\.


--
-- Data for Name: token_graduated_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_graduated_events (id, token_address, liquidity_bnb, liquidity_tokens, liquidity_result, transaction_hash, block_number, block_timestamp, log_index, created_at) FROM stdin;
\.


--
-- Data for Name: token_sold_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_sold_events (id, token_address, seller_address, token_amount, bnb_amount, trading_fee, virtual_bnb_reserve, virtual_token_reserve, available_tokens, collected_bnb, transaction_hash, block_number, block_timestamp, log_index, created_at) FROM stdin;
1	0x34321291A4aB6B1FcC38d28c9512752536f7f67f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	395608347735741615800358	4902924547349063	49524490377263	10004947550962273674	799604391652264258384199642	799604391652264258384199642	4947550962273674	0x6282469f0bbdf2ae78fc59827b697154df4ffa32f9fdf625efe7c9c829361168	82803349	2026-01-06 14:03:39	2	2026-01-06 14:56:10.388197
2	0x12bBa5DB3DCb373216B636b01F1472948CD9d69b	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	395608347735741615800358	4902924547349063	49524490377263	10004947550962273674	799604391652264258384199642	799604391652264258384199642	4947550962273674	0xa41ed881886578cb905e72cc2da2a37b22d6b94f1b272ccf92655c817393ae47	82808746	2026-01-06 14:44:12	11	2026-01-06 14:56:41.284838
3	0x5b02EBe72762596BA90884ee717e049833eD3500	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	395608347735741615800358	4902924547349063	49524490377263	10004947550962273674	799604391652264258384199642	799604391652264258384199642	4947550962273674	0xd8faddb84dc45af8637da3f8f8d40d923d54d720ae0d12486c2193d9ec08dc7e	83030484	2026-01-07 18:34:53	11	2026-01-07 21:12:45.506235
4	0x8ae0B09003dd6608FC42475BF6c02BA10781AF6f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	6391020157740000000000000	49298365816829864	497963291079089	8268381753083871047	1067581581842250074869986975	793608979842250074869986975	49203670892091047	0xe62d820ec1e45155cf0148d363721d319490a77b0725992cd58cde4ff2194733	83053629	2026-01-07 21:28:59	1	2026-01-07 21:29:00.545833
5	0xBbfa3b3DD93D93454fc68A768758C6cC8FC336e5	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	9586530236610000000000000	73726867745942842	744715835817604	8243706498610019554	1070777091921120074869986975	796804489921120074869986975	24528416418239554	0xba8b439e5c455094e06a8f2f6f9824c99f1c63ffc0ef694b1dd2a121b9166846	83404943	2026-01-09 17:36:34	1	2026-01-09 17:36:35.585911
\.


--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokens (id, name, symbol, logo, banner, description, token_contract_address, creator_address, launch_mode, launch_time, bnb_current, bnb_target, margin_bnb, total_supply, status, website, twitter, telegram, discord, whitepaper, tags, hot, token_lv, token_rank, request_id, nonce, salt, pre_buy_percent, margin_time, contact_email, contact_tg, created_at, updated_at) FROM stdin;
17	Test Token 2 InitialBuy	TEST2	http://upload.metanode.tech/btc.png	\N	\N	0x96060d0b291284e6b7D4ccffBB8656c11348B6Bf	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767681852	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0xd1f50982229cc7801feda0d7a2af16cd38fa48207b122a9f0ef1ab79bf92b7d6	0	\N	0.0000	0	\N	\N	2026-01-06 14:44:12	2026-01-06 14:44:12
18	Test Token 3 Vesting	TEST3	http://upload.metanode.tech/btc.png	\N	\N	0x0c0FE9b6AF42999FE16d0ABE9aEF6681C78ca7Fe	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767681852	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x1613083e31a1b1b1d79961d07e2851a852b6bad52bbd8e7e9984676fe0d9d899	0	\N	0.0000	0	\N	\N	2026-01-06 14:44:12	2026-01-06 14:44:12
19	Test Token 1	TEST1		\N	\N	0x5b02EBe72762596BA90884ee717e049833eD3500	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767782093	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x742a3a04701ba2b8901a024fdbaca95c8526caf4388efe470436e6ddc951ad5e	0	\N	0.0000	0	\N	\N	2026-01-07 18:34:53	2026-01-07 18:34:53
20	Test Token 2 InitialBuy	TEST2		\N	\N	0x681855F1982D1eFfA97d3Fcb7f9A4949691ccC30	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767782093	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x9fd6e853c800cd0dbc57e4086c458a63dcbdc09a7fa3fc38940e4b3436767689	0	\N	0.0000	0	\N	\N	2026-01-07 18:34:53	2026-01-07 18:34:53
21	Test Token 3 Vesting	TEST3		\N	\N	0x7ce8C0C1d47EC51Ed8BfD4d93581E8e1655A47b1	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767782093	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0xe26bd51401558f6fc9dde65ef30701f3f690c2e7002d196035847b69f190b921	0	\N	0.0000	0	\N	\N	2026-01-07 18:34:53	2026-01-07 18:34:53
22	ZOOD	ZOOD		\N	\N	0x9cFcDc67e30c73558a141Fe071cF4a98428e4e32	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767788658	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0xe3fada928f7aaecc3c62e15ea4074f55c799760fe057a7cac334f70d6f5614ed	0	\N	0.0000	0	\N	\N	2026-01-07 20:24:18	2026-01-07 20:24:18
23	WPC	WPC		\N	\N	0xF078D72AadcBfBD8a96EbD61E127a98a2f63ebdC	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767791600	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x483f85bb16759a114fe377e4e9ac1efbc714d23bbe74d36266f66c39d0e91393	0	\N	0.0000	0	\N	\N	2026-01-07 21:13:20	2026-01-07 21:13:20
24	www	WWW		\N	\N	0x8ae0B09003dd6608FC42475BF6c02BA10781AF6f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767792180	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x43d7a165528ad1f32c3874826cae84a8deb87b9ace012b1bdc99c8ccd1a591e6	0	\N	0.0000	0	\N	\N	2026-01-07 21:23:00	2026-01-07 21:23:00
25	ZOOD	ZOOD		\N	\N	0x38687d9061DB30a9cD8c0c04324F60dB2783C4D6	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767800123	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x70d5b9f83f292fd5d2cb374e76e1a677ca2ac8ef1fc3679e86729b725686ad12	0	\N	0.0000	0	\N	\N	2026-01-07 23:35:23	2026-01-07 23:35:23
26	ZOOD	ZOOD		\N	\N	0x86eD235EA32bC8900E9081cA28142f5C1eFd343c	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767947406	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x8c6e4d451b9943e1b8edc7ba57f2472c54e2dd22b865bf4cf39206a171715ce4	0	\N	0.0000	0	\N	\N	2026-01-09 16:30:06	2026-01-09 16:30:06
13	Test Token 1	TEST1	http://upload.metanode.tech/btc.png	\N	\N	0x34321291A4aB6B1FcC38d28c9512752536f7f67f	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767679409	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x98673ec6022af7c5e8047de47ebf84c6ad8c75c92095a0dde91470330b6771e1	0	\N	0.0000	0	\N	\N	2026-01-06 14:03:29	2026-01-06 14:03:29
14	Test Token 2 InitialBuy	TEST2	http://upload.metanode.tech/btc.png	\N	\N	0x092e020Fa1929207b6bBa4F4c588863634DE50eb	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767679423	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x78ff5184bfed1bb04f10c8d566da34ebffbda7daed86a20456bd42cf6bc0d097	0	\N	0.0000	0	\N	\N	2026-01-06 14:03:43	2026-01-06 14:03:43
15	Test Token 3 Vesting	TEST3	http://upload.metanode.tech/btc.png	\N	\N	0xB3Ec7E0dD45A397C966B22d2dE911F0145503c82	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767679425	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x9fd72506a409cbe5e679eb52271e15d3f116acfd17f94c81eb4fd8e44359f09b	0	\N	0.0000	0	\N	\N	2026-01-06 14:03:45	2026-01-06 14:03:45
16	Test Token 1	TEST1	http://upload.metanode.tech/btc.png	\N	\N	0x12bBa5DB3DCb373216B636b01F1472948CD9d69b	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767681852	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x5fca43a01703870508a63d9122a30e8b1020cb3907f789bfca2b04cb7fd90bf1	0	\N	0.0000	0	\N	\N	2026-01-06 14:44:12	2026-01-06 14:44:12
27	ZOOD	ZOOD		\N	\N	0x8780506a1Dc1a082f7aa0b4F9Dd17C873edDcC40	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767947491	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x1f047c97a48cd0d1ddf9b51e1755bacc803518db4acb378faba33211bf4363ac	0	\N	0.0000	0	\N	\N	2026-01-09 16:31:31	2026-01-09 16:31:31
28	OKR	OKR		\N	\N	0xBbfa3b3DD93D93454fc68A768758C6cC8FC336e5	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767951345	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x591a57deebbbc0d797e05e092efd22ed98acb8698e6517eebf1cc3634e66fb40	0	\N	0.0000	0	\N	\N	2026-01-09 17:35:45	2026-01-09 17:35:45
29	WPC	WPC		\N	\N	0x4e5Bf06a2474573220d43a3C94c788f6018d8E71	0x5A7157d6Fd2aD4A9Edc4686758bE77aE480bfe6A	1	1767962704	0	24000000000000000000	0	1000000000000000000000000000	1	\N	\N	\N	\N	\N	\N	0	0	0	0x4c6886aaf4ace5420e3a05df6e6920555b5ed1114b264b125ff72129bd3eb4bd	0	\N	0.0000	0	\N	\N	2026-01-09 20:45:04	2026-01-09 20:45:04
\.


--
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trades (id, token_address, user_address, trade_type, bnb_amount, token_amount, price, usd_amount, transaction_hash, block_number, block_timestamp, created_at) FROM stdin;
\.


--
-- Data for Name: user_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_favorites (id, user_id, token_id, created_at) FROM stdin;
1	1	13	2026-01-06 16:57:16.37464
2	1	14	2026-01-06 16:57:39.1609
3	1	18	2026-01-06 17:30:21.555474
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, address, username, email, avatar, nonce, created_at, updated_at) FROM stdin;
1	0x5a7157d6fd2ad4a9edc4686758be77ae480bfe6a	0x5a71...fe6a	\N	\N	2674b2c9c9a9eb44f669c53c32c65a10	2026-01-06 16:07:56.587696	2026-01-09 20:44:37.781123
\.


--
-- Name: activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activities_id_seq', 1, false);


--
-- Name: activity_participations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_participations_id_seq', 1, false);


--
-- Name: agents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agents_id_seq', 1, false);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: indexer_state_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.indexer_state_id_seq', 27835, true);


--
-- Name: invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invites_id_seq', 1, false);


--
-- Name: klines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.klines_id_seq', 1, false);


--
-- Name: nonce_sequence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nonce_sequence_id_seq', 1, true);


--
-- Name: rebate_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rebate_records_id_seq', 1, false);


--
-- Name: token_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_balances_id_seq', 1, false);


--
-- Name: token_bought_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_bought_events_id_seq', 9, true);


--
-- Name: token_created_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_created_events_id_seq', 33, true);


--
-- Name: token_creation_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_creation_requests_id_seq', 96, true);


--
-- Name: token_graduated_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_graduated_events_id_seq', 1, false);


--
-- Name: token_sold_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_sold_events_id_seq', 5, true);


--
-- Name: tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_id_seq', 29, true);


--
-- Name: trades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trades_id_seq', 1, false);


--
-- Name: user_favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_favorites_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activity_participations activity_participations_activity_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_participations
    ADD CONSTRAINT activity_participations_activity_id_user_id_key UNIQUE (activity_id, user_id);


--
-- Name: activity_participations activity_participations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_participations
    ADD CONSTRAINT activity_participations_pkey PRIMARY KEY (id);


--
-- Name: agents agents_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_address_key UNIQUE (address);


--
-- Name: agents agents_invitation_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_invitation_code_key UNIQUE (invitation_code);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: indexer_state indexer_state_contract_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indexer_state
    ADD CONSTRAINT indexer_state_contract_address_key UNIQUE (contract_address);


--
-- Name: indexer_state indexer_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indexer_state
    ADD CONSTRAINT indexer_state_pkey PRIMARY KEY (id);


--
-- Name: invites invites_invitee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_invitee_id_key UNIQUE (invitee_id);


--
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);


--
-- Name: klines klines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.klines
    ADD CONSTRAINT klines_pkey PRIMARY KEY (id, open_time);


--
-- Name: klines klines_token_address_interval_open_time_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.klines
    ADD CONSTRAINT klines_token_address_interval_open_time_key UNIQUE (token_address, "interval", open_time);


--
-- Name: nonce_sequence nonce_sequence_chain_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nonce_sequence
    ADD CONSTRAINT nonce_sequence_chain_id_key UNIQUE (chain_id);


--
-- Name: nonce_sequence nonce_sequence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nonce_sequence
    ADD CONSTRAINT nonce_sequence_pkey PRIMARY KEY (id);


--
-- Name: rebate_records rebate_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rebate_records
    ADD CONSTRAINT rebate_records_pkey PRIMARY KEY (id);


--
-- Name: token_balances token_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_balances
    ADD CONSTRAINT token_balances_pkey PRIMARY KEY (id);


--
-- Name: token_balances token_balances_token_address_holder_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_balances
    ADD CONSTRAINT token_balances_token_address_holder_address_key UNIQUE (token_address, holder_address);


--
-- Name: token_bought_events token_bought_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_bought_events
    ADD CONSTRAINT token_bought_events_pkey PRIMARY KEY (id);


--
-- Name: token_bought_events token_bought_events_transaction_hash_log_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_bought_events
    ADD CONSTRAINT token_bought_events_transaction_hash_log_index_key UNIQUE (transaction_hash, log_index);


--
-- Name: token_created_events token_created_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_created_events
    ADD CONSTRAINT token_created_events_pkey PRIMARY KEY (id);


--
-- Name: token_created_events token_created_events_transaction_hash_log_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_created_events
    ADD CONSTRAINT token_created_events_transaction_hash_log_index_key UNIQUE (transaction_hash, log_index);


--
-- Name: token_creation_requests token_creation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_creation_requests
    ADD CONSTRAINT token_creation_requests_pkey PRIMARY KEY (id);


--
-- Name: token_creation_requests token_creation_requests_request_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_creation_requests
    ADD CONSTRAINT token_creation_requests_request_id_key UNIQUE (request_id);


--
-- Name: token_graduated_events token_graduated_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_graduated_events
    ADD CONSTRAINT token_graduated_events_pkey PRIMARY KEY (id);


--
-- Name: token_graduated_events token_graduated_events_transaction_hash_log_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_graduated_events
    ADD CONSTRAINT token_graduated_events_transaction_hash_log_index_key UNIQUE (transaction_hash, log_index);


--
-- Name: token_sold_events token_sold_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_sold_events
    ADD CONSTRAINT token_sold_events_pkey PRIMARY KEY (id);


--
-- Name: token_sold_events token_sold_events_transaction_hash_log_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_sold_events
    ADD CONSTRAINT token_sold_events_transaction_hash_log_index_key UNIQUE (transaction_hash, log_index);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_token_contract_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_token_contract_address_key UNIQUE (token_contract_address);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: trades trades_transaction_hash_trade_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_transaction_hash_trade_type_key UNIQUE (transaction_hash, trade_type);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_user_id_token_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_token_id_key UNIQUE (user_id, token_id);


--
-- Name: users users_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_address_key UNIQUE (address);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_activities_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_creator ON public.activities USING btree (creator_id);


--
-- Name: idx_activities_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_status ON public.activities USING btree (status);


--
-- Name: idx_activities_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_token ON public.activities USING btree (token_id);


--
-- Name: idx_agents_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_address ON public.agents USING btree (lower((address)::text));


--
-- Name: idx_agents_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_code ON public.agents USING btree (invitation_code);


--
-- Name: idx_agents_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_parent ON public.agents USING btree (parent_id);


--
-- Name: idx_comments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_created_at ON public.comments USING btree (created_at DESC);


--
-- Name: idx_comments_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_token ON public.comments USING btree (token_id);


--
-- Name: idx_comments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_user ON public.comments USING btree (user_id);


--
-- Name: idx_invites_inviter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invites_inviter ON public.invites USING btree (inviter_id);


--
-- Name: idx_invites_inviter_addr; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invites_inviter_addr ON public.invites USING btree (lower((inviter_address)::text));


--
-- Name: idx_klines_token_interval; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_klines_token_interval ON public.klines USING btree (lower((token_address)::text), "interval", open_time DESC);


--
-- Name: idx_rebate_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rebate_address ON public.rebate_records USING btree (lower((user_address)::text));


--
-- Name: idx_rebate_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rebate_status ON public.rebate_records USING btree (status);


--
-- Name: idx_rebate_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rebate_user ON public.rebate_records USING btree (user_id);


--
-- Name: idx_token_balances_balance; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_balances_balance ON public.token_balances USING btree (balance DESC);


--
-- Name: idx_token_balances_holder; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_balances_holder ON public.token_balances USING btree (lower((holder_address)::text));


--
-- Name: idx_token_balances_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_balances_token ON public.token_balances USING btree (lower((token_address)::text));


--
-- Name: idx_token_bought_block; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_bought_block ON public.token_bought_events USING btree (block_number);


--
-- Name: idx_token_bought_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_bought_buyer ON public.token_bought_events USING btree (buyer_address);


--
-- Name: idx_token_bought_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_bought_timestamp ON public.token_bought_events USING btree (block_timestamp DESC);


--
-- Name: idx_token_bought_token_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_bought_token_address ON public.token_bought_events USING btree (token_address);


--
-- Name: idx_token_created_block; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_created_block ON public.token_created_events USING btree (block_number);


--
-- Name: idx_token_created_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_created_creator ON public.token_created_events USING btree (creator_address);


--
-- Name: idx_token_created_request_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_created_request_id ON public.token_created_events USING btree (request_id);


--
-- Name: idx_token_created_token_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_created_token_address ON public.token_created_events USING btree (token_address);


--
-- Name: idx_token_creation_requests_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_creation_requests_creator ON public.token_creation_requests USING btree (lower((creator_address)::text));


--
-- Name: idx_token_creation_requests_predicted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_creation_requests_predicted ON public.token_creation_requests USING btree (lower((predicted_address)::text));


--
-- Name: idx_token_creation_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_creation_requests_status ON public.token_creation_requests USING btree (status);


--
-- Name: idx_token_graduated_block; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_graduated_block ON public.token_graduated_events USING btree (block_number);


--
-- Name: idx_token_graduated_token_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_graduated_token_address ON public.token_graduated_events USING btree (token_address);


--
-- Name: idx_token_sold_block; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_sold_block ON public.token_sold_events USING btree (block_number);


--
-- Name: idx_token_sold_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_sold_seller ON public.token_sold_events USING btree (seller_address);


--
-- Name: idx_token_sold_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_sold_timestamp ON public.token_sold_events USING btree (block_timestamp DESC);


--
-- Name: idx_token_sold_token_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_token_sold_token_address ON public.token_sold_events USING btree (token_address);


--
-- Name: idx_tokens_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_address ON public.tokens USING btree (lower((token_contract_address)::text));


--
-- Name: idx_tokens_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_created_at ON public.tokens USING btree (created_at DESC);


--
-- Name: idx_tokens_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_creator ON public.tokens USING btree (lower((creator_address)::text));


--
-- Name: idx_tokens_hot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_hot ON public.tokens USING btree (hot DESC);


--
-- Name: idx_tokens_launch_mode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_launch_mode ON public.tokens USING btree (launch_mode);


--
-- Name: idx_tokens_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_status ON public.tokens USING btree (status);


--
-- Name: idx_trades_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trades_timestamp ON public.trades USING btree (block_timestamp DESC);


--
-- Name: idx_trades_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trades_token ON public.trades USING btree (lower((token_address)::text));


--
-- Name: idx_trades_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trades_type ON public.trades USING btree (trade_type);


--
-- Name: idx_trades_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trades_user ON public.trades USING btree (lower((user_address)::text));


--
-- Name: idx_user_favorites_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_favorites_token ON public.user_favorites USING btree (token_id);


--
-- Name: idx_user_favorites_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_favorites_user ON public.user_favorites USING btree (user_id);


--
-- Name: idx_users_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_address ON public.users USING btree (lower((address)::text));


--
-- Name: activities activities_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: activities activities_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: activity_participations activity_participations_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_participations
    ADD CONSTRAINT activity_participations_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id);


--
-- Name: activity_participations activity_participations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_participations
    ADD CONSTRAINT activity_participations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: agents agents_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.agents(id);


--
-- Name: agents agents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: comments comments_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: invites invites_invitee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.users(id);


--
-- Name: invites invites_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id);


--
-- Name: rebate_records rebate_records_trader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rebate_records
    ADD CONSTRAINT rebate_records_trader_id_fkey FOREIGN KEY (trader_id) REFERENCES public.users(id);


--
-- Name: rebate_records rebate_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rebate_records
    ADD CONSTRAINT rebate_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_favorites user_favorites_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: user_favorites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

