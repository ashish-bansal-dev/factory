--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

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
-- Name: claim_reason_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.claim_reason_enum AS ENUM (
    'missing_item',
    'wrong_item',
    'production_failure',
    'other'
);


ALTER TYPE public.claim_reason_enum OWNER TO postgres;

--
-- Name: order_claim_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_claim_type_enum AS ENUM (
    'refund',
    'replace'
);


ALTER TYPE public.order_claim_type_enum OWNER TO postgres;

--
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'completed',
    'draft',
    'archived',
    'canceled',
    'requires_action'
);


ALTER TYPE public.order_status_enum OWNER TO postgres;

--
-- Name: return_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.return_status_enum AS ENUM (
    'open',
    'requested',
    'received',
    'partially_received',
    'canceled'
);


ALTER TYPE public.return_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_holder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_holder (
    id text NOT NULL,
    provider_id text NOT NULL,
    external_id text NOT NULL,
    email text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.account_holder OWNER TO postgres;

--
-- Name: api_key; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_key (
    id text NOT NULL,
    token text NOT NULL,
    salt text NOT NULL,
    redacted text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    last_used_at timestamp with time zone,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_by text,
    revoked_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT api_key_type_check CHECK ((type = ANY (ARRAY['publishable'::text, 'secret'::text])))
);


ALTER TABLE public.api_key OWNER TO postgres;

--
-- Name: application_method_buy_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_method_buy_rules (
    application_method_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.application_method_buy_rules OWNER TO postgres;

--
-- Name: application_method_target_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_method_target_rules (
    application_method_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.application_method_target_rules OWNER TO postgres;

--
-- Name: auth_identity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_identity (
    id text NOT NULL,
    app_metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_identity OWNER TO postgres;

--
-- Name: auth_mfa_factor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_mfa_factor (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    provider text NOT NULL,
    status text NOT NULL,
    provider_metadata jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_mfa_factor OWNER TO postgres;

--
-- Name: auth_mfa_recovery_code; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_mfa_recovery_code (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    code_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_mfa_recovery_code OWNER TO postgres;

--
-- Name: auth_password_reset_token; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_password_reset_token (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    provider_identity_id text NOT NULL,
    entity_id text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_password_reset_token OWNER TO postgres;

--
-- Name: auth_verification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_verification (
    id text NOT NULL,
    auth_identity_id text NOT NULL,
    entity_id text NOT NULL,
    entity_type text NOT NULL,
    code_provider text NOT NULL,
    verified_at timestamp with time zone,
    requested_at timestamp with time zone NOT NULL,
    provider_metadata jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auth_verification OWNER TO postgres;

--
-- Name: capture; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capture (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    payment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text,
    metadata jsonb
);


ALTER TABLE public.capture OWNER TO postgres;

--
-- Name: cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart (
    id text NOT NULL,
    region_id text,
    customer_id text,
    sales_channel_id text,
    email text,
    currency_code text NOT NULL,
    shipping_address_id text,
    billing_address_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    completed_at timestamp with time zone,
    locale text
);


ALTER TABLE public.cart OWNER TO postgres;

--
-- Name: cart_address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_address (
    id text NOT NULL,
    customer_id text,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_address OWNER TO postgres;

--
-- Name: cart_line_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_line_item (
    id text NOT NULL,
    cart_id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    thumbnail text,
    quantity integer NOT NULL,
    variant_id text,
    product_id text,
    product_title text,
    product_description text,
    product_subtitle text,
    product_type text,
    product_collection text,
    product_handle text,
    variant_sku text,
    variant_barcode text,
    variant_title text,
    variant_option_values jsonb,
    requires_shipping boolean DEFAULT true NOT NULL,
    is_discountable boolean DEFAULT true NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    compare_at_unit_price numeric,
    raw_compare_at_unit_price jsonb,
    unit_price numeric NOT NULL,
    raw_unit_price jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    product_type_id text,
    is_custom_price boolean DEFAULT false NOT NULL,
    is_giftcard boolean DEFAULT false NOT NULL,
    CONSTRAINT cart_line_item_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.cart_line_item OWNER TO postgres;

--
-- Name: cart_line_item_adjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_line_item_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    item_id text,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    CONSTRAINT cart_line_item_adjustment_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.cart_line_item_adjustment OWNER TO postgres;

--
-- Name: cart_line_item_offer_offer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_line_item_offer_offer (
    line_item_id character varying(255) NOT NULL,
    offer_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_line_item_offer_offer OWNER TO postgres;

--
-- Name: cart_line_item_tax_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_line_item_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate real NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    item_id text
);


ALTER TABLE public.cart_line_item_tax_line OWNER TO postgres;

--
-- Name: cart_payment_collection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_payment_collection (
    cart_id character varying(255) NOT NULL,
    payment_collection_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_payment_collection OWNER TO postgres;

--
-- Name: cart_promotion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_promotion (
    cart_id character varying(255) NOT NULL,
    promotion_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.cart_promotion OWNER TO postgres;

--
-- Name: cart_shipping_method; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_shipping_method (
    id text NOT NULL,
    cart_id text NOT NULL,
    name text NOT NULL,
    description jsonb,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    shipping_option_id text,
    data jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT cart_shipping_method_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.cart_shipping_method OWNER TO postgres;

--
-- Name: cart_shipping_method_adjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_shipping_method_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    shipping_method_id text
);


ALTER TABLE public.cart_shipping_method_adjustment OWNER TO postgres;

--
-- Name: cart_shipping_method_tax_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_shipping_method_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate real NOT NULL,
    provider_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    shipping_method_id text
);


ALTER TABLE public.cart_shipping_method_tax_line OWNER TO postgres;

--
-- Name: commission_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commission_line (
    id text NOT NULL,
    item_id text,
    commission_rate_id text,
    code text NOT NULL,
    rate real NOT NULL,
    amount numeric NOT NULL,
    description text,
    raw_amount jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    shipping_method_id text,
    CONSTRAINT commission_line_item_or_shipping_check CHECK ((num_nonnulls(item_id, shipping_method_id) = 1))
);


ALTER TABLE public.commission_line OWNER TO postgres;

--
-- Name: commission_rate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commission_rate (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    currency_code text,
    name text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    value numeric NOT NULL,
    include_tax boolean DEFAULT false NOT NULL,
    raw_value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    include_shipping boolean DEFAULT false NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    CONSTRAINT commission_rate_type_check CHECK ((type = ANY (ARRAY['fixed'::text, 'percentage'::text])))
);


ALTER TABLE public.commission_rate OWNER TO postgres;

--
-- Name: commission_rate_value; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commission_rate_value (
    id text NOT NULL,
    currency_code text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    commission_rate_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.commission_rate_value OWNER TO postgres;

--
-- Name: commission_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commission_rule (
    id text NOT NULL,
    reference text NOT NULL,
    reference_id text NOT NULL,
    commission_rate_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.commission_rule OWNER TO postgres;

--
-- Name: credit_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_line (
    id text NOT NULL,
    cart_id text NOT NULL,
    reference text,
    reference_id text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.credit_line OWNER TO postgres;

--
-- Name: currency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currency (
    code text NOT NULL,
    symbol text NOT NULL,
    symbol_native text NOT NULL,
    decimal_digits integer DEFAULT 0 NOT NULL,
    rounding numeric DEFAULT 0 NOT NULL,
    raw_rounding jsonb NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.currency OWNER TO postgres;

--
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    id text NOT NULL,
    company_name text,
    first_name text,
    last_name text,
    email text,
    phone text,
    has_account boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- Name: customer_account_holder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_account_holder (
    customer_id character varying(255) NOT NULL,
    account_holder_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_account_holder OWNER TO postgres;

--
-- Name: customer_address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_address (
    id text NOT NULL,
    customer_id text NOT NULL,
    address_name text,
    is_default_shipping boolean DEFAULT false NOT NULL,
    is_default_billing boolean DEFAULT false NOT NULL,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_address OWNER TO postgres;

--
-- Name: customer_customer_group_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_customer_group_seller_seller (
    customer_group_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_customer_group_seller_seller OWNER TO postgres;

--
-- Name: customer_customer_review_review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_customer_review_review (
    customer_id character varying(255) NOT NULL,
    review_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_customer_review_review OWNER TO postgres;

--
-- Name: customer_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_group (
    id text NOT NULL,
    name text NOT NULL,
    metadata jsonb,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_group OWNER TO postgres;

--
-- Name: customer_group_customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_group_customer (
    id text NOT NULL,
    customer_id text NOT NULL,
    customer_group_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.customer_group_customer OWNER TO postgres;

--
-- Name: fulfillment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulfillment (
    id text NOT NULL,
    location_id text NOT NULL,
    packed_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    canceled_at timestamp with time zone,
    data jsonb,
    provider_id text,
    shipping_option_id text,
    metadata jsonb,
    delivery_address_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    marked_shipped_by text,
    created_by text,
    requires_shipping boolean DEFAULT true NOT NULL
);


ALTER TABLE public.fulfillment OWNER TO postgres;

--
-- Name: fulfillment_address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulfillment_address (
    id text NOT NULL,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_address OWNER TO postgres;

--
-- Name: fulfillment_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulfillment_item (
    id text NOT NULL,
    title text NOT NULL,
    sku text NOT NULL,
    barcode text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    line_item_id text,
    inventory_item_id text,
    fulfillment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_item OWNER TO postgres;

--
-- Name: fulfillment_label; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulfillment_label (
    id text NOT NULL,
    tracking_number text NOT NULL,
    tracking_url text NOT NULL,
    label_url text NOT NULL,
    fulfillment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_label OWNER TO postgres;

--
-- Name: fulfillment_provider; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulfillment_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_provider OWNER TO postgres;

--
-- Name: fulfillment_set; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulfillment_set (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_set OWNER TO postgres;

--
-- Name: fulfillment_shipping_option_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulfillment_shipping_option_seller_seller (
    shipping_option_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_shipping_option_seller_seller OWNER TO postgres;

--
-- Name: fulfillment_shipping_profile_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulfillment_shipping_profile_seller_seller (
    shipping_profile_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fulfillment_shipping_profile_seller_seller OWNER TO postgres;

--
-- Name: geo_zone; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.geo_zone (
    id text NOT NULL,
    type text DEFAULT 'country'::text NOT NULL,
    country_code text NOT NULL,
    province_code text,
    city text,
    service_zone_id text NOT NULL,
    postal_expression jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT geo_zone_type_check CHECK ((type = ANY (ARRAY['country'::text, 'province'::text, 'city'::text, 'zip'::text])))
);


ALTER TABLE public.geo_zone OWNER TO postgres;

--
-- Name: image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image (
    id text NOT NULL,
    url text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    rank integer DEFAULT 0 NOT NULL,
    product_id text NOT NULL
);


ALTER TABLE public.image OWNER TO postgres;

--
-- Name: inventory_inventory_item_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_inventory_item_seller_seller (
    inventory_item_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.inventory_inventory_item_seller_seller OWNER TO postgres;

--
-- Name: inventory_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_item (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    sku text,
    origin_country text,
    hs_code text,
    mid_code text,
    material text,
    weight integer,
    length integer,
    height integer,
    width integer,
    requires_shipping boolean DEFAULT true NOT NULL,
    description text,
    title text,
    thumbnail text,
    metadata jsonb
);


ALTER TABLE public.inventory_item OWNER TO postgres;

--
-- Name: inventory_level; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_level (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    inventory_item_id text NOT NULL,
    location_id text NOT NULL,
    stocked_quantity numeric DEFAULT 0 NOT NULL,
    reserved_quantity numeric DEFAULT 0 NOT NULL,
    incoming_quantity numeric DEFAULT 0 NOT NULL,
    metadata jsonb,
    raw_stocked_quantity jsonb,
    raw_reserved_quantity jsonb,
    raw_incoming_quantity jsonb
);


ALTER TABLE public.inventory_level OWNER TO postgres;

--
-- Name: invite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invite (
    id text NOT NULL,
    email text NOT NULL,
    accepted boolean DEFAULT false NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.invite OWNER TO postgres;

--
-- Name: invite_rbac_role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invite_rbac_role (
    invite_id character varying(255) NOT NULL,
    rbac_role_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.invite_rbac_role OWNER TO postgres;

--
-- Name: layout_configuration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.layout_configuration (
    id text NOT NULL,
    zone text NOT NULL,
    user_id text,
    is_system_default boolean DEFAULT false NOT NULL,
    configuration jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.layout_configuration OWNER TO postgres;

--
-- Name: link_module_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.link_module_migrations (
    id integer NOT NULL,
    table_name character varying(255) NOT NULL,
    link_descriptor jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.link_module_migrations OWNER TO postgres;

--
-- Name: link_module_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.link_module_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.link_module_migrations_id_seq OWNER TO postgres;

--
-- Name: link_module_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.link_module_migrations_id_seq OWNED BY public.link_module_migrations.id;


--
-- Name: location_fulfillment_provider; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_fulfillment_provider (
    stock_location_id character varying(255) NOT NULL,
    fulfillment_provider_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.location_fulfillment_provider OWNER TO postgres;

--
-- Name: location_fulfillment_set; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_fulfillment_set (
    stock_location_id character varying(255) NOT NULL,
    fulfillment_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.location_fulfillment_set OWNER TO postgres;

--
-- Name: media_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_image (
    id text NOT NULL,
    url text NOT NULL,
    type text,
    is_thumbnail boolean DEFAULT false NOT NULL,
    is_banner boolean DEFAULT false NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.media_image OWNER TO postgres;

--
-- Name: member; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member (
    id text NOT NULL,
    email text NOT NULL,
    locale text,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    first_name text,
    last_name text
);


ALTER TABLE public.member OWNER TO postgres;

--
-- Name: member_invite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_invite (
    id text NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    accepted boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    role_id text NOT NULL,
    seller_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.member_invite OWNER TO postgres;

--
-- Name: mikro_orm_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mikro_orm_migrations (
    id integer NOT NULL,
    name character varying(255),
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.mikro_orm_migrations OWNER TO postgres;

--
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mikro_orm_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mikro_orm_migrations_id_seq OWNER TO postgres;

--
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mikro_orm_migrations_id_seq OWNED BY public.mikro_orm_migrations.id;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id text NOT NULL,
    "to" text NOT NULL,
    channel text NOT NULL,
    template text,
    data jsonb,
    trigger_type text,
    resource_id text,
    resource_type text,
    receiver_id text,
    original_notification_id text,
    idempotency_key text,
    external_id text,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    "from" text,
    provider_data jsonb,
    CONSTRAINT notification_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'failure'::text])))
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- Name: notification_provider; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_provider (
    id text NOT NULL,
    handle text NOT NULL,
    name text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    channels text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.notification_provider OWNER TO postgres;

--
-- Name: offer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offer (
    id text NOT NULL,
    seller_id text NOT NULL,
    variant_id text NOT NULL,
    shipping_profile_id text NOT NULL,
    sku text NOT NULL,
    ean text,
    upc text,
    created_by text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    product_id text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.offer OWNER TO postgres;

--
-- Name: offer_inventory_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offer_inventory_item (
    offer_id character varying(255) NOT NULL,
    inventory_item_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    required_quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.offer_inventory_item OWNER TO postgres;

--
-- Name: offer_offer_pricing_price; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offer_offer_pricing_price (
    offer_id character varying(255) NOT NULL,
    price_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.offer_offer_pricing_price OWNER TO postgres;

--
-- Name: onboarding; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding (
    id text NOT NULL,
    data jsonb,
    context jsonb,
    account_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.onboarding OWNER TO postgres;

--
-- Name: order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."order" (
    id text NOT NULL,
    region_id text,
    display_id integer,
    customer_id text,
    version integer DEFAULT 1 NOT NULL,
    sales_channel_id text,
    status public.order_status_enum DEFAULT 'pending'::public.order_status_enum NOT NULL,
    is_draft_order boolean DEFAULT false NOT NULL,
    email text,
    currency_code text NOT NULL,
    shipping_address_id text,
    billing_address_id text,
    no_notification boolean,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    custom_display_id text,
    locale text
);


ALTER TABLE public."order" OWNER TO postgres;

--
-- Name: order_address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_address (
    id text NOT NULL,
    customer_id text,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_address OWNER TO postgres;

--
-- Name: order_cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_cart (
    order_id character varying(255) NOT NULL,
    cart_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_cart OWNER TO postgres;

--
-- Name: order_change; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_change (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    internal_note text,
    created_by text,
    requested_by text,
    requested_at timestamp with time zone,
    confirmed_by text,
    confirmed_at timestamp with time zone,
    declined_by text,
    declined_reason text,
    metadata jsonb,
    declined_at timestamp with time zone,
    canceled_by text,
    canceled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    change_type text,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text,
    carry_over_promotions boolean,
    CONSTRAINT order_change_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'declined'::text, 'requested'::text, 'pending'::text, 'canceled'::text])))
);


ALTER TABLE public.order_change OWNER TO postgres;

--
-- Name: order_change_action; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_change_action (
    id text NOT NULL,
    order_id text,
    version integer,
    ordering bigint NOT NULL,
    order_change_id text,
    reference text,
    reference_id text,
    action text NOT NULL,
    details jsonb,
    amount numeric,
    raw_amount jsonb,
    internal_note text,
    applied boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_change_action OWNER TO postgres;

--
-- Name: order_change_action_ordering_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_change_action_ordering_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_change_action_ordering_seq OWNER TO postgres;

--
-- Name: order_change_action_ordering_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_change_action_ordering_seq OWNED BY public.order_change_action.ordering;


--
-- Name: order_claim; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_claim (
    id text NOT NULL,
    order_id text NOT NULL,
    return_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    type public.order_claim_type_enum NOT NULL,
    no_notification boolean,
    refund_amount numeric,
    raw_refund_amount jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.order_claim OWNER TO postgres;

--
-- Name: order_claim_display_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_claim_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_claim_display_id_seq OWNER TO postgres;

--
-- Name: order_claim_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_claim_display_id_seq OWNED BY public.order_claim.display_id;


--
-- Name: order_claim_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_claim_item (
    id text NOT NULL,
    claim_id text NOT NULL,
    item_id text NOT NULL,
    is_additional_item boolean DEFAULT false NOT NULL,
    reason public.claim_reason_enum,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_claim_item OWNER TO postgres;

--
-- Name: order_claim_item_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_claim_item_image (
    id text NOT NULL,
    claim_item_id text NOT NULL,
    url text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_claim_item_image OWNER TO postgres;

--
-- Name: order_credit_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_credit_line (
    id text NOT NULL,
    order_id text NOT NULL,
    reference text,
    reference_id text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_credit_line OWNER TO postgres;

--
-- Name: order_display_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_display_id_seq OWNER TO postgres;

--
-- Name: order_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_display_id_seq OWNED BY public."order".display_id;


--
-- Name: order_exchange; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_exchange (
    id text NOT NULL,
    order_id text NOT NULL,
    return_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    no_notification boolean,
    allow_backorder boolean DEFAULT false NOT NULL,
    difference_due numeric,
    raw_difference_due jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    canceled_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.order_exchange OWNER TO postgres;

--
-- Name: order_exchange_display_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_exchange_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_exchange_display_id_seq OWNER TO postgres;

--
-- Name: order_exchange_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_exchange_display_id_seq OWNED BY public.order_exchange.display_id;


--
-- Name: order_exchange_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_exchange_item (
    id text NOT NULL,
    exchange_id text NOT NULL,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_exchange_item OWNER TO postgres;

--
-- Name: order_fulfillment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_fulfillment (
    order_id character varying(255) NOT NULL,
    fulfillment_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_fulfillment OWNER TO postgres;

--
-- Name: order_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_group (
    id text NOT NULL,
    display_id integer NOT NULL,
    customer_id text,
    cart_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_group OWNER TO postgres;

--
-- Name: order_group_display_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_group_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_group_display_id_seq OWNER TO postgres;

--
-- Name: order_group_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_group_display_id_seq OWNED BY public.order_group.display_id;


--
-- Name: order_group_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_group_order (
    order_group_id character varying(255) NOT NULL,
    order_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_group_order OWNER TO postgres;

--
-- Name: order_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    fulfilled_quantity numeric NOT NULL,
    raw_fulfilled_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    shipped_quantity numeric NOT NULL,
    raw_shipped_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_requested_quantity numeric NOT NULL,
    raw_return_requested_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_received_quantity numeric NOT NULL,
    raw_return_received_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    return_dismissed_quantity numeric NOT NULL,
    raw_return_dismissed_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    written_off_quantity numeric NOT NULL,
    raw_written_off_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    delivered_quantity numeric DEFAULT 0 NOT NULL,
    raw_delivered_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    unit_price numeric,
    raw_unit_price jsonb,
    compare_at_unit_price numeric,
    raw_compare_at_unit_price jsonb
);


ALTER TABLE public.order_item OWNER TO postgres;

--
-- Name: order_line_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_line_item (
    id text NOT NULL,
    totals_id text,
    title text NOT NULL,
    subtitle text,
    thumbnail text,
    variant_id text,
    product_id text,
    product_title text,
    product_description text,
    product_subtitle text,
    product_type text,
    product_collection text,
    product_handle text,
    variant_sku text,
    variant_barcode text,
    variant_title text,
    variant_option_values jsonb,
    requires_shipping boolean DEFAULT true NOT NULL,
    is_discountable boolean DEFAULT true NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    compare_at_unit_price numeric,
    raw_compare_at_unit_price jsonb,
    unit_price numeric NOT NULL,
    raw_unit_price jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_custom_price boolean DEFAULT false NOT NULL,
    product_type_id text,
    is_giftcard boolean DEFAULT false NOT NULL
);


ALTER TABLE public.order_line_item OWNER TO postgres;

--
-- Name: order_line_item_adjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_line_item_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    item_id text NOT NULL,
    deleted_at timestamp with time zone,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_line_item_adjustment OWNER TO postgres;

--
-- Name: order_line_item_tax_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_line_item_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate numeric NOT NULL,
    raw_rate jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    item_id text NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_line_item_tax_line OWNER TO postgres;

--
-- Name: order_order_line_item_offer_offer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_order_line_item_offer_offer (
    order_line_item_id character varying(255) NOT NULL,
    offer_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_order_line_item_offer_offer OWNER TO postgres;

--
-- Name: order_order_payout_payout; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_order_payout_payout (
    order_id character varying(255) NOT NULL,
    payout_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_order_payout_payout OWNER TO postgres;

--
-- Name: order_order_review_review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_order_review_review (
    order_id character varying(255) NOT NULL,
    review_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_order_review_review OWNER TO postgres;

--
-- Name: order_order_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_order_seller_seller (
    order_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_order_seller_seller OWNER TO postgres;

--
-- Name: order_payment_collection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_payment_collection (
    order_id character varying(255) NOT NULL,
    payment_collection_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_payment_collection OWNER TO postgres;

--
-- Name: order_promotion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_promotion (
    order_id character varying(255) NOT NULL,
    promotion_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_promotion OWNER TO postgres;

--
-- Name: order_shipping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_shipping (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer NOT NULL,
    shipping_method_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_shipping OWNER TO postgres;

--
-- Name: order_shipping_method; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_shipping_method (
    id text NOT NULL,
    name text NOT NULL,
    description jsonb,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    shipping_option_id text,
    data jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_custom_amount boolean DEFAULT false NOT NULL
);


ALTER TABLE public.order_shipping_method OWNER TO postgres;

--
-- Name: order_shipping_method_adjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_shipping_method_adjustment (
    id text NOT NULL,
    description text,
    promotion_id text,
    code text,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shipping_method_id text NOT NULL,
    deleted_at timestamp with time zone,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_shipping_method_adjustment OWNER TO postgres;

--
-- Name: order_shipping_method_tax_line; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_shipping_method_tax_line (
    id text NOT NULL,
    description text,
    tax_rate_id text,
    code text NOT NULL,
    rate numeric NOT NULL,
    raw_rate jsonb NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    shipping_method_id text NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_shipping_method_tax_line OWNER TO postgres;

--
-- Name: order_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_summary (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    totals jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.order_summary OWNER TO postgres;

--
-- Name: order_transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_transaction (
    id text NOT NULL,
    order_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    currency_code text NOT NULL,
    reference text,
    reference_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    return_id text,
    claim_id text,
    exchange_id text
);


ALTER TABLE public.order_transaction OWNER TO postgres;

--
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    currency_code text NOT NULL,
    provider_id text NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    captured_at timestamp with time zone,
    canceled_at timestamp with time zone,
    payment_collection_id text NOT NULL,
    payment_session_id text NOT NULL,
    metadata jsonb
);


ALTER TABLE public.payment OWNER TO postgres;

--
-- Name: payment_collection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_collection (
    id text NOT NULL,
    currency_code text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    authorized_amount numeric,
    raw_authorized_amount jsonb,
    captured_amount numeric,
    raw_captured_amount jsonb,
    refunded_amount numeric,
    raw_refunded_amount jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    completed_at timestamp with time zone,
    status text DEFAULT 'not_paid'::text NOT NULL,
    metadata jsonb,
    CONSTRAINT payment_collection_status_check CHECK ((status = ANY (ARRAY['not_paid'::text, 'awaiting'::text, 'authorized'::text, 'partially_authorized'::text, 'canceled'::text, 'failed'::text, 'partially_captured'::text, 'completed'::text])))
);


ALTER TABLE public.payment_collection OWNER TO postgres;

--
-- Name: payment_collection_payment_providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_collection_payment_providers (
    payment_collection_id text NOT NULL,
    payment_provider_id text NOT NULL
);


ALTER TABLE public.payment_collection_payment_providers OWNER TO postgres;

--
-- Name: payment_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_details (
    id text NOT NULL,
    holder_name text,
    bank_name text,
    iban text,
    bic text,
    routing_number text,
    account_number text,
    seller_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    country_code text DEFAULT ''::text
);


ALTER TABLE public.payment_details OWNER TO postgres;

--
-- Name: payment_provider; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.payment_provider OWNER TO postgres;

--
-- Name: payment_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_session (
    id text NOT NULL,
    currency_code text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    provider_id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    context jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    authorized_at timestamp with time zone,
    payment_collection_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT payment_session_status_check CHECK ((status = ANY (ARRAY['authorized'::text, 'captured'::text, 'pending'::text, 'requires_more'::text, 'error'::text, 'canceled'::text, 'pending_authorization'::text])))
);


ALTER TABLE public.payment_session OWNER TO postgres;

--
-- Name: payout; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payout (
    id text NOT NULL,
    currency_code text NOT NULL,
    amount numeric NOT NULL,
    data jsonb,
    account_id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    raw_amount jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    display_id integer NOT NULL,
    CONSTRAINT payout_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'canceled'::text])))
);


ALTER TABLE public.payout OWNER TO postgres;

--
-- Name: payout_account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payout_account (
    id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    data jsonb NOT NULL,
    context jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT payout_account_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'restricted'::text, 'rejected'::text])))
);


ALTER TABLE public.payout_account OWNER TO postgres;

--
-- Name: payout_display_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payout_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payout_display_id_seq OWNER TO postgres;

--
-- Name: payout_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payout_display_id_seq OWNED BY public.payout.display_id;


--
-- Name: payout_payout_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payout_payout_seller_seller (
    payout_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.payout_payout_seller_seller OWNER TO postgres;

--
-- Name: price; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price (
    id text NOT NULL,
    title text,
    price_set_id text NOT NULL,
    currency_code text NOT NULL,
    raw_amount jsonb NOT NULL,
    rules_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    price_list_id text,
    amount numeric NOT NULL,
    min_quantity numeric,
    max_quantity numeric,
    raw_min_quantity jsonb,
    raw_max_quantity jsonb
);


ALTER TABLE public.price OWNER TO postgres;

--
-- Name: price_list; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_list (
    id text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    rules_count integer DEFAULT 0,
    title text NOT NULL,
    description text NOT NULL,
    type text DEFAULT 'sale'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    CONSTRAINT price_list_status_check CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text]))),
    CONSTRAINT price_list_type_check CHECK ((type = ANY (ARRAY['sale'::text, 'override'::text])))
);


ALTER TABLE public.price_list OWNER TO postgres;

--
-- Name: price_list_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_list_rule (
    id text NOT NULL,
    price_list_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    value jsonb,
    attribute text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.price_list_rule OWNER TO postgres;

--
-- Name: price_preference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_preference (
    id text NOT NULL,
    attribute text NOT NULL,
    value text,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.price_preference OWNER TO postgres;

--
-- Name: price_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_rule (
    id text NOT NULL,
    value text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    price_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    attribute text DEFAULT ''::text NOT NULL,
    operator text DEFAULT 'eq'::text NOT NULL,
    CONSTRAINT price_rule_operator_check CHECK ((operator = ANY (ARRAY['gte'::text, 'lte'::text, 'gt'::text, 'lt'::text, 'eq'::text])))
);


ALTER TABLE public.price_rule OWNER TO postgres;

--
-- Name: price_set; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_set (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.price_set OWNER TO postgres;

--
-- Name: pricing_price_list_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_price_list_seller_seller (
    price_list_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.pricing_price_list_seller_seller OWNER TO postgres;

--
-- Name: product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product (
    id text NOT NULL,
    title text NOT NULL,
    handle text NOT NULL,
    subtitle text,
    description text,
    is_giftcard boolean DEFAULT false NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    thumbnail text,
    weight real,
    length real,
    height real,
    width real,
    origin_country text,
    hs_code text,
    mid_code text,
    material text,
    collection_id text,
    type_id text,
    discountable boolean DEFAULT true NOT NULL,
    external_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    CONSTRAINT product_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'proposed'::text, 'published'::text, 'rejected'::text])))
);


ALTER TABLE public.product OWNER TO postgres;

--
-- Name: product_attribute; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_attribute (
    id text NOT NULL,
    handle text,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    is_filterable boolean DEFAULT false NOT NULL,
    is_variant_axis boolean DEFAULT false NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    product_id text,
    product_option_id text
);


ALTER TABLE public.product_attribute OWNER TO postgres;

--
-- Name: product_attribute_value; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_attribute_value (
    id text NOT NULL,
    handle text,
    name text NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    attribute_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    product_option_value_id text
);


ALTER TABLE public.product_attribute_value OWNER TO postgres;

--
-- Name: product_attribute_value_link; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_attribute_value_link (
    product_id character varying(255) NOT NULL,
    product_attribute_value_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_attribute_value_link OWNER TO postgres;

--
-- Name: product_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_category (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    handle text NOT NULL,
    mpath text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    parent_category_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    metadata jsonb,
    external_id text
);


ALTER TABLE public.product_category OWNER TO postgres;

--
-- Name: product_category_attribute; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_category_attribute (
    product_attribute_id character varying(255) NOT NULL,
    product_category_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_category_attribute OWNER TO postgres;

--
-- Name: product_category_product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_category_product (
    product_id text NOT NULL,
    product_category_id text NOT NULL
);


ALTER TABLE public.product_category_product OWNER TO postgres;

--
-- Name: product_change; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_change (
    id text NOT NULL,
    product_id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    internal_note text,
    external_note text,
    created_by text,
    confirmed_by text,
    confirmed_at timestamp with time zone,
    declined_by text,
    declined_at timestamp with time zone,
    declined_reason text,
    canceled_by text,
    canceled_at timestamp with time zone,
    requires_action_by text,
    requires_action_at timestamp with time zone,
    requires_action_reason text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_change OWNER TO postgres;

--
-- Name: product_change_action; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_change_action (
    id text NOT NULL,
    product_id text NOT NULL,
    ordering bigint NOT NULL,
    action text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    internal_note text,
    applied boolean DEFAULT false NOT NULL,
    product_change_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_change_action OWNER TO postgres;

--
-- Name: product_change_action_ordering_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_change_action_ordering_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_change_action_ordering_seq OWNER TO postgres;

--
-- Name: product_change_action_ordering_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_change_action_ordering_seq OWNED BY public.product_change_action.ordering;


--
-- Name: product_collection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_collection (
    id text NOT NULL,
    title text NOT NULL,
    handle text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_collection OWNER TO postgres;

--
-- Name: product_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_option (
    id text NOT NULL,
    title text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_exclusive boolean DEFAULT false NOT NULL
);


ALTER TABLE public.product_option OWNER TO postgres;

--
-- Name: product_option_value; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_option_value (
    id text NOT NULL,
    value text NOT NULL,
    option_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    rank integer
);


ALTER TABLE public.product_option_value OWNER TO postgres;

--
-- Name: product_product_category_media_media_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_product_category_media_media_image (
    product_category_id character varying(255) NOT NULL,
    media_image_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_category_media_media_image OWNER TO postgres;

--
-- Name: product_product_category_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_product_category_seller_seller (
    product_category_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_category_seller_seller OWNER TO postgres;

--
-- Name: product_product_collection_media_media_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_product_collection_media_media_image (
    product_collection_id character varying(255) NOT NULL,
    media_image_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_collection_media_media_image OWNER TO postgres;

--
-- Name: product_product_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_product_option (
    id text NOT NULL,
    product_id text NOT NULL,
    product_option_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_option OWNER TO postgres;

--
-- Name: product_product_option_value; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_product_option_value (
    id text NOT NULL,
    product_product_option_id text NOT NULL,
    product_option_value_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_option_value OWNER TO postgres;

--
-- Name: product_product_review_review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_product_review_review (
    product_id character varying(255) NOT NULL,
    review_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_product_review_review OWNER TO postgres;

--
-- Name: product_sales_channel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_sales_channel (
    product_id character varying(255) NOT NULL,
    sales_channel_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_sales_channel OWNER TO postgres;

--
-- Name: product_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_seller (
    product_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_seller OWNER TO postgres;

--
-- Name: product_shipping_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_shipping_profile (
    product_id character varying(255) NOT NULL,
    shipping_profile_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_shipping_profile OWNER TO postgres;

--
-- Name: product_tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_tag (
    id text NOT NULL,
    value text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_tag OWNER TO postgres;

--
-- Name: product_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_tags (
    product_id text NOT NULL,
    product_tag_id text NOT NULL
);


ALTER TABLE public.product_tags OWNER TO postgres;

--
-- Name: product_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_type (
    id text NOT NULL,
    value text NOT NULL,
    metadata json,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    external_id text
);


ALTER TABLE public.product_type OWNER TO postgres;

--
-- Name: product_variant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variant (
    id text NOT NULL,
    title text NOT NULL,
    sku text,
    barcode text,
    ean text,
    upc text,
    allow_backorder boolean DEFAULT false NOT NULL,
    manage_inventory boolean DEFAULT true NOT NULL,
    hs_code text,
    origin_country text,
    mid_code text,
    material text,
    weight real,
    length real,
    height real,
    width real,
    metadata jsonb,
    variant_rank integer DEFAULT 0,
    product_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    thumbnail text
);


ALTER TABLE public.product_variant OWNER TO postgres;

--
-- Name: product_variant_inventory_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variant_inventory_item (
    variant_id character varying(255) NOT NULL,
    inventory_item_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    required_quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_inventory_item OWNER TO postgres;

--
-- Name: product_variant_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variant_option (
    variant_id text NOT NULL,
    option_value_id text NOT NULL
);


ALTER TABLE public.product_variant_option OWNER TO postgres;

--
-- Name: product_variant_price_set; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variant_price_set (
    variant_id character varying(255) NOT NULL,
    price_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_price_set OWNER TO postgres;

--
-- Name: product_variant_product_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variant_product_image (
    id text NOT NULL,
    variant_id text NOT NULL,
    image_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.product_variant_product_image OWNER TO postgres;

--
-- Name: professional_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.professional_details (
    id text NOT NULL,
    corporate_name text,
    registration_number text,
    tax_id text,
    seller_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.professional_details OWNER TO postgres;

--
-- Name: promotion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion (
    id text NOT NULL,
    code text NOT NULL,
    campaign_id text,
    is_automatic boolean DEFAULT false NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    is_tax_inclusive boolean DEFAULT false NOT NULL,
    "limit" integer,
    used integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    CONSTRAINT promotion_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text]))),
    CONSTRAINT promotion_type_check CHECK ((type = ANY (ARRAY['standard'::text, 'buyget'::text])))
);


ALTER TABLE public.promotion OWNER TO postgres;

--
-- Name: promotion_application_method; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_application_method (
    id text NOT NULL,
    value numeric,
    raw_value jsonb,
    max_quantity integer,
    apply_to_quantity integer,
    buy_rules_min_quantity integer,
    type text NOT NULL,
    target_type text NOT NULL,
    allocation text,
    promotion_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    currency_code text,
    CONSTRAINT promotion_application_method_allocation_check CHECK ((allocation = ANY (ARRAY['each'::text, 'across'::text, 'once'::text]))),
    CONSTRAINT promotion_application_method_target_type_check CHECK ((target_type = ANY (ARRAY['order'::text, 'shipping_methods'::text, 'items'::text]))),
    CONSTRAINT promotion_application_method_type_check CHECK ((type = ANY (ARRAY['fixed'::text, 'percentage'::text])))
);


ALTER TABLE public.promotion_application_method OWNER TO postgres;

--
-- Name: promotion_campaign; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_campaign (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    campaign_identifier text NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_campaign OWNER TO postgres;

--
-- Name: promotion_campaign_budget; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_campaign_budget (
    id text NOT NULL,
    type text NOT NULL,
    campaign_id text NOT NULL,
    "limit" numeric,
    raw_limit jsonb,
    used numeric DEFAULT 0 NOT NULL,
    raw_used jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    currency_code text,
    attribute text,
    CONSTRAINT promotion_campaign_budget_type_check CHECK ((type = ANY (ARRAY['spend'::text, 'usage'::text, 'use_by_attribute'::text, 'spend_by_attribute'::text])))
);


ALTER TABLE public.promotion_campaign_budget OWNER TO postgres;

--
-- Name: promotion_campaign_budget_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_campaign_budget_usage (
    id text NOT NULL,
    attribute_value text NOT NULL,
    used numeric DEFAULT 0 NOT NULL,
    budget_id text NOT NULL,
    raw_used jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_campaign_budget_usage OWNER TO postgres;

--
-- Name: promotion_campaign_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_campaign_seller_seller (
    campaign_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_campaign_seller_seller OWNER TO postgres;

--
-- Name: promotion_cost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_cost (
    id text NOT NULL,
    promotion_id text NOT NULL,
    cost_bearer text DEFAULT 'store'::text NOT NULL,
    shared_marketplace_percentage integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT promotion_cost_cost_bearer_check CHECK ((cost_bearer = ANY (ARRAY['store'::text, 'marketplace'::text, 'shared'::text])))
);


ALTER TABLE public.promotion_cost OWNER TO postgres;

--
-- Name: promotion_promotion_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_promotion_rule (
    promotion_id text NOT NULL,
    promotion_rule_id text NOT NULL
);


ALTER TABLE public.promotion_promotion_rule OWNER TO postgres;

--
-- Name: promotion_promotion_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_promotion_seller_seller (
    promotion_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_promotion_seller_seller OWNER TO postgres;

--
-- Name: promotion_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_rule (
    id text NOT NULL,
    description text,
    attribute text NOT NULL,
    operator text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT promotion_rule_operator_check CHECK ((operator = ANY (ARRAY['gte'::text, 'lte'::text, 'gt'::text, 'lt'::text, 'eq'::text, 'ne'::text, 'in'::text])))
);


ALTER TABLE public.promotion_rule OWNER TO postgres;

--
-- Name: promotion_rule_value; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion_rule_value (
    id text NOT NULL,
    promotion_rule_id text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.promotion_rule_value OWNER TO postgres;

--
-- Name: property_label; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_label (
    id text NOT NULL,
    entity text NOT NULL,
    property text NOT NULL,
    label text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.property_label OWNER TO postgres;

--
-- Name: provider_identity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_identity (
    id text NOT NULL,
    entity_id text NOT NULL,
    provider text NOT NULL,
    auth_identity_id text NOT NULL,
    user_metadata jsonb,
    provider_metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.provider_identity OWNER TO postgres;

--
-- Name: publishable_api_key_sales_channel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publishable_api_key_sales_channel (
    publishable_key_id character varying(255) NOT NULL,
    sales_channel_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.publishable_api_key_sales_channel OWNER TO postgres;

--
-- Name: rbac_policy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbac_policy (
    id text NOT NULL,
    key text NOT NULL,
    resource text NOT NULL,
    operation text NOT NULL,
    name text,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.rbac_policy OWNER TO postgres;

--
-- Name: rbac_role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbac_role (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.rbac_role OWNER TO postgres;

--
-- Name: rbac_role_parent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbac_role_parent (
    id text NOT NULL,
    role_id text NOT NULL,
    parent_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.rbac_role_parent OWNER TO postgres;

--
-- Name: rbac_role_policy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rbac_role_policy (
    id text NOT NULL,
    role_id text NOT NULL,
    policy_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.rbac_role_policy OWNER TO postgres;

--
-- Name: refund; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refund (
    id text NOT NULL,
    amount numeric NOT NULL,
    raw_amount jsonb NOT NULL,
    payment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text,
    metadata jsonb,
    refund_reason_id text,
    note text
);


ALTER TABLE public.refund OWNER TO postgres;

--
-- Name: refund_reason; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refund_reason (
    id text NOT NULL,
    label text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    code text NOT NULL
);


ALTER TABLE public.refund_reason OWNER TO postgres;

--
-- Name: region; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.region (
    id text NOT NULL,
    name text NOT NULL,
    currency_code text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    automatic_taxes boolean DEFAULT true NOT NULL
);


ALTER TABLE public.region OWNER TO postgres;

--
-- Name: region_country; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.region_country (
    iso_2 text NOT NULL,
    iso_3 text NOT NULL,
    num_code text NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    region_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.region_country OWNER TO postgres;

--
-- Name: region_payment_provider; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.region_payment_provider (
    region_id character varying(255) NOT NULL,
    payment_provider_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.region_payment_provider OWNER TO postgres;

--
-- Name: reservation_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservation_item (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    line_item_id text,
    location_id text NOT NULL,
    quantity numeric NOT NULL,
    external_id text,
    description text,
    created_by text,
    metadata jsonb,
    inventory_item_id text NOT NULL,
    allow_backorder boolean DEFAULT false,
    raw_quantity jsonb
);


ALTER TABLE public.reservation_item OWNER TO postgres;

--
-- Name: return; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return (
    id text NOT NULL,
    order_id text NOT NULL,
    claim_id text,
    exchange_id text,
    order_version integer NOT NULL,
    display_id integer NOT NULL,
    status public.return_status_enum DEFAULT 'open'::public.return_status_enum NOT NULL,
    no_notification boolean,
    refund_amount numeric,
    raw_refund_amount jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    received_at timestamp with time zone,
    canceled_at timestamp with time zone,
    location_id text,
    requested_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.return OWNER TO postgres;

--
-- Name: return_display_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.return_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.return_display_id_seq OWNER TO postgres;

--
-- Name: return_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.return_display_id_seq OWNED BY public.return.display_id;


--
-- Name: return_fulfillment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_fulfillment (
    return_id character varying(255) NOT NULL,
    fulfillment_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.return_fulfillment OWNER TO postgres;

--
-- Name: return_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_item (
    id text NOT NULL,
    return_id text NOT NULL,
    reason_id text,
    item_id text NOT NULL,
    quantity numeric NOT NULL,
    raw_quantity jsonb NOT NULL,
    received_quantity numeric DEFAULT 0 NOT NULL,
    raw_received_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL,
    note text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    damaged_quantity numeric DEFAULT 0 NOT NULL,
    raw_damaged_quantity jsonb DEFAULT '{"value": "0", "precision": 20}'::jsonb NOT NULL
);


ALTER TABLE public.return_item OWNER TO postgres;

--
-- Name: return_reason; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_reason (
    id character varying NOT NULL,
    value character varying NOT NULL,
    label character varying NOT NULL,
    description character varying,
    metadata jsonb,
    parent_return_reason_id character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.return_reason OWNER TO postgres;

--
-- Name: review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review (
    id text NOT NULL,
    display_id integer NOT NULL,
    reference text NOT NULL,
    rating integer NOT NULL,
    customer_note text,
    seller_note text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT review_reference_check CHECK ((reference = ANY (ARRAY['product'::text, 'seller'::text]))),
    CONSTRAINT review_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'published'::text, 'rejected'::text])))
);


ALTER TABLE public.review OWNER TO postgres;

--
-- Name: review_display_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_display_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_display_id_seq OWNER TO postgres;

--
-- Name: review_display_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_display_id_seq OWNED BY public.review.display_id;


--
-- Name: sales_channel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_channel (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    is_disabled boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.sales_channel OWNER TO postgres;

--
-- Name: sales_channel_stock_location; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_channel_stock_location (
    sales_channel_id character varying(255) NOT NULL,
    stock_location_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.sales_channel_stock_location OWNER TO postgres;

--
-- Name: script_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.script_migrations (
    id integer NOT NULL,
    script_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    finished_at timestamp with time zone
);


ALTER TABLE public.script_migrations OWNER TO postgres;

--
-- Name: script_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.script_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.script_migrations_id_seq OWNER TO postgres;

--
-- Name: script_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.script_migrations_id_seq OWNED BY public.script_migrations.id;


--
-- Name: seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller (
    id text NOT NULL,
    name text NOT NULL,
    handle text NOT NULL,
    email text NOT NULL,
    description text,
    logo text,
    banner text,
    website_url text,
    external_id text,
    currency_code text NOT NULL,
    status text DEFAULT 'pending_approval'::text NOT NULL,
    status_reason text,
    is_premium boolean DEFAULT false NOT NULL,
    closed_from timestamp with time zone,
    closed_to timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    closure_note text,
    phone text,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    CONSTRAINT seller_status_check CHECK ((status = ANY (ARRAY['open'::text, 'pending_approval'::text, 'suspended'::text, 'terminated'::text])))
);


ALTER TABLE public.seller OWNER TO postgres;

--
-- Name: seller_address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_address (
    id text NOT NULL,
    company text,
    first_name text,
    last_name text,
    address_1 text,
    address_2 text,
    city text,
    country_code text,
    province text,
    postal_code text,
    phone text,
    metadata jsonb,
    seller_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    name text
);


ALTER TABLE public.seller_address OWNER TO postgres;

--
-- Name: seller_member; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_member (
    id text NOT NULL,
    seller_id text NOT NULL,
    member_id text NOT NULL,
    role_id text,
    is_owner boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_member OWNER TO postgres;

--
-- Name: seller_seller_customer_customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_seller_customer_customer (
    seller_id character varying(255) NOT NULL,
    customer_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_seller_customer_customer OWNER TO postgres;

--
-- Name: seller_seller_fulfillment_fulfillment_set; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_seller_fulfillment_fulfillment_set (
    seller_id character varying(255) NOT NULL,
    fulfillment_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_seller_fulfillment_fulfillment_set OWNER TO postgres;

--
-- Name: seller_seller_fulfillment_service_zone; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_seller_fulfillment_service_zone (
    seller_id character varying(255) NOT NULL,
    service_zone_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_seller_fulfillment_service_zone OWNER TO postgres;

--
-- Name: seller_seller_payout_payout_account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_seller_payout_payout_account (
    seller_id character varying(255) NOT NULL,
    payout_account_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_seller_payout_payout_account OWNER TO postgres;

--
-- Name: seller_seller_review_review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_seller_review_review (
    seller_id character varying(255) NOT NULL,
    review_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_seller_review_review OWNER TO postgres;

--
-- Name: service_zone; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_zone (
    id text NOT NULL,
    name text NOT NULL,
    metadata jsonb,
    fulfillment_set_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.service_zone OWNER TO postgres;

--
-- Name: shipping_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_option (
    id text NOT NULL,
    name text NOT NULL,
    price_type text DEFAULT 'flat'::text NOT NULL,
    service_zone_id text NOT NULL,
    shipping_profile_id text,
    provider_id text,
    data jsonb,
    metadata jsonb,
    shipping_option_type_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT shipping_option_price_type_check CHECK ((price_type = ANY (ARRAY['calculated'::text, 'flat'::text])))
);


ALTER TABLE public.shipping_option OWNER TO postgres;

--
-- Name: shipping_option_price_set; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_option_price_set (
    shipping_option_id character varying(255) NOT NULL,
    price_set_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_option_price_set OWNER TO postgres;

--
-- Name: shipping_option_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_option_rule (
    id text NOT NULL,
    attribute text NOT NULL,
    operator text NOT NULL,
    value jsonb,
    shipping_option_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT shipping_option_rule_operator_check CHECK ((operator = ANY (ARRAY['in'::text, 'eq'::text, 'ne'::text, 'gt'::text, 'gte'::text, 'lt'::text, 'lte'::text, 'nin'::text])))
);


ALTER TABLE public.shipping_option_rule OWNER TO postgres;

--
-- Name: shipping_option_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_option_type (
    id text NOT NULL,
    label text NOT NULL,
    description text,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_option_type OWNER TO postgres;

--
-- Name: shipping_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_profile (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.shipping_profile OWNER TO postgres;

--
-- Name: stock_location; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_location (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    name text NOT NULL,
    address_id text,
    metadata jsonb
);


ALTER TABLE public.stock_location OWNER TO postgres;

--
-- Name: stock_location_address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_location_address (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    address_1 text NOT NULL,
    address_2 text,
    company text,
    city text,
    country_code text NOT NULL,
    phone text,
    province text,
    postal_code text,
    metadata jsonb
);


ALTER TABLE public.stock_location_address OWNER TO postgres;

--
-- Name: stock_location_stock_location_seller_seller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_location_stock_location_seller_seller (
    stock_location_id character varying(255) NOT NULL,
    seller_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.stock_location_stock_location_seller_seller OWNER TO postgres;

--
-- Name: store; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.store (
    id text NOT NULL,
    name text DEFAULT 'Medusa Store'::text NOT NULL,
    default_sales_channel_id text,
    default_region_id text,
    default_location_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store OWNER TO postgres;

--
-- Name: store_currency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.store_currency (
    id text NOT NULL,
    currency_code text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    store_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store_currency OWNER TO postgres;

--
-- Name: store_locale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.store_locale (
    id text NOT NULL,
    locale_code text NOT NULL,
    store_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.store_locale OWNER TO postgres;

--
-- Name: tax_provider; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_provider (
    id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_provider OWNER TO postgres;

--
-- Name: tax_rate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_rate (
    id text NOT NULL,
    rate real,
    code text NOT NULL,
    name text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_combinable boolean DEFAULT false NOT NULL,
    tax_region_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_rate OWNER TO postgres;

--
-- Name: tax_rate_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_rate_rule (
    id text NOT NULL,
    tax_rate_id text NOT NULL,
    reference_id text NOT NULL,
    reference text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tax_rate_rule OWNER TO postgres;

--
-- Name: tax_region; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_region (
    id text NOT NULL,
    provider_id text,
    country_code text NOT NULL,
    province_code text,
    parent_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    deleted_at timestamp with time zone,
    CONSTRAINT "CK_tax_region_country_top_level" CHECK (((parent_id IS NULL) OR (province_code IS NOT NULL))),
    CONSTRAINT "CK_tax_region_provider_top_level" CHECK (((parent_id IS NULL) OR (provider_id IS NULL)))
);


ALTER TABLE public.tax_region OWNER TO postgres;

--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id text NOT NULL,
    first_name text,
    last_name text,
    email text NOT NULL,
    avatar_url text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_preference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preference (
    id text NOT NULL,
    user_id text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_preference OWNER TO postgres;

--
-- Name: user_rbac_role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_rbac_role (
    user_id character varying(255) NOT NULL,
    rbac_role_id character varying(255) NOT NULL,
    id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_rbac_role OWNER TO postgres;

--
-- Name: view_configuration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.view_configuration (
    id text NOT NULL,
    entity text NOT NULL,
    name text,
    user_id text,
    is_system_default boolean DEFAULT false NOT NULL,
    configuration jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.view_configuration OWNER TO postgres;

--
-- Name: workflow_execution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_execution (
    id character varying NOT NULL,
    workflow_id character varying NOT NULL,
    transaction_id character varying NOT NULL,
    execution jsonb,
    context jsonb,
    state character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    retention_time integer,
    run_id text DEFAULT '01KYRT77KF2X72BAKM387X05SE'::text NOT NULL
);


ALTER TABLE public.workflow_execution OWNER TO postgres;

--
-- Name: link_module_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.link_module_migrations ALTER COLUMN id SET DEFAULT nextval('public.link_module_migrations_id_seq'::regclass);


--
-- Name: mikro_orm_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mikro_orm_migrations ALTER COLUMN id SET DEFAULT nextval('public.mikro_orm_migrations_id_seq'::regclass);


--
-- Name: order display_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order" ALTER COLUMN display_id SET DEFAULT nextval('public.order_display_id_seq'::regclass);


--
-- Name: order_change_action ordering; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_change_action ALTER COLUMN ordering SET DEFAULT nextval('public.order_change_action_ordering_seq'::regclass);


--
-- Name: order_claim display_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_claim ALTER COLUMN display_id SET DEFAULT nextval('public.order_claim_display_id_seq'::regclass);


--
-- Name: order_exchange display_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_exchange ALTER COLUMN display_id SET DEFAULT nextval('public.order_exchange_display_id_seq'::regclass);


--
-- Name: order_group display_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_group ALTER COLUMN display_id SET DEFAULT nextval('public.order_group_display_id_seq'::regclass);


--
-- Name: payout display_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout ALTER COLUMN display_id SET DEFAULT nextval('public.payout_display_id_seq'::regclass);


--
-- Name: product_change_action ordering; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_change_action ALTER COLUMN ordering SET DEFAULT nextval('public.product_change_action_ordering_seq'::regclass);


--
-- Name: return display_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return ALTER COLUMN display_id SET DEFAULT nextval('public.return_display_id_seq'::regclass);


--
-- Name: review display_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review ALTER COLUMN display_id SET DEFAULT nextval('public.review_display_id_seq'::regclass);


--
-- Name: script_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.script_migrations ALTER COLUMN id SET DEFAULT nextval('public.script_migrations_id_seq'::regclass);


--
-- Data for Name: account_holder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_holder (id, provider_id, external_id, email, data, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: api_key; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_key (id, token, salt, redacted, title, type, last_used_at, created_by, created_at, revoked_by, revoked_at, updated_at, deleted_at) FROM stdin;
apk_01KYRTC7JP69ZSA6XHVECX0B9W	pk_27ae68d146ee302001b9b9b4e6a224345c0ceb1d510207af678af16454779403		pk_27a***403	Default Publishable API Key	publishable	\N		2026-07-30 11:41:21.814+05:30	\N	\N	2026-07-30 11:41:21.814+05:30	\N
\.


--
-- Data for Name: application_method_buy_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_method_buy_rules (application_method_id, promotion_rule_id) FROM stdin;
\.


--
-- Data for Name: application_method_target_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_method_target_rules (application_method_id, promotion_rule_id) FROM stdin;
\.


--
-- Data for Name: auth_identity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_identity (id, app_metadata, created_at, updated_at, deleted_at) FROM stdin;
authid_01KYRTHYFPCYNHJBJ7CXERTFER	{"user_id": "user_01KYRTHYC4XESSF1DJ5M6XG0R0"}	2026-07-30 11:44:29.11+05:30	2026-07-30 11:44:29.125+05:30	\N
\.


--
-- Data for Name: auth_mfa_factor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_mfa_factor (id, auth_identity_id, provider, status, provider_metadata, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: auth_mfa_recovery_code; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_mfa_recovery_code (id, auth_identity_id, code_hash, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: auth_password_reset_token; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_password_reset_token (id, auth_identity_id, provider_identity_id, entity_id, token_hash, expires_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: auth_verification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_verification (id, auth_identity_id, entity_id, entity_type, code_provider, verified_at, requested_at, provider_metadata, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: capture; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.capture (id, amount, raw_amount, payment_id, created_at, updated_at, deleted_at, created_by, metadata) FROM stdin;
\.


--
-- Data for Name: cart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart (id, region_id, customer_id, sales_channel_id, email, currency_code, shipping_address_id, billing_address_id, metadata, created_at, updated_at, deleted_at, completed_at, locale) FROM stdin;
\.


--
-- Data for Name: cart_address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_address (id, customer_id, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_line_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_line_item (id, cart_id, title, subtitle, thumbnail, quantity, variant_id, product_id, product_title, product_description, product_subtitle, product_type, product_collection, product_handle, variant_sku, variant_barcode, variant_title, variant_option_values, requires_shipping, is_discountable, is_tax_inclusive, compare_at_unit_price, raw_compare_at_unit_price, unit_price, raw_unit_price, metadata, created_at, updated_at, deleted_at, product_type_id, is_custom_price, is_giftcard) FROM stdin;
\.


--
-- Data for Name: cart_line_item_adjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_line_item_adjustment (id, description, promotion_id, code, amount, raw_amount, provider_id, metadata, created_at, updated_at, deleted_at, item_id, is_tax_inclusive) FROM stdin;
\.


--
-- Data for Name: cart_line_item_offer_offer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_line_item_offer_offer (line_item_id, offer_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_line_item_tax_line; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_line_item_tax_line (id, description, tax_rate_id, code, rate, provider_id, metadata, created_at, updated_at, deleted_at, item_id) FROM stdin;
\.


--
-- Data for Name: cart_payment_collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_payment_collection (cart_id, payment_collection_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_promotion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_promotion (cart_id, promotion_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_shipping_method; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_shipping_method (id, cart_id, name, description, amount, raw_amount, is_tax_inclusive, shipping_option_id, data, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_shipping_method_adjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_shipping_method_adjustment (id, description, promotion_id, code, amount, raw_amount, provider_id, metadata, created_at, updated_at, deleted_at, shipping_method_id) FROM stdin;
\.


--
-- Data for Name: cart_shipping_method_tax_line; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_shipping_method_tax_line (id, description, tax_rate_id, code, rate, provider_id, metadata, created_at, updated_at, deleted_at, shipping_method_id) FROM stdin;
\.


--
-- Data for Name: commission_line; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commission_line (id, item_id, commission_rate_id, code, rate, amount, description, raw_amount, created_at, updated_at, deleted_at, shipping_method_id) FROM stdin;
\.


--
-- Data for Name: commission_rate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commission_rate (id, is_enabled, currency_code, name, code, type, value, include_tax, raw_value, created_at, updated_at, deleted_at, include_shipping, is_default) FROM stdin;
comrate_default	t	\N	Default	default	percentage	0	f	{"value": "0"}	2026-07-30 11:38:30.36918+05:30	2026-07-30 11:38:30.36918+05:30	\N	f	t
\.


--
-- Data for Name: commission_rate_value; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commission_rate_value (id, currency_code, amount, raw_amount, commission_rate_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: commission_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commission_rule (id, reference, reference_id, commission_rate_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: credit_line; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_line (id, cart_id, reference, reference_id, amount, raw_amount, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: currency; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.currency (code, symbol, symbol_native, decimal_digits, rounding, raw_rounding, name, created_at, updated_at, deleted_at) FROM stdin;
usd	$	$	2	0	{"value": "0", "precision": 20}	US Dollar	2026-07-30 11:38:44.653+05:30	2026-07-30 11:38:44.653+05:30	\N
cad	CA$	$	2	0	{"value": "0", "precision": 20}	Canadian Dollar	2026-07-30 11:38:44.654+05:30	2026-07-30 11:38:44.654+05:30	\N
eur	€	€	2	0	{"value": "0", "precision": 20}	Euro	2026-07-30 11:38:44.654+05:30	2026-07-30 11:38:44.654+05:30	\N
aed	AED	د.إ.‏	2	0	{"value": "0", "precision": 20}	United Arab Emirates Dirham	2026-07-30 11:38:44.654+05:30	2026-07-30 11:38:44.654+05:30	\N
afn	Af	؋	0	0	{"value": "0", "precision": 20}	Afghan Afghani	2026-07-30 11:38:44.654+05:30	2026-07-30 11:38:44.654+05:30	\N
all	ALL	Lek	0	0	{"value": "0", "precision": 20}	Albanian Lek	2026-07-30 11:38:44.654+05:30	2026-07-30 11:38:44.654+05:30	\N
amd	AMD	դր.	0	0	{"value": "0", "precision": 20}	Armenian Dram	2026-07-30 11:38:44.654+05:30	2026-07-30 11:38:44.654+05:30	\N
ars	AR$	$	2	0	{"value": "0", "precision": 20}	Argentine Peso	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
aud	AU$	$	2	0	{"value": "0", "precision": 20}	Australian Dollar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
azn	man.	ман.	2	0	{"value": "0", "precision": 20}	Azerbaijani Manat	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bam	KM	KM	2	0	{"value": "0", "precision": 20}	Bosnia-Herzegovina Convertible Mark	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bdt	Tk	৳	2	0	{"value": "0", "precision": 20}	Bangladeshi Taka	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bgn	BGN	лв.	2	0	{"value": "0", "precision": 20}	Bulgarian Lev	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bhd	BD	د.ب.‏	3	0	{"value": "0", "precision": 20}	Bahraini Dinar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bif	FBu	FBu	0	0	{"value": "0", "precision": 20}	Burundian Franc	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bnd	BN$	$	2	0	{"value": "0", "precision": 20}	Brunei Dollar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bob	Bs	Bs	2	0	{"value": "0", "precision": 20}	Bolivian Boliviano	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
brl	R$	R$	2	0	{"value": "0", "precision": 20}	Brazilian Real	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bwp	BWP	P	2	0	{"value": "0", "precision": 20}	Botswanan Pula	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
byn	Br	руб.	2	0	{"value": "0", "precision": 20}	Belarusian Ruble	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
bzd	BZ$	$	2	0	{"value": "0", "precision": 20}	Belize Dollar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
cdf	CDF	FrCD	2	0	{"value": "0", "precision": 20}	Congolese Franc	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
chf	CHF	CHF	2	0.05	{"value": "0.05", "precision": 20}	Swiss Franc	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
clp	CL$	$	0	0	{"value": "0", "precision": 20}	Chilean Peso	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
cny	CN¥	CN¥	2	0	{"value": "0", "precision": 20}	Chinese Yuan	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
cop	CO$	$	0	0	{"value": "0", "precision": 20}	Colombian Peso	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
crc	₡	₡	0	0	{"value": "0", "precision": 20}	Costa Rican Colón	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
cve	CV$	CV$	2	0	{"value": "0", "precision": 20}	Cape Verdean Escudo	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
czk	Kč	Kč	2	0	{"value": "0", "precision": 20}	Czech Republic Koruna	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
djf	Fdj	Fdj	0	0	{"value": "0", "precision": 20}	Djiboutian Franc	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
dkk	Dkr	kr	2	0	{"value": "0", "precision": 20}	Danish Krone	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
dop	RD$	RD$	2	0	{"value": "0", "precision": 20}	Dominican Peso	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
dzd	DA	د.ج.‏	2	0	{"value": "0", "precision": 20}	Algerian Dinar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
eek	Ekr	kr	2	0	{"value": "0", "precision": 20}	Estonian Kroon	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
egp	EGP	ج.م.‏	2	0	{"value": "0", "precision": 20}	Egyptian Pound	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
ern	Nfk	Nfk	2	0	{"value": "0", "precision": 20}	Eritrean Nakfa	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
etb	Br	Br	2	0	{"value": "0", "precision": 20}	Ethiopian Birr	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
gbp	£	£	2	0	{"value": "0", "precision": 20}	British Pound Sterling	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
gel	GEL	GEL	2	0	{"value": "0", "precision": 20}	Georgian Lari	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
ghs	GH₵	GH₵	2	0	{"value": "0", "precision": 20}	Ghanaian Cedi	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
gmd	D	D	2	0	{"value": "0", "precision": 20}	Gambian Dalasi	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
gnf	FG	FG	0	0	{"value": "0", "precision": 20}	Guinean Franc	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
gtq	GTQ	Q	2	0	{"value": "0", "precision": 20}	Guatemalan Quetzal	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
hkd	HK$	$	2	0	{"value": "0", "precision": 20}	Hong Kong Dollar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
hnl	HNL	L	2	0	{"value": "0", "precision": 20}	Honduran Lempira	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
hrk	kn	kn	2	0	{"value": "0", "precision": 20}	Croatian Kuna	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
huf	Ft	Ft	0	0	{"value": "0", "precision": 20}	Hungarian Forint	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
idr	Rp	Rp	0	0	{"value": "0", "precision": 20}	Indonesian Rupiah	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
ils	₪	₪	2	0	{"value": "0", "precision": 20}	Israeli New Sheqel	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
inr	Rs	₹	2	0	{"value": "0", "precision": 20}	Indian Rupee	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
iqd	IQD	د.ع.‏	0	0	{"value": "0", "precision": 20}	Iraqi Dinar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
irr	IRR	﷼	0	0	{"value": "0", "precision": 20}	Iranian Rial	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
isk	Ikr	kr	0	0	{"value": "0", "precision": 20}	Icelandic Króna	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
jmd	J$	$	2	0	{"value": "0", "precision": 20}	Jamaican Dollar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
jod	JD	د.أ.‏	3	0	{"value": "0", "precision": 20}	Jordanian Dinar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
jpy	¥	￥	0	0	{"value": "0", "precision": 20}	Japanese Yen	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
kes	Ksh	Ksh	2	0	{"value": "0", "precision": 20}	Kenyan Shilling	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
khr	KHR	៛	2	0	{"value": "0", "precision": 20}	Cambodian Riel	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
kmf	CF	FC	0	0	{"value": "0", "precision": 20}	Comorian Franc	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
krw	₩	₩	0	0	{"value": "0", "precision": 20}	South Korean Won	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
kwd	KD	د.ك.‏	3	0	{"value": "0", "precision": 20}	Kuwaiti Dinar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
kzt	KZT	тңг.	2	0	{"value": "0", "precision": 20}	Kazakhstani Tenge	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
lbp	LB£	ل.ل.‏	0	0	{"value": "0", "precision": 20}	Lebanese Pound	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
lkr	SLRs	SL Re	2	0	{"value": "0", "precision": 20}	Sri Lankan Rupee	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
ltl	Lt	Lt	2	0	{"value": "0", "precision": 20}	Lithuanian Litas	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
lvl	Ls	Ls	2	0	{"value": "0", "precision": 20}	Latvian Lats	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
lyd	LD	د.ل.‏	3	0	{"value": "0", "precision": 20}	Libyan Dinar	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
mad	MAD	د.م.‏	2	0	{"value": "0", "precision": 20}	Moroccan Dirham	2026-07-30 11:38:44.655+05:30	2026-07-30 11:38:44.655+05:30	\N
mdl	MDL	MDL	2	0	{"value": "0", "precision": 20}	Moldovan Leu	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mga	MGA	MGA	0	0	{"value": "0", "precision": 20}	Malagasy Ariary	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mkd	MKD	MKD	2	0	{"value": "0", "precision": 20}	Macedonian Denar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mmk	MMK	K	0	0	{"value": "0", "precision": 20}	Myanma Kyat	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mnt	MNT	₮	0	0	{"value": "0", "precision": 20}	Mongolian Tugrig	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mop	MOP$	MOP$	2	0	{"value": "0", "precision": 20}	Macanese Pataca	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mur	MURs	MURs	0	0	{"value": "0", "precision": 20}	Mauritian Rupee	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mwk	K	K	2	0	{"value": "0", "precision": 20}	Malawian Kwacha	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mxn	MX$	$	2	0	{"value": "0", "precision": 20}	Mexican Peso	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
myr	RM	RM	2	0	{"value": "0", "precision": 20}	Malaysian Ringgit	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
mzn	MTn	MTn	2	0	{"value": "0", "precision": 20}	Mozambican Metical	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
nad	N$	N$	2	0	{"value": "0", "precision": 20}	Namibian Dollar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
ngn	₦	₦	2	0	{"value": "0", "precision": 20}	Nigerian Naira	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
nio	C$	C$	2	0	{"value": "0", "precision": 20}	Nicaraguan Córdoba	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
nok	Nkr	kr	2	0	{"value": "0", "precision": 20}	Norwegian Krone	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
npr	NPRs	नेरू	2	0	{"value": "0", "precision": 20}	Nepalese Rupee	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
nzd	NZ$	$	2	0	{"value": "0", "precision": 20}	New Zealand Dollar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
omr	OMR	ر.ع.‏	3	0	{"value": "0", "precision": 20}	Omani Rial	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
pab	B/.	B/.	2	0	{"value": "0", "precision": 20}	Panamanian Balboa	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
pen	S/.	S/.	2	0	{"value": "0", "precision": 20}	Peruvian Nuevo Sol	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
php	₱	₱	2	0	{"value": "0", "precision": 20}	Philippine Peso	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
pkr	PKRs	₨	0	0	{"value": "0", "precision": 20}	Pakistani Rupee	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
pln	zł	zł	2	0	{"value": "0", "precision": 20}	Polish Zloty	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
pyg	₲	₲	0	0	{"value": "0", "precision": 20}	Paraguayan Guarani	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
qar	QR	ر.ق.‏	2	0	{"value": "0", "precision": 20}	Qatari Rial	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
ron	RON	RON	2	0	{"value": "0", "precision": 20}	Romanian Leu	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
rsd	din.	дин.	0	0	{"value": "0", "precision": 20}	Serbian Dinar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
rub	RUB	₽.	2	0	{"value": "0", "precision": 20}	Russian Ruble	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
rwf	RWF	FR	0	0	{"value": "0", "precision": 20}	Rwandan Franc	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
sar	SR	ر.س.‏	2	0	{"value": "0", "precision": 20}	Saudi Riyal	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
sdg	SDG	SDG	2	0	{"value": "0", "precision": 20}	Sudanese Pound	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
sek	Skr	kr	2	0	{"value": "0", "precision": 20}	Swedish Krona	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
sgd	S$	$	2	0	{"value": "0", "precision": 20}	Singapore Dollar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
sos	Ssh	Ssh	0	0	{"value": "0", "precision": 20}	Somali Shilling	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
syp	SY£	ل.س.‏	0	0	{"value": "0", "precision": 20}	Syrian Pound	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
thb	฿	฿	2	0	{"value": "0", "precision": 20}	Thai Baht	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
tnd	DT	د.ت.‏	3	0	{"value": "0", "precision": 20}	Tunisian Dinar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
top	T$	T$	2	0	{"value": "0", "precision": 20}	Tongan Paʻanga	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
tjs	TJS	с.	2	0	{"value": "0", "precision": 20}	Tajikistani Somoni	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
try	₺	₺	2	0	{"value": "0", "precision": 20}	Turkish Lira	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
ttd	TT$	$	2	0	{"value": "0", "precision": 20}	Trinidad and Tobago Dollar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
twd	NT$	NT$	2	0	{"value": "0", "precision": 20}	New Taiwan Dollar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
tzs	TSh	TSh	0	0	{"value": "0", "precision": 20}	Tanzanian Shilling	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
uah	₴	₴	2	0	{"value": "0", "precision": 20}	Ukrainian Hryvnia	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
ugx	USh	USh	0	0	{"value": "0", "precision": 20}	Ugandan Shilling	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
uyu	$U	$	2	0	{"value": "0", "precision": 20}	Uruguayan Peso	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
uzs	UZS	UZS	0	0	{"value": "0", "precision": 20}	Uzbekistan Som	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
vef	Bs.F.	Bs.F.	2	0	{"value": "0", "precision": 20}	Venezuelan Bolívar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
vnd	₫	₫	0	0	{"value": "0", "precision": 20}	Vietnamese Dong	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
xaf	FCFA	FCFA	0	0	{"value": "0", "precision": 20}	CFA Franc BEAC	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
xof	CFA	CFA	0	0	{"value": "0", "precision": 20}	CFA Franc BCEAO	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
xpf	₣	₣	0	0	{"value": "0", "precision": 20}	CFP Franc	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
yer	YR	ر.ي.‏	0	0	{"value": "0", "precision": 20}	Yemeni Rial	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
zar	R	R	2	0	{"value": "0", "precision": 20}	South African Rand	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
zmk	ZK	ZK	0	0	{"value": "0", "precision": 20}	Zambian Kwacha	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
zwl	ZWL$	ZWL$	0	0	{"value": "0", "precision": 20}	Zimbabwean Dollar	2026-07-30 11:38:44.656+05:30	2026-07-30 11:38:44.656+05:30	\N
\.


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer (id, company_name, first_name, last_name, email, phone, has_account, metadata, created_at, updated_at, deleted_at, created_by) FROM stdin;
\.


--
-- Data for Name: customer_account_holder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_account_holder (customer_id, account_holder_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: customer_address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_address (id, customer_id, address_name, is_default_shipping, is_default_billing, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: customer_customer_group_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_customer_group_seller_seller (customer_group_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: customer_customer_review_review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_customer_review_review (customer_id, review_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: customer_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_group (id, name, metadata, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: customer_group_customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_group_customer (id, customer_id, customer_group_id, metadata, created_at, updated_at, created_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fulfillment (id, location_id, packed_at, shipped_at, delivered_at, canceled_at, data, provider_id, shipping_option_id, metadata, delivery_address_id, created_at, updated_at, deleted_at, marked_shipped_by, created_by, requires_shipping) FROM stdin;
\.


--
-- Data for Name: fulfillment_address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fulfillment_address (id, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fulfillment_item (id, title, sku, barcode, quantity, raw_quantity, line_item_id, inventory_item_id, fulfillment_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment_label; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fulfillment_label (id, tracking_number, tracking_url, label_url, fulfillment_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment_provider; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fulfillment_provider (id, is_enabled, created_at, updated_at, deleted_at) FROM stdin;
manual_manual	t	2026-07-30 11:38:44.749+05:30	2026-07-30 11:38:44.749+05:30	\N
\.


--
-- Data for Name: fulfillment_set; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fulfillment_set (id, name, type, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment_shipping_option_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fulfillment_shipping_option_seller_seller (shipping_option_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: fulfillment_shipping_profile_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fulfillment_shipping_profile_seller_seller (shipping_profile_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: geo_zone; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.geo_zone (id, type, country_code, province_code, city, service_zone_id, postal_expression, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.image (id, url, metadata, created_at, updated_at, deleted_at, rank, product_id) FROM stdin;
\.


--
-- Data for Name: inventory_inventory_item_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_inventory_item_seller_seller (inventory_item_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: inventory_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_item (id, created_at, updated_at, deleted_at, sku, origin_country, hs_code, mid_code, material, weight, length, height, width, requires_shipping, description, title, thumbnail, metadata) FROM stdin;
\.


--
-- Data for Name: inventory_level; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_level (id, created_at, updated_at, deleted_at, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, metadata, raw_stocked_quantity, raw_reserved_quantity, raw_incoming_quantity) FROM stdin;
\.


--
-- Data for Name: invite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invite (id, email, accepted, token, expires_at, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: invite_rbac_role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invite_rbac_role (invite_id, rbac_role_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: layout_configuration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.layout_configuration (id, zone, user_id, is_system_default, configuration, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: link_module_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.link_module_migrations (id, table_name, link_descriptor, created_at) FROM stdin;
1	cart_payment_collection	{"toModel": "payment_collection", "toModule": "payment", "fromModel": "cart", "fromModule": "cart"}	2026-07-30 11:38:38.858787
2	cart_promotion	{"toModel": "promotions", "toModule": "promotion", "fromModel": "cart", "fromModule": "cart"}	2026-07-30 11:38:38.880063
3	customer_account_holder	{"toModel": "account_holder", "toModule": "payment", "fromModel": "customer", "fromModule": "customer"}	2026-07-30 11:38:38.894265
4	location_fulfillment_provider	{"toModel": "fulfillment_provider", "toModule": "fulfillment", "fromModel": "location", "fromModule": "stock_location"}	2026-07-30 11:38:38.907365
5	location_fulfillment_set	{"toModel": "fulfillment_set", "toModule": "fulfillment", "fromModel": "location", "fromModule": "stock_location"}	2026-07-30 11:38:38.919715
6	invite_rbac_role	{"toModel": "rbac_role", "toModule": "rbac", "fromModel": "invite", "fromModule": "user"}	2026-07-30 11:38:38.934446
7	order_cart	{"toModel": "cart", "toModule": "cart", "fromModel": "order", "fromModule": "order"}	2026-07-30 11:38:38.949241
8	order_fulfillment	{"toModel": "fulfillments", "toModule": "fulfillment", "fromModel": "order", "fromModule": "order"}	2026-07-30 11:38:38.965558
9	order_payment_collection	{"toModel": "payment_collection", "toModule": "payment", "fromModel": "order", "fromModule": "order"}	2026-07-30 11:38:38.981512
10	order_promotion	{"toModel": "promotions", "toModule": "promotion", "fromModel": "order", "fromModule": "order"}	2026-07-30 11:38:38.997415
11	return_fulfillment	{"toModel": "fulfillments", "toModule": "fulfillment", "fromModel": "return", "fromModule": "order"}	2026-07-30 11:38:39.012423
12	product_sales_channel	{"toModel": "sales_channel", "toModule": "sales_channel", "fromModel": "product", "fromModule": "product"}	2026-07-30 11:38:39.026513
13	product_shipping_profile	{"toModel": "shipping_profile", "toModule": "fulfillment", "fromModel": "product", "fromModule": "product"}	2026-07-30 11:38:39.0453
14	product_variant_inventory_item	{"toModel": "inventory", "toModule": "inventory", "fromModel": "variant", "fromModule": "product"}	2026-07-30 11:38:39.060183
15	product_variant_price_set	{"toModel": "price_set", "toModule": "pricing", "fromModel": "variant", "fromModule": "product"}	2026-07-30 11:38:39.07567
16	publishable_api_key_sales_channel	{"toModel": "sales_channel", "toModule": "sales_channel", "fromModel": "api_key", "fromModule": "api_key"}	2026-07-30 11:38:39.090017
17	region_payment_provider	{"toModel": "payment_provider", "toModule": "payment", "fromModel": "region", "fromModule": "region"}	2026-07-30 11:38:39.104049
18	sales_channel_stock_location	{"toModel": "location", "toModule": "stock_location", "fromModel": "sales_channel", "fromModule": "sales_channel"}	2026-07-30 11:38:39.118417
19	shipping_option_price_set	{"toModel": "price_set", "toModule": "pricing", "fromModel": "shipping_option", "fromModule": "fulfillment"}	2026-07-30 11:38:39.134566
20	user_rbac_role	{"toModel": "rbac_role", "toModule": "rbac", "fromModel": "user", "fromModule": "user"}	2026-07-30 11:38:39.148427
21	promotion_campaign_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "campaign", "fromModule": "promotion"}	2026-07-30 11:38:39.162356
22	cart_line_item_offer_offer	{"toModel": "offer", "toModule": "offer", "fromModel": "line_item", "fromModule": "cart"}	2026-07-30 11:38:39.175813
23	product_product_category_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "product_category", "fromModule": "product"}	2026-07-30 11:38:39.190742
24	customer_customer_review_review	{"toModel": "review", "toModule": "review", "fromModel": "customer", "fromModule": "customer"}	2026-07-30 11:38:39.204805
25	seller_seller_fulfillment_fulfillment_set	{"toModel": "fulfillment_set", "toModule": "fulfillment", "fromModel": "seller", "fromModule": "seller"}	2026-07-30 11:38:39.219016
26	inventory_inventory_item_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "inventory_item", "fromModule": "inventory"}	2026-07-30 11:38:39.238567
27	product_product_category_media_media_image	{"toModel": "media_image", "toModule": "media", "fromModel": "product_category", "fromModule": "product"}	2026-07-30 11:38:39.253646
28	product_product_collection_media_media_image	{"toModel": "media_image", "toModule": "media", "fromModel": "product_collection", "fromModule": "product"}	2026-07-30 11:38:39.26767
29	offer_inventory_item	{"toModel": "inventory_item", "toModule": "inventory", "fromModel": "offer", "fromModule": "offer"}	2026-07-30 11:38:39.280653
30	offer_offer_pricing_price	{"toModel": "price", "toModule": "pricing", "fromModel": "offer", "fromModule": "offer"}	2026-07-30 11:38:39.294402
31	order_group_order	{"toModel": "order", "toModule": "order", "fromModel": "order_group", "fromModule": "seller"}	2026-07-30 11:38:39.30805
32	order_order_line_item_offer_offer	{"toModel": "offer", "toModule": "offer", "fromModel": "order_line_item", "fromModule": "order"}	2026-07-30 11:38:39.323431
33	order_order_payout_payout	{"toModel": "payout", "toModule": "payout", "fromModel": "order", "fromModule": "order"}	2026-07-30 11:38:39.339185
34	order_order_review_review	{"toModel": "review", "toModule": "review", "fromModel": "order", "fromModule": "order"}	2026-07-30 11:38:39.353376
35	order_order_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "order", "fromModule": "order"}	2026-07-30 11:38:39.367567
36	payout_payout_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "payout", "fromModule": "payout"}	2026-07-30 11:38:39.382111
37	pricing_price_list_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "price_list", "fromModule": "pricing"}	2026-07-30 11:38:39.397014
38	product_category_attribute	{"toModel": "categories", "toModule": "product", "fromModel": "product_attribute", "fromModule": "product_attribute"}	2026-07-30 11:38:39.414303
39	product_attribute_value_link	{"toModel": "product_attribute_value", "toModule": "product_attribute", "fromModel": "product", "fromModule": "product"}	2026-07-30 11:38:39.429201
40	product_product_review_review	{"toModel": "review", "toModule": "review", "fromModel": "product", "fromModule": "product"}	2026-07-30 11:38:39.444132
41	product_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "product", "fromModule": "product"}	2026-07-30 11:38:39.459745
42	promotion_promotion_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "promotion", "fromModule": "promotion"}	2026-07-30 11:38:39.474261
43	customer_customer_group_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "customer_group", "fromModule": "customer"}	2026-07-30 11:38:39.487977
44	seller_seller_customer_customer	{"toModel": "customer", "toModule": "customer", "fromModel": "seller", "fromModule": "seller"}	2026-07-30 11:38:39.502012
45	seller_seller_payout_payout_account	{"toModel": "payout_account", "toModule": "payout", "fromModel": "seller", "fromModule": "seller"}	2026-07-30 11:38:39.515864
46	seller_seller_review_review	{"toModel": "review", "toModule": "review", "fromModel": "seller", "fromModule": "seller"}	2026-07-30 11:38:39.530563
47	seller_seller_fulfillment_service_zone	{"toModel": "service_zone", "toModule": "fulfillment", "fromModel": "seller", "fromModule": "seller"}	2026-07-30 11:38:39.54422
48	fulfillment_shipping_option_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "shipping_option", "fromModule": "fulfillment"}	2026-07-30 11:38:39.558661
49	fulfillment_shipping_profile_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "shipping_profile", "fromModule": "fulfillment"}	2026-07-30 11:38:39.572612
50	stock_location_stock_location_seller_seller	{"toModel": "seller", "toModule": "seller", "fromModel": "stock_location", "fromModule": "stock_location"}	2026-07-30 11:38:39.587474
\.


--
-- Data for Name: location_fulfillment_provider; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.location_fulfillment_provider (stock_location_id, fulfillment_provider_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: location_fulfillment_set; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.location_fulfillment_set (stock_location_id, fulfillment_set_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: media_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_image (id, url, type, is_thumbnail, is_banner, rank, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.member (id, email, locale, is_active, metadata, created_at, updated_at, deleted_at, first_name, last_name) FROM stdin;
\.


--
-- Data for Name: member_invite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.member_invite (id, email, token, accepted, expires_at, role_id, seller_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: mikro_orm_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mikro_orm_migrations (id, name, executed_at) FROM stdin;
1	Migration20260130132817	2026-07-30 11:38:30.36918+05:30
2	Migration20260615120000	2026-07-30 11:38:30.36918+05:30
3	Migration20260616000000	2026-07-30 11:38:30.611639+05:30
4	Migration20260520104835	2026-07-30 11:38:30.731038+05:30
5	Migration20260526000000	2026-07-30 11:38:30.731038+05:30
6	Migration20260622000000	2026-07-30 11:38:30.731038+05:30
7	Migration20260130132816	2026-07-30 11:38:30.876693+05:30
8	Migration20260216152209	2026-07-30 11:38:30.876693+05:30
9	Migration20260317000000	2026-07-30 11:38:30.876693+05:30
10	Migration20260323170925	2026-07-30 11:38:30.876693+05:30
11	Migration20260601000000	2026-07-30 11:38:31.066739+05:30
12	Migration20260601000001	2026-07-30 11:38:31.066739+05:30
13	Migration20260601000002	2026-07-30 11:38:31.066739+05:30
14	Migration20260601130000	2026-07-30 11:38:31.204543+05:30
15	Migration20260722120000	2026-07-30 11:38:31.345692+05:30
16	Migration20260729120000	2026-07-30 11:38:31.471426+05:30
17	Migration20260324104737	2026-07-30 11:38:31.584316+05:30
18	Migration20260330093053	2026-07-30 11:38:31.584316+05:30
19	Migration20260331113435	2026-07-30 11:38:31.584316+05:30
20	Migration20260401093720	2026-07-30 11:38:31.584316+05:30
21	Migration20260410120000	2026-07-30 11:38:31.584316+05:30
22	Migration20260414123048	2026-07-30 11:38:31.584316+05:30
23	Migration20260421102419	2026-07-30 11:38:31.584316+05:30
24	Migration20260422130000	2026-07-30 11:38:31.584316+05:30
25	Migration20260422140000	2026-07-30 11:38:31.584316+05:30
26	Migration20260427100000	2026-07-30 11:38:31.584316+05:30
27	Migration20260616120000	2026-07-30 11:38:31.584316+05:30
28	Migration20240307161216	2026-07-30 11:38:31.904023+05:30
29	Migration20241210073813	2026-07-30 11:38:31.904023+05:30
30	Migration20250106142624	2026-07-30 11:38:31.904023+05:30
31	Migration20250120110820	2026-07-30 11:38:31.904023+05:30
32	Migration20240307132720	2026-07-30 11:38:32.049175+05:30
33	Migration20240719123015	2026-07-30 11:38:32.049175+05:30
34	Migration20241213063611	2026-07-30 11:38:32.049175+05:30
35	Migration20251010131115	2026-07-30 11:38:32.049175+05:30
36	InitialSetup20240401153642	2026-07-30 11:38:32.283893+05:30
37	Migration20240601111544	2026-07-30 11:38:32.283893+05:30
38	Migration202408271511	2026-07-30 11:38:32.283893+05:30
39	Migration20241122120331	2026-07-30 11:38:32.283893+05:30
40	Migration20241125090957	2026-07-30 11:38:32.283893+05:30
41	Migration20250411073236	2026-07-30 11:38:32.283893+05:30
42	Migration20250516081326	2026-07-30 11:38:32.283893+05:30
43	Migration20250910154539	2026-07-30 11:38:32.283893+05:30
44	Migration20250911092221	2026-07-30 11:38:32.283893+05:30
45	Migration20250929204438	2026-07-30 11:38:32.283893+05:30
46	Migration20251008132218	2026-07-30 11:38:32.283893+05:30
47	Migration20251011090511	2026-07-30 11:38:32.283893+05:30
48	Migration20251022153442	2026-07-30 11:38:32.283893+05:30
49	Migration20251029150809	2026-07-30 11:38:32.283893+05:30
50	Migration20251110180907	2026-07-30 11:38:32.283893+05:30
51	Migration20251113183352	2026-07-30 11:38:32.283893+05:30
52	Migration20260224120000	2026-07-30 11:38:32.283893+05:30
53	Migration20260301002050	2026-07-30 11:38:32.283893+05:30
54	Migration20260306120000	2026-07-30 11:38:32.283893+05:30
55	Migration20230929122253	2026-07-30 11:38:32.981532+05:30
56	Migration20240322094407	2026-07-30 11:38:32.981532+05:30
57	Migration20240322113359	2026-07-30 11:38:32.981532+05:30
58	Migration20240322120125	2026-07-30 11:38:32.981532+05:30
59	Migration20240626133555	2026-07-30 11:38:32.981532+05:30
60	Migration20240704094505	2026-07-30 11:38:32.981532+05:30
61	Migration20241127114534	2026-07-30 11:38:32.981532+05:30
62	Migration20241127223829	2026-07-30 11:38:32.981532+05:30
63	Migration20241128055359	2026-07-30 11:38:32.981532+05:30
64	Migration20241212190401	2026-07-30 11:38:32.981532+05:30
65	Migration20250408145122	2026-07-30 11:38:32.981532+05:30
66	Migration20250409122219	2026-07-30 11:38:32.981532+05:30
67	Migration20251009110625	2026-07-30 11:38:32.981532+05:30
68	Migration20251112192723	2026-07-30 11:38:32.981532+05:30
69	Migration20260429163502	2026-07-30 11:38:32.981532+05:30
70	Migration20240227120221	2026-07-30 11:38:33.369825+05:30
71	Migration20240617102917	2026-07-30 11:38:33.369825+05:30
72	Migration20240624153824	2026-07-30 11:38:33.369825+05:30
73	Migration20241211061114	2026-07-30 11:38:33.369825+05:30
74	Migration20250113094144	2026-07-30 11:38:33.369825+05:30
75	Migration20250120110700	2026-07-30 11:38:33.369825+05:30
76	Migration20250226130616	2026-07-30 11:38:33.369825+05:30
77	Migration20250508081510	2026-07-30 11:38:33.369825+05:30
78	Migration20250828075407	2026-07-30 11:38:33.369825+05:30
79	Migration20250909083125	2026-07-30 11:38:33.369825+05:30
80	Migration20250916120552	2026-07-30 11:38:33.369825+05:30
81	Migration20250917143818	2026-07-30 11:38:33.369825+05:30
82	Migration20250919122137	2026-07-30 11:38:33.369825+05:30
83	Migration20251006000000	2026-07-30 11:38:33.369825+05:30
84	Migration20251015113934	2026-07-30 11:38:33.369825+05:30
85	Migration20251107050148	2026-07-30 11:38:33.369825+05:30
86	Migration20240124154000	2026-07-30 11:38:33.729482+05:30
87	Migration20240524123112	2026-07-30 11:38:33.729482+05:30
88	Migration20240602110946	2026-07-30 11:38:33.729482+05:30
89	Migration20241211074630	2026-07-30 11:38:33.729482+05:30
90	Migration20251010130829	2026-07-30 11:38:33.729482+05:30
91	Migration20240115152146	2026-07-30 11:38:33.918496+05:30
92	Migration20240222170223	2026-07-30 11:38:34.036027+05:30
93	Migration20240831125857	2026-07-30 11:38:34.036027+05:30
94	Migration20241106085918	2026-07-30 11:38:34.036027+05:30
95	Migration20241205095237	2026-07-30 11:38:34.036027+05:30
96	Migration20241216183049	2026-07-30 11:38:34.036027+05:30
97	Migration20241218091938	2026-07-30 11:38:34.036027+05:30
98	Migration20250120115059	2026-07-30 11:38:34.036027+05:30
99	Migration20250212131240	2026-07-30 11:38:34.036027+05:30
100	Migration20250326151602	2026-07-30 11:38:34.036027+05:30
101	Migration20250508081553	2026-07-30 11:38:34.036027+05:30
102	Migration20251017153909	2026-07-30 11:38:34.036027+05:30
103	Migration20251208130704	2026-07-30 11:38:34.036027+05:30
104	Migration20240205173216	2026-07-30 11:38:34.349249+05:30
105	Migration20240624200006	2026-07-30 11:38:34.349249+05:30
106	Migration20250120110744	2026-07-30 11:38:34.349249+05:30
107	InitialSetup20240221144943	2026-07-30 11:38:34.52579+05:30
108	Migration20240604080145	2026-07-30 11:38:34.52579+05:30
109	Migration20241205122700	2026-07-30 11:38:34.52579+05:30
110	Migration20251015123842	2026-07-30 11:38:34.52579+05:30
111	InitialSetup20240227075933	2026-07-30 11:38:34.664519+05:30
112	Migration20240621145944	2026-07-30 11:38:34.664519+05:30
113	Migration20241206083313	2026-07-30 11:38:34.664519+05:30
114	Migration20251202184737	2026-07-30 11:38:34.664519+05:30
115	Migration20251212161429	2026-07-30 11:38:34.664519+05:30
116	Migration20240227090331	2026-07-30 11:38:34.820129+05:30
117	Migration20240710135844	2026-07-30 11:38:34.820129+05:30
118	Migration20240924114005	2026-07-30 11:38:34.820129+05:30
119	Migration20241212052837	2026-07-30 11:38:34.820129+05:30
120	InitialSetup20240228133303	2026-07-30 11:38:35.005382+05:30
121	Migration20240624082354	2026-07-30 11:38:35.005382+05:30
122	Migration20240225134525	2026-07-30 11:38:35.133951+05:30
123	Migration20240806072619	2026-07-30 11:38:35.133951+05:30
124	Migration20241211151053	2026-07-30 11:38:35.133951+05:30
125	Migration20250115160517	2026-07-30 11:38:35.133951+05:30
126	Migration20250120110552	2026-07-30 11:38:35.133951+05:30
127	Migration20250123122334	2026-07-30 11:38:35.133951+05:30
128	Migration20250206105639	2026-07-30 11:38:35.133951+05:30
129	Migration20250207132723	2026-07-30 11:38:35.133951+05:30
130	Migration20250625084134	2026-07-30 11:38:35.133951+05:30
131	Migration20250924135437	2026-07-30 11:38:35.133951+05:30
132	Migration20250929124701	2026-07-30 11:38:35.133951+05:30
133	Migration20260411223700	2026-07-30 11:38:35.133951+05:30
134	Migration20240219102530	2026-07-30 11:38:35.40905+05:30
135	Migration20240604100512	2026-07-30 11:38:35.40905+05:30
136	Migration20240715102100	2026-07-30 11:38:35.40905+05:30
137	Migration20240715174100	2026-07-30 11:38:35.40905+05:30
138	Migration20240716081800	2026-07-30 11:38:35.40905+05:30
139	Migration20240801085921	2026-07-30 11:38:35.40905+05:30
140	Migration20240821164505	2026-07-30 11:38:35.40905+05:30
141	Migration20240821170920	2026-07-30 11:38:35.40905+05:30
142	Migration20240827133639	2026-07-30 11:38:35.40905+05:30
143	Migration20240902195921	2026-07-30 11:38:35.40905+05:30
144	Migration20240913092514	2026-07-30 11:38:35.40905+05:30
145	Migration20240930122627	2026-07-30 11:38:35.40905+05:30
146	Migration20241014142943	2026-07-30 11:38:35.40905+05:30
147	Migration20241106085223	2026-07-30 11:38:35.40905+05:30
148	Migration20241129124827	2026-07-30 11:38:35.40905+05:30
149	Migration20241217162224	2026-07-30 11:38:35.40905+05:30
150	Migration20250326151554	2026-07-30 11:38:35.40905+05:30
151	Migration20250522181137	2026-07-30 11:38:35.40905+05:30
152	Migration20250702095353	2026-07-30 11:38:35.40905+05:30
153	Migration20250704120229	2026-07-30 11:38:35.40905+05:30
154	Migration20250910130000	2026-07-30 11:38:35.40905+05:30
155	Migration20251016160403	2026-07-30 11:38:35.40905+05:30
156	Migration20251016182939	2026-07-30 11:38:35.40905+05:30
157	Migration20251017155709	2026-07-30 11:38:35.40905+05:30
158	Migration20251114100559	2026-07-30 11:38:35.40905+05:30
159	Migration20251125164002	2026-07-30 11:38:35.40905+05:30
160	Migration20251210112909	2026-07-30 11:38:35.40905+05:30
161	Migration20251210112924	2026-07-30 11:38:35.40905+05:30
162	Migration20251225120947	2026-07-30 11:38:35.40905+05:30
163	Migration20260106185528	2026-07-30 11:38:35.40905+05:30
164	Migration20250717162007	2026-07-30 11:38:36.183706+05:30
165	Migration20260127081758	2026-07-30 11:38:36.183706+05:30
166	Migration20260615151246	2026-07-30 11:38:36.183706+05:30
167	Migration20251219163509	2026-07-30 11:38:36.349988+05:30
168	Migration20240205025928	2026-07-30 11:38:36.505081+05:30
169	Migration20240529080336	2026-07-30 11:38:36.505081+05:30
170	Migration20241202100304	2026-07-30 11:38:36.505081+05:30
171	Migration20260514083900	2026-07-30 11:38:36.505081+05:30
172	Migration20260525090000	2026-07-30 11:38:36.505081+05:30
173	Migration20260604120000	2026-07-30 11:38:36.505081+05:30
174	Migration20260616075929	2026-07-30 11:38:36.505081+05:30
175	Migration20240214033943	2026-07-30 11:38:36.895728+05:30
176	Migration20240703095850	2026-07-30 11:38:36.895728+05:30
177	Migration20241202103352	2026-07-30 11:38:36.895728+05:30
178	Migration20240311145700_InitialSetupMigration	2026-07-30 11:38:37.054177+05:30
179	Migration20240821170957	2026-07-30 11:38:37.054177+05:30
180	Migration20240917161003	2026-07-30 11:38:37.054177+05:30
181	Migration20241217110416	2026-07-30 11:38:37.054177+05:30
182	Migration20250113122235	2026-07-30 11:38:37.054177+05:30
183	Migration20250120115002	2026-07-30 11:38:37.054177+05:30
184	Migration20250822130931	2026-07-30 11:38:37.054177+05:30
185	Migration20250825132614	2026-07-30 11:38:37.054177+05:30
186	Migration20251114133146	2026-07-30 11:38:37.054177+05:30
187	Migration20240509083918_InitialSetupMigration	2026-07-30 11:38:37.483512+05:30
188	Migration20240628075401	2026-07-30 11:38:37.483512+05:30
189	Migration20240830094712	2026-07-30 11:38:37.483512+05:30
190	Migration20250120110514	2026-07-30 11:38:37.483512+05:30
191	Migration20251028172715	2026-07-30 11:38:37.483512+05:30
192	Migration20251121123942	2026-07-30 11:38:37.483512+05:30
193	Migration20251121150408	2026-07-30 11:38:37.483512+05:30
194	Migration20231228143900	2026-07-30 11:38:37.873617+05:30
195	Migration20241206123341	2026-07-30 11:38:37.873617+05:30
196	Migration20250120111059	2026-07-30 11:38:37.873617+05:30
197	Migration20250128174354	2026-07-30 11:38:37.873617+05:30
198	Migration20250505101505	2026-07-30 11:38:37.873617+05:30
199	Migration20250819110923	2026-07-30 11:38:37.873617+05:30
200	Migration20250819110924	2026-07-30 11:38:37.873617+05:30
201	Migration20250908080326	2026-07-30 11:38:37.873617+05:30
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification (id, "to", channel, template, data, trigger_type, resource_id, resource_type, receiver_id, original_notification_id, idempotency_key, external_id, provider_id, created_at, updated_at, deleted_at, status, "from", provider_data) FROM stdin;
\.


--
-- Data for Name: notification_provider; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_provider (id, handle, name, is_enabled, channels, created_at, updated_at, deleted_at) FROM stdin;
local	local	local	t	{feed}	2026-07-30 11:38:44.751+05:30	2026-07-30 11:38:44.751+05:30	\N
\.


--
-- Data for Name: offer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offer (id, seller_id, variant_id, shipping_profile_id, sku, ean, upc, created_by, metadata, created_at, updated_at, deleted_at, product_id) FROM stdin;
\.


--
-- Data for Name: offer_inventory_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offer_inventory_item (offer_id, inventory_item_id, id, required_quantity, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: offer_offer_pricing_price; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offer_offer_pricing_price (offer_id, price_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: onboarding; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.onboarding (id, data, context, account_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."order" (id, region_id, display_id, customer_id, version, sales_channel_id, status, is_draft_order, email, currency_code, shipping_address_id, billing_address_id, no_notification, metadata, created_at, updated_at, deleted_at, canceled_at, custom_display_id, locale) FROM stdin;
\.


--
-- Data for Name: order_address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_address (id, customer_id, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_cart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_cart (order_id, cart_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_change; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_change (id, order_id, version, description, status, internal_note, created_by, requested_by, requested_at, confirmed_by, confirmed_at, declined_by, declined_reason, metadata, declined_at, canceled_by, canceled_at, created_at, updated_at, change_type, deleted_at, return_id, claim_id, exchange_id, carry_over_promotions) FROM stdin;
\.


--
-- Data for Name: order_change_action; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_change_action (id, order_id, version, ordering, order_change_id, reference, reference_id, action, details, amount, raw_amount, internal_note, applied, created_at, updated_at, deleted_at, return_id, claim_id, exchange_id) FROM stdin;
\.


--
-- Data for Name: order_claim; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_claim (id, order_id, return_id, order_version, display_id, type, no_notification, refund_amount, raw_refund_amount, metadata, created_at, updated_at, deleted_at, canceled_at, created_by) FROM stdin;
\.


--
-- Data for Name: order_claim_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_claim_item (id, claim_id, item_id, is_additional_item, reason, quantity, raw_quantity, note, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_claim_item_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_claim_item_image (id, claim_item_id, url, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_credit_line; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_credit_line (id, order_id, reference, reference_id, amount, raw_amount, metadata, created_at, updated_at, deleted_at, version) FROM stdin;
\.


--
-- Data for Name: order_exchange; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_exchange (id, order_id, return_id, order_version, display_id, no_notification, allow_backorder, difference_due, raw_difference_due, metadata, created_at, updated_at, deleted_at, canceled_at, created_by) FROM stdin;
\.


--
-- Data for Name: order_exchange_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_exchange_item (id, exchange_id, item_id, quantity, raw_quantity, note, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_fulfillment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_fulfillment (order_id, fulfillment_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_group (id, display_id, customer_id, cart_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_group_order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_group_order (order_group_id, order_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_item (id, order_id, version, item_id, quantity, raw_quantity, fulfilled_quantity, raw_fulfilled_quantity, shipped_quantity, raw_shipped_quantity, return_requested_quantity, raw_return_requested_quantity, return_received_quantity, raw_return_received_quantity, return_dismissed_quantity, raw_return_dismissed_quantity, written_off_quantity, raw_written_off_quantity, metadata, created_at, updated_at, deleted_at, delivered_quantity, raw_delivered_quantity, unit_price, raw_unit_price, compare_at_unit_price, raw_compare_at_unit_price) FROM stdin;
\.


--
-- Data for Name: order_line_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_line_item (id, totals_id, title, subtitle, thumbnail, variant_id, product_id, product_title, product_description, product_subtitle, product_type, product_collection, product_handle, variant_sku, variant_barcode, variant_title, variant_option_values, requires_shipping, is_discountable, is_tax_inclusive, compare_at_unit_price, raw_compare_at_unit_price, unit_price, raw_unit_price, metadata, created_at, updated_at, deleted_at, is_custom_price, product_type_id, is_giftcard) FROM stdin;
\.


--
-- Data for Name: order_line_item_adjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_line_item_adjustment (id, description, promotion_id, code, amount, raw_amount, provider_id, created_at, updated_at, item_id, deleted_at, is_tax_inclusive, version) FROM stdin;
\.


--
-- Data for Name: order_line_item_tax_line; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_line_item_tax_line (id, description, tax_rate_id, code, rate, raw_rate, provider_id, created_at, updated_at, item_id, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_order_line_item_offer_offer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_order_line_item_offer_offer (order_line_item_id, offer_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_order_payout_payout; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_order_payout_payout (order_id, payout_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_order_review_review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_order_review_review (order_id, review_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_order_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_order_seller_seller (order_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_payment_collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_payment_collection (order_id, payment_collection_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_promotion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_promotion (order_id, promotion_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_shipping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_shipping (id, order_id, version, shipping_method_id, created_at, updated_at, deleted_at, return_id, claim_id, exchange_id) FROM stdin;
\.


--
-- Data for Name: order_shipping_method; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_shipping_method (id, name, description, amount, raw_amount, is_tax_inclusive, shipping_option_id, data, metadata, created_at, updated_at, deleted_at, is_custom_amount) FROM stdin;
\.


--
-- Data for Name: order_shipping_method_adjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_shipping_method_adjustment (id, description, promotion_id, code, amount, raw_amount, provider_id, created_at, updated_at, shipping_method_id, deleted_at, version) FROM stdin;
\.


--
-- Data for Name: order_shipping_method_tax_line; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_shipping_method_tax_line (id, description, tax_rate_id, code, rate, raw_rate, provider_id, created_at, updated_at, shipping_method_id, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_summary (id, order_id, version, totals, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: order_transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_transaction (id, order_id, version, amount, raw_amount, currency_code, reference, reference_id, created_at, updated_at, deleted_at, return_id, claim_id, exchange_id) FROM stdin;
\.


--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment (id, amount, raw_amount, currency_code, provider_id, data, created_at, updated_at, deleted_at, captured_at, canceled_at, payment_collection_id, payment_session_id, metadata) FROM stdin;
\.


--
-- Data for Name: payment_collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_collection (id, currency_code, amount, raw_amount, authorized_amount, raw_authorized_amount, captured_amount, raw_captured_amount, refunded_amount, raw_refunded_amount, created_at, updated_at, deleted_at, completed_at, status, metadata) FROM stdin;
\.


--
-- Data for Name: payment_collection_payment_providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_collection_payment_providers (payment_collection_id, payment_provider_id) FROM stdin;
\.


--
-- Data for Name: payment_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_details (id, holder_name, bank_name, iban, bic, routing_number, account_number, seller_id, created_at, updated_at, deleted_at, country_code) FROM stdin;
\.


--
-- Data for Name: payment_provider; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_provider (id, is_enabled, created_at, updated_at, deleted_at) FROM stdin;
pp_system_default	t	2026-07-30 11:38:44.747+05:30	2026-07-30 11:38:44.747+05:30	\N
\.


--
-- Data for Name: payment_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_session (id, currency_code, amount, raw_amount, provider_id, data, context, status, authorized_at, payment_collection_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: payout; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payout (id, currency_code, amount, data, account_id, status, raw_amount, created_at, updated_at, deleted_at, display_id) FROM stdin;
\.


--
-- Data for Name: payout_account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payout_account (id, status, data, context, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: payout_payout_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payout_payout_seller_seller (payout_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: price; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price (id, title, price_set_id, currency_code, raw_amount, rules_count, created_at, updated_at, deleted_at, price_list_id, amount, min_quantity, max_quantity, raw_min_quantity, raw_max_quantity) FROM stdin;
\.


--
-- Data for Name: price_list; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_list (id, status, starts_at, ends_at, rules_count, title, description, type, created_at, updated_at, deleted_at, metadata) FROM stdin;
\.


--
-- Data for Name: price_list_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_list_rule (id, price_list_id, created_at, updated_at, deleted_at, value, attribute) FROM stdin;
\.


--
-- Data for Name: price_preference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_preference (id, attribute, value, is_tax_inclusive, created_at, updated_at, deleted_at) FROM stdin;
prpref_01KYRTC7JA8TKGAYZFZ74KAQ8Q	currency_code	eur	f	2026-07-30 11:41:21.802+05:30	2026-07-30 11:41:21.802+05:30	\N
prpref_01KYRTN1FSHAXJXVQYZ44JBBEG	currency_code	inr	f	2026-07-30 11:46:10.489+05:30	2026-07-30 11:46:10.489+05:30	\N
prpref_01KYRTQJB2ZFM9AS794RFKGK6G	region_id	reg_01KYRTQJ9WJB9K699PSVYKHY55	f	2026-07-30 11:47:33.282+05:30	2026-07-30 11:47:33.282+05:30	\N
\.


--
-- Data for Name: price_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_rule (id, value, priority, price_id, created_at, updated_at, deleted_at, attribute, operator) FROM stdin;
\.


--
-- Data for Name: price_set; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_set (id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: pricing_price_list_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pricing_price_list_seller_seller (price_list_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product (id, title, handle, subtitle, description, is_giftcard, status, thumbnail, weight, length, height, width, origin_country, hs_code, mid_code, material, collection_id, type_id, discountable, external_id, created_at, updated_at, deleted_at, metadata) FROM stdin;
\.


--
-- Data for Name: product_attribute; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_attribute (id, handle, name, description, type, is_required, is_filterable, is_variant_axis, rank, is_active, created_by, metadata, created_at, updated_at, deleted_at, product_id, product_option_id) FROM stdin;
\.


--
-- Data for Name: product_attribute_value; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_attribute_value (id, handle, name, rank, is_active, metadata, attribute_id, created_at, updated_at, deleted_at, product_option_value_id) FROM stdin;
\.


--
-- Data for Name: product_attribute_value_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_attribute_value_link (product_id, product_attribute_value_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_category (id, name, description, handle, mpath, is_active, is_internal, rank, parent_category_id, created_at, updated_at, deleted_at, metadata, external_id) FROM stdin;
pcat_01KYRWF443NTZE197307GKQRYM	Men		men	pcat_01KYRWF443NTZE197307GKQRYM	t	f	0	\N	2026-07-30 12:17:53.732+05:30	2026-07-30 12:17:53.732+05:30	\N	\N	\N
pcat_01KYRWF444QF9ZZNGTVPFHQEAV	Women		women	pcat_01KYRWF444QF9ZZNGTVPFHQEAV	t	f	1	\N	2026-07-30 12:17:53.733+05:30	2026-07-30 12:17:53.733+05:30	\N	\N	\N
pcat_01KYRWF444E65YJ6TMETAMQB31	Kids		kids	pcat_01KYRWF444E65YJ6TMETAMQB31	t	f	2	\N	2026-07-30 12:17:53.733+05:30	2026-07-30 12:17:53.733+05:30	\N	\N	\N
pcat_01KYRWF45J21VJXDSNFWN7MY99	Topwear		topwear	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99	f	f	0	pcat_01KYRWF443NTZE197307GKQRYM	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45KDRWSNEYNSPSQBYA7	Bottomwear		bottomwear	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45KDRWSNEYNSPSQBYA7	f	f	1	pcat_01KYRWF443NTZE197307GKQRYM	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45K1Q7P18FMAYNDPBVV	Men's Innerwear & Sleepwear		mens-innerwear-sleepwear	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45K1Q7P18FMAYNDPBVV	f	f	2	pcat_01KYRWF443NTZE197307GKQRYM	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45PTSFMRA1E1G20CJCV	Indian & Festive Wear		indian-festive-wear	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45PTSFMRA1E1G20CJCV	f	f	3	pcat_01KYRWF443NTZE197307GKQRYM	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45Q82F4BTFVQWV44RB2	Plus Size Men		plus-size-men	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45Q82F4BTFVQWV44RB2	f	f	4	pcat_01KYRWF443NTZE197307GKQRYM	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45QA953AVDNMAFTDHAH	Indian & Fusion Wear		indian-fusion-wear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH	f	f	5	pcat_01KYRWF444QF9ZZNGTVPFHQEAV	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45R5YWMH8H9BWACRHCS	Western Wear		western-wear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS	f	f	6	pcat_01KYRWF444QF9ZZNGTVPFHQEAV	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45R2FP1WEZMZWEB9GA8	Maternity		maternity	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R2FP1WEZMZWEB9GA8	f	f	7	pcat_01KYRWF444QF9ZZNGTVPFHQEAV	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45R0G23NTZSJF9QV5N8	Sports & Active Wear		sports-active-wear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R0G23NTZSJF9QV5N8	f	f	8	pcat_01KYRWF444QF9ZZNGTVPFHQEAV	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45SRC1NSF02334VCS1N	Women's Lingerie & Sleepwear		womens-lingerie-sleepwear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45SRC1NSF02334VCS1N	f	f	9	pcat_01KYRWF444QF9ZZNGTVPFHQEAV	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45SMJ65Y0G7KY6K38EK	Plus Size Women		plus-size-women	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45SMJ65Y0G7KY6K38EK	f	f	10	pcat_01KYRWF444QF9ZZNGTVPFHQEAV	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45TAKMBB1K37J4BA5EN	Boys Clothing		boys-clothing	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN	f	f	11	pcat_01KYRWF444E65YJ6TMETAMQB31	2026-07-30 12:17:53.786+05:30	2026-07-30 12:17:53.786+05:30	\N	\N	\N
pcat_01KYRWF45TP7BFV61AF2AKJFX3	Girls Clothing		girls-clothing	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3	f	f	12	pcat_01KYRWF444E65YJ6TMETAMQB31	2026-07-30 12:17:53.787+05:30	2026-07-30 12:17:53.787+05:30	\N	\N	\N
pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	Infants		infants	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	f	f	13	pcat_01KYRWF444E65YJ6TMETAMQB31	2026-07-30 12:17:53.787+05:30	2026-07-30 12:17:53.787+05:30	\N	\N	\N
pcat_01KYRWF47V6DSHA37NWRXA5VT0	Men's T-Shirts		mens-t-shirts	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47V6DSHA37NWRXA5VT0	f	f	0	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47V1VZXY72EFZS4ZR3E	Casual Shirts		casual-shirts	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47V1VZXY72EFZS4ZR3E	f	f	1	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47VCJBJQQQ7PC19XE7M	Formal Shirts		formal-shirts	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47VCJBJQQQ7PC19XE7M	f	f	2	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47VEF8QWSSN768G8Q9R	Sweatshirts		sweatshirts	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47VEF8QWSSN768G8Q9R	f	f	3	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47W2KSNK4WNVZ4W2QBV	Sweaters		sweaters	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47W2KSNK4WNVZ4W2QBV	f	f	4	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47WGRKS84K5MQ7DF1K1	Men's Jackets		mens-jackets	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47WGRKS84K5MQ7DF1K1	f	f	5	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47WY8R5FV50QNRTMWHK	Blazers & Coats		blazers-coats	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47WY8R5FV50QNRTMWHK	f	f	6	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47WKZ8B71J4119VCENA	Suits		suits	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47WKZ8B71J4119VCENA	f	f	7	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47X7W9ZN945QEZS7QZ3	Rain Jackets		rain-jackets	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45J21VJXDSNFWN7MY99.pcat_01KYRWF47X7W9ZN945QEZS7QZ3	f	f	8	pcat_01KYRWF45J21VJXDSNFWN7MY99	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47XPA5R6RAJTEAPVYS6	Men's Jeans		mens-jeans	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45KDRWSNEYNSPSQBYA7.pcat_01KYRWF47XPA5R6RAJTEAPVYS6	f	f	9	pcat_01KYRWF45KDRWSNEYNSPSQBYA7	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47X39PH9WRMT7A37DGQ	Casual Trousers		casual-trousers	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45KDRWSNEYNSPSQBYA7.pcat_01KYRWF47X39PH9WRMT7A37DGQ	f	f	10	pcat_01KYRWF45KDRWSNEYNSPSQBYA7	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47Y6WVSXZABRJ0PS14E	Formal Trousers		formal-trousers	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45KDRWSNEYNSPSQBYA7.pcat_01KYRWF47Y6WVSXZABRJ0PS14E	f	f	11	pcat_01KYRWF45KDRWSNEYNSPSQBYA7	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47YEHJAFEMXB2ZWSEDN	Men's Shorts		mens-shorts	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45KDRWSNEYNSPSQBYA7.pcat_01KYRWF47YEHJAFEMXB2ZWSEDN	f	f	12	pcat_01KYRWF45KDRWSNEYNSPSQBYA7	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47YB1J0F9AQ0496W7ZH	Track Pants & Joggers		track-pants-joggers	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45KDRWSNEYNSPSQBYA7.pcat_01KYRWF47YB1J0F9AQ0496W7ZH	f	f	13	pcat_01KYRWF45KDRWSNEYNSPSQBYA7	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47Y8Z9JCC5ZHZGTB8Y1	Briefs & Trunks		briefs-trunks	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45K1Q7P18FMAYNDPBVV.pcat_01KYRWF47Y8Z9JCC5ZHZGTB8Y1	f	f	14	pcat_01KYRWF45K1Q7P18FMAYNDPBVV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47ZWSYG7FRTDEXX4JMF	Boxers		boxers	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45K1Q7P18FMAYNDPBVV.pcat_01KYRWF47ZWSYG7FRTDEXX4JMF	f	f	15	pcat_01KYRWF45K1Q7P18FMAYNDPBVV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47ZSSJD403PYPGKKXAR	Vests		vests	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45K1Q7P18FMAYNDPBVV.pcat_01KYRWF47ZSSJD403PYPGKKXAR	f	f	16	pcat_01KYRWF45K1Q7P18FMAYNDPBVV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47Z8C30P69045RTB8VR	Men's Sleepwear		mens-sleepwear	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45K1Q7P18FMAYNDPBVV.pcat_01KYRWF47Z8C30P69045RTB8VR	f	f	17	pcat_01KYRWF45K1Q7P18FMAYNDPBVV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47Z59019D7CHQ9GK1FM	Men's Thermals		mens-thermals	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45K1Q7P18FMAYNDPBVV.pcat_01KYRWF47Z59019D7CHQ9GK1FM	f	f	18	pcat_01KYRWF45K1Q7P18FMAYNDPBVV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF47Z1S7VA4KHMA64329X	Kurtas & Kurta Sets		kurtas-kurta-sets	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45PTSFMRA1E1G20CJCV.pcat_01KYRWF47Z1S7VA4KHMA64329X	f	f	19	pcat_01KYRWF45PTSFMRA1E1G20CJCV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF480SR7110KB7HGR6R6Q	Sherwanis		sherwanis	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45PTSFMRA1E1G20CJCV.pcat_01KYRWF480SR7110KB7HGR6R6Q	f	f	20	pcat_01KYRWF45PTSFMRA1E1G20CJCV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF48062JR6JSX4JSN7392	Nehru Jackets		nehru-jackets	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45PTSFMRA1E1G20CJCV.pcat_01KYRWF48062JR6JSX4JSN7392	f	f	21	pcat_01KYRWF45PTSFMRA1E1G20CJCV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF482F0N89PR7NHMFYRTX	Dhotis		dhotis	pcat_01KYRWF443NTZE197307GKQRYM.pcat_01KYRWF45PTSFMRA1E1G20CJCV.pcat_01KYRWF482F0N89PR7NHMFYRTX	f	f	22	pcat_01KYRWF45PTSFMRA1E1G20CJCV	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF483MPECMRR4SCZGW7MA	Kurtas & Suits		kurtas-suits	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF483MPECMRR4SCZGW7MA	f	f	23	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF483FTMFHZ8XSMEH5QVQ	Kurtis, Tunics & Tops		kurtis-tunics-tops	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF483FTMFHZ8XSMEH5QVQ	f	f	24	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF48358BPZ8RC7QCDJJQJ	Sarees		sarees	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF48358BPZ8RC7QCDJJQJ	f	f	25	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF4848C4SXV0YYF18ZYF7	Ethnic Wear		ethnic-wear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF4848C4SXV0YYF18ZYF7	f	f	26	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF484HVSST3ZG92C0XA84	Leggings, Salwars & Churidars		leggings-salwars-churidars	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF484HVSST3ZG92C0XA84	f	f	27	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF48419C6E493RNDGTH7K	Skirts & Palazzos		skirts-palazzos	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF48419C6E493RNDGTH7K	f	f	28	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF4850XJQE68MHW7T89J0	Dress Materials		dress-materials	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF4850XJQE68MHW7T89J0	f	f	29	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF485EW5YDYD77BWASEDV	Lehenga Cholis		lehenga-choles	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF485EW5YDYD77BWASEDV	f	f	30	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF485XJXFVAJFZ1D5F7VP	Dupattas & Shawls		dupattas-shawls	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF485XJXFVAJFZ1D5F7VP	f	f	31	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF485M2326JY16QCYVK54	Women's Ethnic Jackets		womens-ethnic-jackets	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45QA953AVDNMAFTDHAH.pcat_01KYRWF485M2326JY16QCYVK54	f	f	32	pcat_01KYRWF45QA953AVDNMAFTDHAH	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF485MQ894C3W3V2RB20H	Women's Dresses		womens-dresses	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF485MQ894C3W3V2RB20H	f	f	33	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF486DQ7N2BD5VZ388EEY	Women's Tops		womens-tops	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF486DQ7N2BD5VZ388EEY	f	f	34	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF486357389245WQKRTV0	Women's Tshirts		womens-tshirts	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF486357389245WQKRTV0	f	f	35	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.875+05:30	2026-07-30 12:17:53.875+05:30	\N	\N	\N
pcat_01KYRWF486TATW5C3CGC3WCT9K	Women's Jeans		womens-jeans	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF486TATW5C3CGC3WCT9K	f	f	36	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF486S4YKMWQC1QYSGB50	Trousers & Capris		trousers-capris	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF486S4YKMWQC1QYSGB50	f	f	37	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF4866TBEBF8XXPCXBDA6	Shorts & Skirts		shorts-skirts	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF4866TBEBF8XXPCXBDA6	f	f	38	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF487DGYVQ7NV17M4TT64	Co-ords		coords	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF487DGYVQ7NV17M4TT64	f	f	39	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF487KS7HSCPJ7VYMY9R0	Playsuits		playsuits	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF487KS7HSCPJ7VYMY9R0	f	f	40	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF4870WR8MR9DZ1JA9GY6	Jumpsuits		jumpsuits	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF4870WR8MR9DZ1JA9GY6	f	f	41	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF487XTTS8SH38A2MM1PS	Shrugs		shrugs	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF487XTTS8SH38A2MM1PS	f	f	42	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF487NAN18180VKMV16BB	Sweaters & Sweatshirts		sweaters-sweatshirts	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF487NAN18180VKMV16BB	f	f	43	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF4873WJ63X4520CVBDW0	Women's Jackets & Coats		womens-jackets-coats	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF4873WJ63X4520CVBDW0	f	f	44	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48858J0F6GRP7TXQM38	Blazers & Waistcoats		blazers-waistcoats	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R5YWMH8H9BWACRHCS.pcat_01KYRWF48858J0F6GRP7TXQM38	f	f	45	pcat_01KYRWF45R5YWMH8H9BWACRHCS	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF488S5DN6QRM6ESG32WF	Bra		bra	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45SRC1NSF02334VCS1N.pcat_01KYRWF488S5DN6QRM6ESG32WF	f	f	46	pcat_01KYRWF45SRC1NSF02334VCS1N	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF4885HXXJD1WBJ2G121T	Briefs		briefs	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45SRC1NSF02334VCS1N.pcat_01KYRWF4885HXXJD1WBJ2G121T	f	f	47	pcat_01KYRWF45SRC1NSF02334VCS1N	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF488SRXDWA34FH9HSTMF	Shapewear		shapewear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45SRC1NSF02334VCS1N.pcat_01KYRWF488SRXDWA34FH9HSTMF	f	f	48	pcat_01KYRWF45SRC1NSF02334VCS1N	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF488AZ443BEENKS499AK	Women's Sleepwear		womens-sleepwear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45SRC1NSF02334VCS1N.pcat_01KYRWF488AZ443BEENKS499AK	f	f	49	pcat_01KYRWF45SRC1NSF02334VCS1N	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF4897GTBHEFCZ5JEEF9A	Swimwear		swimwear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45SRC1NSF02334VCS1N.pcat_01KYRWF4897GTBHEFCZ5JEEF9A	f	f	50	pcat_01KYRWF45SRC1NSF02334VCS1N	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF4893BAY43T0E3MTZ439	Camisoles & Women's Thermals		camisoles-womens-thermals	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45SRC1NSF02334VCS1N.pcat_01KYRWF4893BAY43T0E3MTZ439	f	f	51	pcat_01KYRWF45SRC1NSF02334VCS1N	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF489BM0P1QBHC4RTXQXW	Sports Clothing		sports-clothing	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R0G23NTZSJF9QV5N8.pcat_01KYRWF489BM0P1QBHC4RTXQXW	f	f	52	pcat_01KYRWF45R0G23NTZSJF9QV5N8	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF489KCSFZ287GCNE4DMM	Sports Footwear		sports-footwear	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R0G23NTZSJF9QV5N8.pcat_01KYRWF489KCSFZ287GCNE4DMM	f	f	53	pcat_01KYRWF45R0G23NTZSJF9QV5N8	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF489GFDM5E6ZG4A8RY69	Sports Accessories		sports-accessories	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R0G23NTZSJF9QV5N8.pcat_01KYRWF489GFDM5E6ZG4A8RY69	f	f	54	pcat_01KYRWF45R0G23NTZSJF9QV5N8	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF489HB0A2W4SBPPM1489	Sports Equipment		sports-equipment	pcat_01KYRWF444QF9ZZNGTVPFHQEAV.pcat_01KYRWF45R0G23NTZSJF9QV5N8.pcat_01KYRWF489HB0A2W4SBPPM1489	f	f	55	pcat_01KYRWF45R0G23NTZSJF9QV5N8	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48A5YXYD5E79R50D85R	Boys T-Shirts		boys-tshirts	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48A5YXYD5E79R50D85R	f	f	56	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48ACKKFQRKVJ74G5SNP	Boys Shirts		boys-shirts	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48ACKKFQRKVJ74G5SNP	f	f	57	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48A6P0Z73B7DMGX2730	Boys Shorts		boys-shorts	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48A6P0Z73B7DMGX2730	f	f	58	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48A52KQA6H0G26D5CAF	Boys Jeans		boys-jeans	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48A52KQA6H0G26D5CAF	f	f	59	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48AAA5D1V2V2VJ5NXG3	Boys Trousers		boys-trousers	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48AAA5D1V2V2VJ5NXG3	f	f	60	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48AJEDYS2EDTVMANP12	Boys Clothing Sets		boys-clothing-sets	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48AJEDYS2EDTVMANP12	f	f	61	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48BG84MMEF8PCMRWKW9	Boys Ethnic Wear		boys-ethnic-wear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48BG84MMEF8PCMRWKW9	f	f	62	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48BCWZFPPV1YE7D570B	Track Pants & Pyjamas		track-pants-pyjamas	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48BCWZFPPV1YE7D570B	f	f	63	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48BGVFNGJ9DBX0WN839	Boys Jacket & Sweaters		boys-jacket-sweaters	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48BGVFNGJ9DBX0WN839	f	f	64	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48CW7AYDFMGGETHSC5H	Boys Party Wear		boys-party-wear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48CW7AYDFMGGETHSC5H	f	f	65	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48CYDE7H8J0T7RRZ7NQ	Boys Innerwear		boys-innerwear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48CYDE7H8J0T7RRZ7NQ	f	f	66	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48C0KSGQWWYFFTP1WT2	Boys Nightwear		boys-nightwear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48C0KSGQWWYFFTP1WT2	f	f	67	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48CFPX4HBPDT64V5FFD	Boys Value Packs		boys-value-packs	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TAKMBB1K37J4BA5EN.pcat_01KYRWF48CFPX4HBPDT64V5FFD	f	f	68	pcat_01KYRWF45TAKMBB1K37J4BA5EN	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48DKDQQWR4ASBXBAQFH	Girls Dresses		girls-dresses	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48DKDQQWR4ASBXBAQFH	f	f	69	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48DJGS11Y6QN1MYFFDV	Girls Tops		girls-tops	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48DJGS11Y6QN1MYFFDV	f	f	70	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48D91N6Q64HYT42TDCB	Girls Tshirts		girls-tshirts	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48D91N6Q64HYT42TDCB	f	f	71	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48D3CCKH581ZBXHCP5M	Girls Clothing Sets		girls-clothing-sets	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48D3CCKH581ZBXHCP5M	f	f	72	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48E89JDSYPQWH8BTY2D	Lehenga choli		lehenga-choli	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48E89JDSYPQWH8BTY2D	f	f	73	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48EEKFY2FG26MSKE1EJ	Kurta Sets		kurta-sets	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48EEKFY2FG26MSKE1EJ	f	f	74	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48E9Y41PX8M71SC9J2R	Girls Party wear		girls-party-wear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48E9Y41PX8M71SC9J2R	f	f	75	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48EHYTXD2NJ84QBEPH8	Dungarees & Jumpsuits		dungarees-jumpsuits	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48EHYTXD2NJ84QBEPH8	f	f	76	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48FGXX3QCBET8C2T375	Skirts & shorts		skirts-shorts	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48FGXX3QCBET8C2T375	f	f	77	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48FWWB8160C0A37K1FS	Tights & Leggings		tights-leggings	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48FWWB8160C0A37K1FS	f	f	78	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48FX9SVJCSX8XK2R2BD	Girls Jeans & Trousers		girls-jeans-trousers	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48FX9SVJCSX8XK2R2BD	f	f	79	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48FTPDZA3MYHQ899518	Girls Jacket & Sweaters		girls-jacket-sweaters	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48FTPDZA3MYHQ899518	f	f	80	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48G92YFJB9W185RKSGP	Girls Innerwear		girls-innerwear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48G92YFJB9W185RKSGP	f	f	81	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48G3R05BV4QYHBDCX8V	Girls Nightwear		girls-nightwear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48G3R05BV4QYHBDCX8V	f	f	82	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48G2WAGFCHXPTTTRHYY	Girls Value Packs		girls-value-packs	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45TP7BFV61AF2AKJFX3.pcat_01KYRWF48G2WAGFCHXPTTTRHYY	f	f	83	pcat_01KYRWF45TP7BFV61AF2AKJFX3	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48G96406V6T8RAZ08T0	Infant Bodysuits		infant-bodysuits	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48G96406V6T8RAZ08T0	f	f	84	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48HBXJWH4F4840WQGMT	Rompers & Sleepsuits		rompers-sleepsuits	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48HBXJWH4F4840WQGMT	f	f	85	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48HDZXEYMBYCJZR0N46	Infant Clothing Sets		infant-clothing-sets	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48HDZXEYMBYCJZR0N46	f	f	86	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48H57TK75XK1FCW3GFG	Infant Tshirts & Tops		infant-tshirts-tops	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48H57TK75XK1FCW3GFG	f	f	87	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48HSBHM7ZBRMAWNFJZD	Infant Dresses		infant-dresses	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48HSBHM7ZBRMAWNFJZD	f	f	88	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48H8ACP1K1SCTC0NJBB	Infant Bottom wear		infant-bottom-wear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48H8ACP1K1SCTC0NJBB	f	f	89	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48J6KSEK41DVQQTGEMS	Infant Winter Wear		infant-winter-wear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48J6KSEK41DVQQTGEMS	f	f	90	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48J8BNMKWD957ZMFTDX	Infant Sleepwear		infant-sleepwear	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48J8BNMKWD957ZMFTDX	f	f	91	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
pcat_01KYRWF48J3CY5NDZ4GH1DHXQZ	Infant Care		infant-care	pcat_01KYRWF444E65YJ6TMETAMQB31.pcat_01KYRWF45T9HMW8ZK6BDRB0SWG.pcat_01KYRWF48J3CY5NDZ4GH1DHXQZ	f	f	92	pcat_01KYRWF45T9HMW8ZK6BDRB0SWG	2026-07-30 12:17:53.876+05:30	2026-07-30 12:17:53.876+05:30	\N	\N	\N
\.


--
-- Data for Name: product_category_attribute; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_category_attribute (product_attribute_id, product_category_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_category_product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_category_product (product_id, product_category_id) FROM stdin;
\.


--
-- Data for Name: product_change; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_change (id, product_id, status, internal_note, external_note, created_by, confirmed_by, confirmed_at, declined_by, declined_at, declined_reason, canceled_by, canceled_at, requires_action_by, requires_action_at, requires_action_reason, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_change_action; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_change_action (id, product_id, ordering, action, details, internal_note, applied, product_change_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_collection (id, title, handle, metadata, created_at, updated_at, deleted_at, external_id) FROM stdin;
\.


--
-- Data for Name: product_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_option (id, title, metadata, created_at, updated_at, deleted_at, is_exclusive) FROM stdin;
\.


--
-- Data for Name: product_option_value; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_option_value (id, value, option_id, metadata, created_at, updated_at, deleted_at, rank) FROM stdin;
\.


--
-- Data for Name: product_product_category_media_media_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_product_category_media_media_image (product_category_id, media_image_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_product_category_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_product_category_seller_seller (product_category_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_product_collection_media_media_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_product_collection_media_media_image (product_collection_id, media_image_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_product_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_product_option (id, product_id, product_option_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_product_option_value; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_product_option_value (id, product_product_option_id, product_option_value_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_product_review_review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_product_review_review (product_id, review_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_sales_channel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_sales_channel (product_id, sales_channel_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_seller (product_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_shipping_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_shipping_profile (product_id, shipping_profile_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_tag (id, value, metadata, created_at, updated_at, deleted_at, external_id) FROM stdin;
\.


--
-- Data for Name: product_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_tags (product_id, product_tag_id) FROM stdin;
\.


--
-- Data for Name: product_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_type (id, value, metadata, created_at, updated_at, deleted_at, external_id) FROM stdin;
\.


--
-- Data for Name: product_variant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variant (id, title, sku, barcode, ean, upc, allow_backorder, manage_inventory, hs_code, origin_country, mid_code, material, weight, length, height, width, metadata, variant_rank, product_id, created_at, updated_at, deleted_at, thumbnail) FROM stdin;
\.


--
-- Data for Name: product_variant_inventory_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variant_inventory_item (variant_id, inventory_item_id, id, required_quantity, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_variant_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variant_option (variant_id, option_value_id) FROM stdin;
\.


--
-- Data for Name: product_variant_price_set; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variant_price_set (variant_id, price_set_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_variant_product_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variant_product_image (id, variant_id, image_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: professional_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.professional_details (id, corporate_name, registration_number, tax_id, seller_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion (id, code, campaign_id, is_automatic, type, created_at, updated_at, deleted_at, status, is_tax_inclusive, "limit", used, metadata) FROM stdin;
\.


--
-- Data for Name: promotion_application_method; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_application_method (id, value, raw_value, max_quantity, apply_to_quantity, buy_rules_min_quantity, type, target_type, allocation, promotion_id, created_at, updated_at, deleted_at, currency_code) FROM stdin;
\.


--
-- Data for Name: promotion_campaign; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_campaign (id, name, description, campaign_identifier, starts_at, ends_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_campaign_budget; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_campaign_budget (id, type, campaign_id, "limit", raw_limit, used, raw_used, created_at, updated_at, deleted_at, currency_code, attribute) FROM stdin;
\.


--
-- Data for Name: promotion_campaign_budget_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_campaign_budget_usage (id, attribute_value, used, budget_id, raw_used, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_campaign_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_campaign_seller_seller (campaign_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_cost; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_cost (id, promotion_id, cost_bearer, shared_marketplace_percentage, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_promotion_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_promotion_rule (promotion_id, promotion_rule_id) FROM stdin;
\.


--
-- Data for Name: promotion_promotion_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_promotion_seller_seller (promotion_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_rule (id, description, attribute, operator, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: promotion_rule_value; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotion_rule_value (id, promotion_rule_id, value, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: property_label; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_label (id, entity, property, label, description, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: provider_identity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_identity (id, entity_id, provider, auth_identity_id, user_metadata, provider_metadata, created_at, updated_at, deleted_at) FROM stdin;
01KYRTHYFN8Z2J6C5G0TKGRW08	ashishbansaldev@gmail.com	emailpass	authid_01KYRTHYFPCYNHJBJ7CXERTFER	\N	{"password": "c2NyeXB0AA8AAAAIAAAAAfWwPqJMLIu8yzXfGOt5p1yyKZ1SpMhD9ktgx9+3CnC0czyX7kGNTkV2bnmIihOpBtF0haW6ryJ4rQydTt/kSbAEKIEth1WEAXC71/lOMgbd"}	2026-07-30 11:44:29.11+05:30	2026-07-30 11:44:29.11+05:30	\N
\.


--
-- Data for Name: publishable_api_key_sales_channel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.publishable_api_key_sales_channel (publishable_key_id, sales_channel_id, id, created_at, updated_at, deleted_at) FROM stdin;
apk_01KYRTC7JP69ZSA6XHVECX0B9W	sc_01KYRTC7GDYH13MCEX0HS51H31	pksc_01KYRTC7JZVT6FPDNV8A2465AG	2026-07-30 11:41:21.822956+05:30	2026-07-30 11:41:21.822956+05:30	\N
\.


--
-- Data for Name: rbac_policy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbac_policy (id, key, resource, operation, name, description, metadata, created_at, updated_at, deleted_at) FROM stdin;
rpol_super_admin	*:*	*	*	Super Admin	Super admin policy with full access to all resources and operations	\N	2026-07-30 11:38:44.753+05:30	2026-07-30 11:38:44.753+05:30	\N
rpol_01KYRT7EF9XMV1S13TVWP34R8D	customer:read	customer	read	ReadCustomer	Read Customer	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9KVDQQ942HVRJ9X1V	customer:create	customer	create	CreateCustomer	Create Customer	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9T7DM48S8XBMZNAC5	customer:update	customer	update	UpdateCustomer	Update Customer	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF970T14K2XZCHAPS6P	customer:delete	customer	delete	DeleteCustomer	Delete Customer	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF921960QFCANXW1QVT	customer_address:read	customer_address	read	ReadCustomerAddress	Read CustomerAddress	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9F3GXVTTK0KCJCPWH	customer_address:create	customer_address	create	CreateCustomerAddress	Create CustomerAddress	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9K9DDGDMMP123BXM7	customer_address:update	customer_address	update	UpdateCustomerAddress	Update CustomerAddress	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9CHB9H1MKWTYPGVS8	customer_address:delete	customer_address	delete	DeleteCustomerAddress	Delete CustomerAddress	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9W0KG55AEJ4TMBGTQ	customer_group:read	customer_group	read	ReadCustomerGroup	Read CustomerGroup	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9DMCXJH3KPTHPBBSE	customer_group:create	customer_group	create	CreateCustomerGroup	Create CustomerGroup	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9QDTQ9ZR5BG3KA5GK	customer_group:update	customer_group	update	UpdateCustomerGroup	Update CustomerGroup	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EF9RG60G9DH5Y9SVSM9	customer_group:delete	customer_group	delete	DeleteCustomerGroup	Delete CustomerGroup	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFAT5AGNTR6XKEY44N8	inventory_item:read	inventory_item	read	ReadInventoryItem	Read InventoryItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFA9GFVWAQ81VCFVWBQ	inventory_item:create	inventory_item	create	CreateInventoryItem	Create InventoryItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFA65XA6SSFDWKGG0QR	inventory_item:update	inventory_item	update	UpdateInventoryItem	Update InventoryItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFAHCQ0QMAYJV18VZW7	inventory_item:delete	inventory_item	delete	DeleteInventoryItem	Delete InventoryItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFAVHBKM5Q0YNV2G6W7	inventory_level:read	inventory_level	read	ReadInventoryLevel	Read InventoryLevel	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFADYS5CR0WQKPNW1RW	inventory_level:create	inventory_level	create	CreateInventoryLevel	Create InventoryLevel	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFA40DCX86NVA5Q61P7	inventory_level:update	inventory_level	update	UpdateInventoryLevel	Update InventoryLevel	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFA0SEQ0N5XP9WCVVJ8	inventory_level:delete	inventory_level	delete	DeleteInventoryLevel	Delete InventoryLevel	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFAQYQPM6DM9M2ATB9K	reservation_item:read	reservation_item	read	ReadReservationItem	Read ReservationItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFANTQBS2SG22DQSHES	reservation_item:create	reservation_item	create	CreateReservationItem	Create ReservationItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFARYR7WA10YCP5KJTS	reservation_item:update	reservation_item	update	UpdateReservationItem	Update ReservationItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFA3V4QVXF5C2NGAXFB	reservation_item:delete	reservation_item	delete	DeleteReservationItem	Delete ReservationItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFAMQMEZ640RYYJ7GM0	stock_location:read	stock_location	read	ReadStockLocation	Read StockLocation	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFAEYEM3C03TEP14RDC	stock_location:create	stock_location	create	CreateStockLocation	Create StockLocation	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFAQSKW0CAV0FXYGZ92	stock_location:update	stock_location	update	UpdateStockLocation	Update StockLocation	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFABV43ZSFS9GVWA3K2	stock_location:delete	stock_location	delete	DeleteStockLocation	Delete StockLocation	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFB1YPK2E6W859E3SZP	order:read	order	read	ReadOrder	Read Order	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFB32QDGZRE1JS6AN6A	order:create	order	create	CreateOrder	Create Order	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBETNB391803WN4B39	order:update	order	update	UpdateOrder	Update Order	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBCMSWY1V8MEXT8XJP	order:delete	order	delete	DeleteOrder	Delete Order	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBGDFV3G2PR723E9H8	order_item:read	order_item	read	ReadOrderItem	Read OrderItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBRNX4RP2776T0GY3H	order_item:create	order_item	create	CreateOrderItem	Create OrderItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBVH7BHYDT3C7SFW2Y	order_item:update	order_item	update	UpdateOrderItem	Update OrderItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBWXCGGA5FYFEK4VS8	order_item:delete	order_item	delete	DeleteOrderItem	Delete OrderItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBCC5BSV6S7BF5WEC4	order_change:read	order_change	read	ReadOrderChange	Read OrderChange	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFB5VE6R6C9466A8PTD	order_change:create	order_change	create	CreateOrderChange	Create OrderChange	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBEH7NBJXA2VW1FEWB	order_change:update	order_change	update	UpdateOrderChange	Update OrderChange	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFB5ZV219T143XC3G0F	order_change:delete	order_change	delete	DeleteOrderChange	Delete OrderChange	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBEKNKVCWFCC0Z9V47	order_claim:read	order_claim	read	ReadOrderClaim	Read OrderClaim	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBGC2GVBC6T67Z2QZQ	order_claim:create	order_claim	create	CreateOrderClaim	Create OrderClaim	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBB1237NK36HH6ZSQ1	order_claim:update	order_claim	update	UpdateOrderClaim	Update OrderClaim	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFBTBTC1EKCWQRMDX8T	order_claim:delete	order_claim	delete	DeleteOrderClaim	Delete OrderClaim	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFB8XYXMDARS0MKZT1F	order_claim_item:read	order_claim_item	read	ReadOrderClaimItem	Read OrderClaimItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCB4YX5WNZ6V3T0S4C	order_claim_item:create	order_claim_item	create	CreateOrderClaimItem	Create OrderClaimItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCS3DQZRHWX8NV7663	order_claim_item:update	order_claim_item	update	UpdateOrderClaimItem	Update OrderClaimItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFC5Q3QPWDJSD62XTAD	order_claim_item:delete	order_claim_item	delete	DeleteOrderClaimItem	Delete OrderClaimItem	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCD4BM4GXP2V00GC34	order_exchange:read	order_exchange	read	ReadOrderExchange	Read OrderExchange	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFC6C6G0BE3XZC1RD0B	order_exchange:create	order_exchange	create	CreateOrderExchange	Create OrderExchange	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCSCDP5VTT2TRZ283Q	order_exchange:update	order_exchange	update	UpdateOrderExchange	Update OrderExchange	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCBF30BYR5AQ1VP2HK	order_exchange:delete	order_exchange	delete	DeleteOrderExchange	Delete OrderExchange	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFC0CR9KBXW30RSN1TF	return:read	return	read	ReadReturn	Read Return	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCHFAQ516N61YPRWJZ	return:create	return	create	CreateReturn	Create Return	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCES2CNSP66C6CPKVE	return:update	return	update	UpdateReturn	Update Return	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFC7NFJ5A5XHY9JAVBZ	return:delete	return	delete	DeleteReturn	Delete Return	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFC9ASWSQQ5V4TPN120	return_reason:read	return_reason	read	ReadReturnReason	Read ReturnReason	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFC5P26F2XC6F24J8F4	return_reason:create	return_reason	create	CreateReturnReason	Create ReturnReason	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCV0S5Z33B4T9DX923	return_reason:update	return_reason	update	UpdateReturnReason	Update ReturnReason	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCVG12VANNTXRWNHVF	return_reason:delete	return_reason	delete	DeleteReturnReason	Delete ReturnReason	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFCG2QW84CBP85WSF8K	payment:read	payment	read	ReadPayment	Read Payment	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDEVK6KCJXVAJHAQNX	payment:create	payment	create	CreatePayment	Create Payment	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFD4TZW8E5F7KDXXQGK	payment:update	payment	update	UpdatePayment	Update Payment	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDN7TX79YRXSECH4CC	payment:delete	payment	delete	DeletePayment	Delete Payment	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDPTSTHWSW5XZ0F9GE	payment_collection:read	payment_collection	read	ReadPaymentCollection	Read PaymentCollection	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDRQ4MQNQWVZSBYR1T	payment_collection:create	payment_collection	create	CreatePaymentCollection	Create PaymentCollection	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDM5E4PSCNHXDHZJZ6	payment_collection:update	payment_collection	update	UpdatePaymentCollection	Update PaymentCollection	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDCN6AFQ00Q5PJ64ZM	payment_collection:delete	payment_collection	delete	DeletePaymentCollection	Delete PaymentCollection	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDWTNAB6EDNE5DEY9H	payment_method:read	payment_method	read	ReadPaymentMethod	Read PaymentMethod	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDNXXB0RAWTT4NSQTW	payment_method:create	payment_method	create	CreatePaymentMethod	Create PaymentMethod	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDYXY6ZQA5QS463SAQ	payment_method:update	payment_method	update	UpdatePaymentMethod	Update PaymentMethod	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDS93NX3KNBHR2ZE2F	payment_method:delete	payment_method	delete	DeletePaymentMethod	Delete PaymentMethod	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFD216BXJK3CFBS4XRR	payment_session:read	payment_session	read	ReadPaymentSession	Read PaymentSession	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDH77221KF9TWFBGMF	payment_session:create	payment_session	create	CreatePaymentSession	Create PaymentSession	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDT51TNME1TKRQRHWX	payment_session:update	payment_session	update	UpdatePaymentSession	Update PaymentSession	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDBRRJBNSVFEV40292	payment_session:delete	payment_session	delete	DeletePaymentSession	Delete PaymentSession	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDN3GJXGC5DWW3FV2Y	refund_reason:read	refund_reason	read	ReadRefundReason	Read RefundReason	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFDDFFDDZRQNXTCTK86	refund_reason:create	refund_reason	create	CreateRefundReason	Create RefundReason	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEW2J85H4WQ6X0V2RP	refund_reason:update	refund_reason	update	UpdateRefundReason	Update RefundReason	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFE0GKK9QJJCHNB5F6X	refund_reason:delete	refund_reason	delete	DeleteRefundReason	Delete RefundReason	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEEHTPCTM9MXXG2PTN	price_list:read	price_list	read	ReadPriceList	Read PriceList	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFE02TMTDXXX6DXGW20	price_list:create	price_list	create	CreatePriceList	Create PriceList	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEHE6A6P5N36KXREFX	price_list:update	price_list	update	UpdatePriceList	Update PriceList	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEBVRED6EF1V4MSJ5Z	price_list:delete	price_list	delete	DeletePriceList	Delete PriceList	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFENQJR6HNCH9D95N0X	price_preference:read	price_preference	read	ReadPricePreference	Read PricePreference	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEJG3QV6ZGTXCFAXTT	price_preference:create	price_preference	create	CreatePricePreference	Create PricePreference	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEPF4EXGPB8J8RZYKB	price_preference:update	price_preference	update	UpdatePricePreference	Update PricePreference	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEVT8ZJFHHTR526R14	price_preference:delete	price_preference	delete	DeletePricePreference	Delete PricePreference	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFE6AEC063QXAKD6PG5	price:read	price	read	ReadPrice	Read Price	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEYZBMDDJZJ5T1FJB1	price:create	price	create	CreatePrice	Create Price	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEP2TN0DF4ZTW2AQV7	price:update	price	update	UpdatePrice	Update Price	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEB7V9D445S9DM059G	price:delete	price	delete	DeletePrice	Delete Price	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFEXNRP97NRHRN77AY4	currency:read	currency	read	ReadCurrency	Read Currency	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFE1ZSY2WTWM68YTGDB	currency:create	currency	create	CreateCurrency	Create Currency	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFF5GQKKYQSV9XD6QED	currency:update	currency	update	UpdateCurrency	Update Currency	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFF27PJBKGFS5X87D26	currency:delete	currency	delete	DeleteCurrency	Delete Currency	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFF7A09ANG01A1QB4JN	product:read	product	read	ReadProduct	Read Product	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFCTZDEPCN4N93V3SM	product:create	product	create	CreateProduct	Create Product	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFHRRS7Q5RZXQCGGP1	product:update	product	update	UpdateProduct	Update Product	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFF58YGN3KCMV7XZ61	product:delete	product	delete	DeleteProduct	Delete Product	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFCQQGVD8X65C08ET9	product_variant:read	product_variant	read	ReadProductVariant	Read ProductVariant	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFDGCWJV8FQMBVBXT5	product_variant:create	product_variant	create	CreateProductVariant	Create ProductVariant	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFF7KGGPJKGBTTTWF66	product_variant:update	product_variant	update	UpdateProductVariant	Update ProductVariant	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFFMX8PN8DE8XFT7KG	product_variant:delete	product_variant	delete	DeleteProductVariant	Delete ProductVariant	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFRSESJHSJ230NKVDH	product_option:read	product_option	read	ReadProductOption	Read ProductOption	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFF08W0P8WD9ZS8JKEZ	product_option:create	product_option	create	CreateProductOption	Create ProductOption	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFN9BRD3YR2YZ4Z7DJ	product_option:update	product_option	update	UpdateProductOption	Update ProductOption	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFF55G1VP49ASZHS5S4	product_option:delete	product_option	delete	DeleteProductOption	Delete ProductOption	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFY71CBHGXAY53E8ZH	product_option_value:read	product_option_value	read	ReadProductOptionValue	Read ProductOptionValue	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFFWFETVWHH3X4RVX5J	product_option_value:create	product_option_value	create	CreateProductOptionValue	Create ProductOptionValue	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGD1FK5M68SBD5M2DW	product_option_value:update	product_option_value	update	UpdateProductOptionValue	Update ProductOptionValue	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGKDHPHTRGYV9C6SND	product_option_value:delete	product_option_value	delete	DeleteProductOptionValue	Delete ProductOptionValue	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGBDHHMBHNQ9SN9TN5	product_tag:read	product_tag	read	ReadProductTag	Read ProductTag	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGD9YY9F4BEZ5W84F0	product_tag:create	product_tag	create	CreateProductTag	Create ProductTag	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFG9C064Q8CA890C5H4	product_tag:update	product_tag	update	UpdateProductTag	Update ProductTag	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFG3AX3FZH5Z65R4XCH	product_tag:delete	product_tag	delete	DeleteProductTag	Delete ProductTag	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGKQZRJMC6C7Y5Q7X1	product_type:read	product_type	read	ReadProductType	Read ProductType	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGKW29ZE6D2K0828N9	product_type:create	product_type	create	CreateProductType	Create ProductType	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGFSRJCNRGSCPZ6EFY	product_type:update	product_type	update	UpdateProductType	Update ProductType	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGQ50QRMJPET27DDT5	product_type:delete	product_type	delete	DeleteProductType	Delete ProductType	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFG647M6JKASM990Q2W	product_category:read	product_category	read	ReadProductCategory	Read ProductCategory	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGXRDQ11HCMPE47KCB	product_category:create	product_category	create	CreateProductCategory	Create ProductCategory	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFG19D6ZNHDMVS041HF	product_category:update	product_category	update	UpdateProductCategory	Update ProductCategory	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGJT45XHM6VPVZ0AC9	product_category:delete	product_category	delete	DeleteProductCategory	Delete ProductCategory	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGZ4Q9A180C3YY95FW	product_collection:read	product_collection	read	ReadProductCollection	Read ProductCollection	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGN8S8C2GH2AJ2RXR1	product_collection:create	product_collection	create	CreateProductCollection	Create ProductCollection	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFGR023CSQW5KPCW61Q	product_collection:update	product_collection	update	UpdateProductCollection	Update ProductCollection	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFHZKQ9W7E0RQ834NG9	product_collection:delete	product_collection	delete	DeleteProductCollection	Delete ProductCollection	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFHQXDTBEGP2M68X5JG	campaign:read	campaign	read	ReadCampaign	Read Campaign	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFH2P4YV22N9AB3QRGH	campaign:create	campaign	create	CreateCampaign	Create Campaign	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFH1V001T70GVJ1F4BM	campaign:update	campaign	update	UpdateCampaign	Update Campaign	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFHEP4X5ZC3N4FJM3SC	campaign:delete	campaign	delete	DeleteCampaign	Delete Campaign	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFHAPBG06VTWQ5EVY14	promotion:read	promotion	read	ReadPromotion	Read Promotion	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFH460Q3Y2FH235K9J6	promotion:create	promotion	create	CreatePromotion	Create Promotion	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFH74T5V1ATYZJB6A6F	promotion:update	promotion	update	UpdatePromotion	Update Promotion	\N	2026-07-30 11:38:45.048+05:30	2026-07-30 11:38:45.048+05:30	\N
rpol_01KYRT7EFHXN6VVH2FQNFDA42Y	promotion:delete	promotion	delete	DeletePromotion	Delete Promotion	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFH72BSPFE95R991FCV	region:read	region	read	ReadRegion	Read Region	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFHXDJ6PZTF0S2TJZ3S	region:create	region	create	CreateRegion	Create Region	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFHEPTWYWK7F0487Z49	region:update	region	update	UpdateRegion	Update Region	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFHE8P6Z6N5GSHJJCK0	region:delete	region	delete	DeleteRegion	Delete Region	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFH2E6YT28S7B4D27B9	sales_channel:read	sales_channel	read	ReadSalesChannel	Read SalesChannel	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFHRTMN9PMVMGWS3F7K	sales_channel:create	sales_channel	create	CreateSalesChannel	Create SalesChannel	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFHFFK8HCVS8DMB3QT5	sales_channel:update	sales_channel	update	UpdateSalesChannel	Update SalesChannel	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFHNV9V9KVWVCZ9S3XA	sales_channel:delete	sales_channel	delete	DeleteSalesChannel	Delete SalesChannel	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJZQ559MV5R2JG4Z7K	store:read	store	read	ReadStore	Read Store	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJNQ5Z8VSND5YB4R5W	store:create	store	create	CreateStore	Create Store	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJ45FQZ5S64CZJNZ6G	store:update	store	update	UpdateStore	Update Store	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJGGTDR1X506195ZDB	store:delete	store	delete	DeleteStore	Delete Store	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJCRGP0A8X0N5FA0KB	store_locale:read	store_locale	read	ReadStoreLocale	Read StoreLocale	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJJRRVAF3JC59CNPMJ	store_locale:create	store_locale	create	CreateStoreLocale	Create StoreLocale	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJEJJ3648M647SN9N1	store_locale:update	store_locale	update	UpdateStoreLocale	Update StoreLocale	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJYBTV65Y9RFE1YM43	store_locale:delete	store_locale	delete	DeleteStoreLocale	Delete StoreLocale	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJWMHVT1CBZNPAFKGC	shipping_option:read	shipping_option	read	ReadShippingOption	Read ShippingOption	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJVKJBVVB5A1FJNHVQ	shipping_option:create	shipping_option	create	CreateShippingOption	Create ShippingOption	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJFYD2S313Y0VFEAK3	shipping_option:update	shipping_option	update	UpdateShippingOption	Update ShippingOption	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJRXQFYWG3KCXMEDAR	shipping_option:delete	shipping_option	delete	DeleteShippingOption	Delete ShippingOption	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJVFGKKMKGV47FZ3AC	shipping_option_type:read	shipping_option_type	read	ReadShippingOptionType	Read ShippingOptionType	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJJ7M2VJ98305CSY0A	shipping_option_type:create	shipping_option_type	create	CreateShippingOptionType	Create ShippingOptionType	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJVDPP73KZB5QP92T0	shipping_option_type:update	shipping_option_type	update	UpdateShippingOptionType	Update ShippingOptionType	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJEGNMHVDCWQ814EXC	shipping_option_type:delete	shipping_option_type	delete	DeleteShippingOptionType	Delete ShippingOptionType	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFJVBQFACA3PNTJ5VYX	shipping_profile:read	shipping_profile	read	ReadShippingProfile	Read ShippingProfile	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFK5GEAG19TJG69ZXWT	shipping_profile:create	shipping_profile	create	CreateShippingProfile	Create ShippingProfile	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFK8WC42WG0FMYRQ0DP	shipping_profile:update	shipping_profile	update	UpdateShippingProfile	Update ShippingProfile	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKV3WXG0MHVQ86GQ5H	shipping_profile:delete	shipping_profile	delete	DeleteShippingProfile	Delete ShippingProfile	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFK2C3YXFYDYS9B2WMT	fulfillment:read	fulfillment	read	ReadFulfillment	Read Fulfillment	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKJZDD31E3VANW90Q4	fulfillment:create	fulfillment	create	CreateFulfillment	Create Fulfillment	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKX8WT3A4VTPGNFZ36	fulfillment:update	fulfillment	update	UpdateFulfillment	Update Fulfillment	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKAV4WMB1CJA06CCS6	fulfillment:delete	fulfillment	delete	DeleteFulfillment	Delete Fulfillment	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKEZCBPM779CNY5JH4	fulfillment_provider:read	fulfillment_provider	read	ReadFulfillmentProvider	Read FulfillmentProvider	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKABDNZGKH93P7FBM4	fulfillment_provider:create	fulfillment_provider	create	CreateFulfillmentProvider	Create FulfillmentProvider	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKZ6MX346E21V3X352	fulfillment_provider:update	fulfillment_provider	update	UpdateFulfillmentProvider	Update FulfillmentProvider	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFK8756DHM4TGRN7T4G	fulfillment_provider:delete	fulfillment_provider	delete	DeleteFulfillmentProvider	Delete FulfillmentProvider	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKCVRX1MB5S87E5WB9	fulfillment_set:read	fulfillment_set	read	ReadFulfillmentSet	Read FulfillmentSet	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKQSC8SP2YC8W9RZXN	fulfillment_set:create	fulfillment_set	create	CreateFulfillmentSet	Create FulfillmentSet	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKSEDT1KPMGVYJPCT4	fulfillment_set:update	fulfillment_set	update	UpdateFulfillmentSet	Update FulfillmentSet	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKSGQ0T3BHWTZZPXWS	fulfillment_set:delete	fulfillment_set	delete	DeleteFulfillmentSet	Delete FulfillmentSet	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFKZ66G5F0N49T9H2TG	service_zone:read	service_zone	read	ReadServiceZone	Read ServiceZone	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMCYBC6KCG6TXJV1PX	service_zone:create	service_zone	create	CreateServiceZone	Create ServiceZone	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFM36M74NRSB3NA8T8N	service_zone:update	service_zone	update	UpdateServiceZone	Update ServiceZone	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMQDPJ18E37FWHZ9W5	service_zone:delete	service_zone	delete	DeleteServiceZone	Delete ServiceZone	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMEKG17M6G6SWV74VQ	file:read	file	read	ReadFile	Read File	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMWY1JTR0YBZ1XA6N4	file:create	file	create	CreateFile	Create File	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMS7RN2PWWSBBMARCQ	file:update	file	update	UpdateFile	Update File	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMHKF3G8ZFZG0T0WZW	file:delete	file	delete	DeleteFile	Delete File	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMT5GW39DNCJ1B65KS	notification:read	notification	read	ReadNotification	Read Notification	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMZ2X9F449H951QFC4	notification:create	notification	create	CreateNotification	Create Notification	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFM869NJBDHGD9K48ZT	notification:update	notification	update	UpdateNotification	Update Notification	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMDJYPE0M2D2NEA9VR	notification:delete	notification	delete	DeleteNotification	Delete Notification	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMHNGQCSQ55HG63FCF	workflow_execution:read	workflow_execution	read	ReadWorkflowExecution	Read WorkflowExecution	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMCD36FYP87RHCZTGV	workflow_execution:create	workflow_execution	create	CreateWorkflowExecution	Create WorkflowExecution	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMY5NHF3HC0RY62653	workflow_execution:update	workflow_execution	update	UpdateWorkflowExecution	Update WorkflowExecution	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFM3B7K1V1NY35CFFHJ	workflow_execution:delete	workflow_execution	delete	DeleteWorkflowExecution	Delete WorkflowExecution	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMR2G4RZ38PRRGJ3SY	tax_provider:read	tax_provider	read	ReadTaxProvider	Read TaxProvider	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFMB0FQBFNGZCN3PGJ9	tax_provider:create	tax_provider	create	CreateTaxProvider	Create TaxProvider	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFN6PRDTMC4CY1W6311	tax_provider:update	tax_provider	update	UpdateTaxProvider	Update TaxProvider	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNEE2Z3SFTK8N55Z4R	tax_provider:delete	tax_provider	delete	DeleteTaxProvider	Delete TaxProvider	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNG4WP0K37CYREBV0C	tax_rate:read	tax_rate	read	ReadTaxRate	Read TaxRate	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNP57PM5PJF5ZVXHGZ	tax_rate:create	tax_rate	create	CreateTaxRate	Create TaxRate	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNNBNACJPGNHAPGGCX	tax_rate:update	tax_rate	update	UpdateTaxRate	Update TaxRate	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNBMZCEGP7299VWSVD	tax_rate:delete	tax_rate	delete	DeleteTaxRate	Delete TaxRate	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNJ9S18B2J5V33ER0S	tax_region:read	tax_region	read	ReadTaxRegion	Read TaxRegion	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFN7XFCN2X2C3DWEEVM	tax_region:create	tax_region	create	CreateTaxRegion	Create TaxRegion	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFN36J89PSQCYX9VC8F	tax_region:update	tax_region	update	UpdateTaxRegion	Update TaxRegion	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNTXHSVPTJTJ5T8MGC	tax_region:delete	tax_region	delete	DeleteTaxRegion	Delete TaxRegion	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNABZ83AMC2Q4KX717	translation:read	translation	read	ReadTranslation	Read Translation	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNYKZDSKYNG8BYY9AK	translation:create	translation	create	CreateTranslation	Create Translation	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNX0HSG37QTWJ5G76J	translation:update	translation	update	UpdateTranslation	Update Translation	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNN8M3RZYS13MNKRSS	translation:delete	translation	delete	DeleteTranslation	Delete Translation	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFNQFPZ1SECV2H3PE8F	translation_setting:read	translation_setting	read	ReadTranslationSetting	Read TranslationSetting	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFP2J1WT164WQXZD490	translation_setting:create	translation_setting	create	CreateTranslationSetting	Create TranslationSetting	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPHMSASWW11FTK05JC	translation_setting:update	translation_setting	update	UpdateTranslationSetting	Update TranslationSetting	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPCTYGWR0K4MXFB01J	translation_setting:delete	translation_setting	delete	DeleteTranslationSetting	Delete TranslationSetting	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPC02PD0P7ADE7P2B5	user:read	user	read	ReadUser	Read User	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPQW74B3B2DQ6289YX	user:create	user	create	CreateUser	Create User	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPCW6FF8Q5J6YPT73H	user:update	user	update	UpdateUser	Update User	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPMMDYRNPR6REEXHKC	user:delete	user	delete	DeleteUser	Delete User	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPJE0NP63HPV7QHGE9	api_key:read	api_key	read	ReadApiKey	Read ApiKey	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPRCQNZX3R68RABPNJ	api_key:create	api_key	create	CreateApiKey	Create ApiKey	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFP04XTM9WMBKB3SVQ4	api_key:update	api_key	update	UpdateApiKey	Update ApiKey	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPYEB064B63DHTP64G	api_key:delete	api_key	delete	DeleteApiKey	Delete ApiKey	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFP32XR8VTFZVR8BSRF	invite:read	invite	read	ReadInvite	Read Invite	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPW35RTNP88DBBAXSK	invite:create	invite	create	CreateInvite	Create Invite	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPJ4DFK7AGC286SW11	invite:update	invite	update	UpdateInvite	Update Invite	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPV7BKFG7XNAC9MDEH	invite:delete	invite	delete	DeleteInvite	Delete Invite	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPK7BV282AH77XHFAQ	rbac_role:read	rbac_role	read	ReadRbacRole	Read RbacRole	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFPPGEGM4AVRYZBHAVM	rbac_role:create	rbac_role	create	CreateRbacRole	Create RbacRole	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFQTDQ9JSF59M8G9WEV	rbac_role:update	rbac_role	update	UpdateRbacRole	Update RbacRole	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFQ2KQW3TEYNZPTTA0P	rbac_role:delete	rbac_role	delete	DeleteRbacRole	Delete RbacRole	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFQFSHN9J6TFHBK0ZK9	rbac_policy:read	rbac_policy	read	ReadRbacPolicy	Read RbacPolicy	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFQ7E44VKR830SW47ZK	rbac_policy:create	rbac_policy	create	CreateRbacPolicy	Create RbacPolicy	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFQFEMTD5X19AKVR1FX	rbac_policy:update	rbac_policy	update	UpdateRbacPolicy	Update RbacPolicy	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRT7EFQRS3MHJ0A7J25KPQQ	rbac_policy:delete	rbac_policy	delete	DeleteRbacPolicy	Delete RbacPolicy	\N	2026-07-30 11:38:45.049+05:30	2026-07-30 11:38:45.049+05:30	\N
rpol_01KYRTC7MHG6XBNGB1D7R2W7T2	seller:read	seller	read	ReadSeller	Read seller	\N	2026-07-30 11:41:21.874+05:30	2026-07-30 11:41:21.874+05:30	\N
rpol_01KYRTC7MHXXH0M394FHGHQ89S	seller:create	seller	create	CreateSeller	Create seller	\N	2026-07-30 11:41:21.874+05:30	2026-07-30 11:41:21.874+05:30	\N
rpol_01KYRTC7MHFVSZMTZ7JFKSXGYQ	seller:update	seller	update	UpdateSeller	Update seller	\N	2026-07-30 11:41:21.874+05:30	2026-07-30 11:41:21.874+05:30	\N
rpol_01KYRTC7MHN1WKAAWZ2R37KPP4	seller:delete	seller	delete	DeleteSeller	Delete seller	\N	2026-07-30 11:41:21.874+05:30	2026-07-30 11:41:21.874+05:30	\N
rpol_01KYRTC7MH0C9RM827CTMF8Y05	seller_member:read	seller_member	read	ReadSellerMember	Read seller member	\N	2026-07-30 11:41:21.874+05:30	2026-07-30 11:41:21.874+05:30	\N
rpol_01KYRTC7MHN61EESS7ZTVEJWGW	seller_member:create	seller_member	create	CreateSellerMember	Create seller member	\N	2026-07-30 11:41:21.874+05:30	2026-07-30 11:41:21.874+05:30	\N
rpol_01KYRTC7MJCV70NNE67241VCJ4	seller_member:update	seller_member	update	UpdateSellerMember	Update seller member	\N	2026-07-30 11:41:21.874+05:30	2026-07-30 11:41:21.874+05:30	\N
rpol_01KYRTC7MJ4W4P0Q036C41EF66	seller_member:delete	seller_member	delete	DeleteSellerMember	Delete seller member	\N	2026-07-30 11:41:21.874+05:30	2026-07-30 11:41:21.874+05:30	\N
\.


--
-- Data for Name: rbac_role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbac_role (id, name, description, metadata, created_at, updated_at, deleted_at) FROM stdin;
role_super_admin	Super Admin	Super admin role with full access to all resources and operations	\N	2026-07-30 11:38:44.733+05:30	2026-07-30 11:38:44.733+05:30	\N
\.


--
-- Data for Name: rbac_role_parent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbac_role_parent (id, role_id, parent_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: rbac_role_policy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rbac_role_policy (id, role_id, policy_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
rlpl_super_admin	role_super_admin	rpol_super_admin	\N	2026-07-30 11:38:44.759+05:30	2026-07-30 11:38:44.759+05:30	\N
\.


--
-- Data for Name: refund; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refund (id, amount, raw_amount, payment_id, created_at, updated_at, deleted_at, created_by, metadata, refund_reason_id, note) FROM stdin;
\.


--
-- Data for Name: refund_reason; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refund_reason (id, label, description, metadata, created_at, updated_at, deleted_at, code) FROM stdin;
refr_01KYRT75007V9XN79K02GKSPYH	Shipping Issue	Refund due to lost, delayed, or misdelivered shipment	\N	2026-07-30 11:38:35.133951+05:30	2026-07-30 11:38:35.133951+05:30	\N	shipping_issue
refr_01KYRT7501K6PJ4JC6XVDXQH0A	Customer Care Adjustment	Refund given as goodwill or compensation for inconvenience	\N	2026-07-30 11:38:35.133951+05:30	2026-07-30 11:38:35.133951+05:30	\N	customer_care_adjustment
refr_01KYRT750177CJCTNE699S3H9D	Pricing Error	Refund to correct an overcharge, missing discount, or incorrect price	\N	2026-07-30 11:38:35.133951+05:30	2026-07-30 11:38:35.133951+05:30	\N	pricing_error
\.


--
-- Data for Name: region; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.region (id, name, currency_code, metadata, created_at, updated_at, deleted_at, automatic_taxes) FROM stdin;
reg_01KYRTQJ9WJB9K699PSVYKHY55	India	inr	\N	2026-07-30 11:47:33.253+05:30	2026-07-30 11:47:33.253+05:30	\N	t
\.


--
-- Data for Name: region_country; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.region_country (iso_2, iso_3, num_code, name, display_name, region_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
af	afg	004	AFGHANISTAN	Afghanistan	\N	\N	2026-07-30 11:38:44.715+05:30	2026-07-30 11:38:44.715+05:30	\N
al	alb	008	ALBANIA	Albania	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
dz	dza	012	ALGERIA	Algeria	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
as	asm	016	AMERICAN SAMOA	American Samoa	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ad	and	020	ANDORRA	Andorra	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ao	ago	024	ANGOLA	Angola	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ai	aia	660	ANGUILLA	Anguilla	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
aq	ata	010	ANTARCTICA	Antarctica	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ag	atg	028	ANTIGUA AND BARBUDA	Antigua and Barbuda	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ar	arg	032	ARGENTINA	Argentina	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
am	arm	051	ARMENIA	Armenia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
aw	abw	533	ARUBA	Aruba	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
au	aus	036	AUSTRALIA	Australia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
at	aut	040	AUSTRIA	Austria	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
az	aze	031	AZERBAIJAN	Azerbaijan	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bs	bhs	044	BAHAMAS	Bahamas	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bh	bhr	048	BAHRAIN	Bahrain	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bd	bgd	050	BANGLADESH	Bangladesh	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bb	brb	052	BARBADOS	Barbados	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
by	blr	112	BELARUS	Belarus	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
be	bel	056	BELGIUM	Belgium	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bz	blz	084	BELIZE	Belize	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bj	ben	204	BENIN	Benin	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bm	bmu	060	BERMUDA	Bermuda	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bt	btn	064	BHUTAN	Bhutan	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bo	bol	068	BOLIVIA	Bolivia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bq	bes	535	BONAIRE, SINT EUSTATIUS AND SABA	Bonaire, Sint Eustatius and Saba	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ba	bih	070	BOSNIA AND HERZEGOVINA	Bosnia and Herzegovina	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bw	bwa	072	BOTSWANA	Botswana	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bv	bvd	074	BOUVET ISLAND	Bouvet Island	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
br	bra	076	BRAZIL	Brazil	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
io	iot	086	BRITISH INDIAN OCEAN TERRITORY	British Indian Ocean Territory	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bn	brn	096	BRUNEI DARUSSALAM	Brunei Darussalam	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bg	bgr	100	BULGARIA	Bulgaria	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bf	bfa	854	BURKINA FASO	Burkina Faso	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
bi	bdi	108	BURUNDI	Burundi	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
kh	khm	116	CAMBODIA	Cambodia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cm	cmr	120	CAMEROON	Cameroon	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ca	can	124	CANADA	Canada	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cv	cpv	132	CAPE VERDE	Cape Verde	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ky	cym	136	CAYMAN ISLANDS	Cayman Islands	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cf	caf	140	CENTRAL AFRICAN REPUBLIC	Central African Republic	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
td	tcd	148	CHAD	Chad	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cl	chl	152	CHILE	Chile	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cn	chn	156	CHINA	China	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cx	cxr	162	CHRISTMAS ISLAND	Christmas Island	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cc	cck	166	COCOS (KEELING) ISLANDS	Cocos (Keeling) Islands	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
co	col	170	COLOMBIA	Colombia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
km	com	174	COMOROS	Comoros	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cg	cog	178	CONGO	Congo	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cd	cod	180	CONGO, THE DEMOCRATIC REPUBLIC OF THE	Congo, the Democratic Republic of the	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ck	cok	184	COOK ISLANDS	Cook Islands	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cr	cri	188	COSTA RICA	Costa Rica	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ci	civ	384	COTE D'IVOIRE	Cote D'Ivoire	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
hr	hrv	191	CROATIA	Croatia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cu	cub	192	CUBA	Cuba	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cw	cuw	531	CURAÇAO	Curaçao	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cy	cyp	196	CYPRUS	Cyprus	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
cz	cze	203	CZECH REPUBLIC	Czech Republic	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
dk	dnk	208	DENMARK	Denmark	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
dj	dji	262	DJIBOUTI	Djibouti	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
dm	dma	212	DOMINICA	Dominica	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
do	dom	214	DOMINICAN REPUBLIC	Dominican Republic	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ec	ecu	218	ECUADOR	Ecuador	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
eg	egy	818	EGYPT	Egypt	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
sv	slv	222	EL SALVADOR	El Salvador	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gq	gnq	226	EQUATORIAL GUINEA	Equatorial Guinea	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
er	eri	232	ERITREA	Eritrea	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ee	est	233	ESTONIA	Estonia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
et	eth	231	ETHIOPIA	Ethiopia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
fk	flk	238	FALKLAND ISLANDS (MALVINAS)	Falkland Islands (Malvinas)	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
fo	fro	234	FAROE ISLANDS	Faroe Islands	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
fj	fji	242	FIJI	Fiji	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
fi	fin	246	FINLAND	Finland	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
fr	fra	250	FRANCE	France	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gf	guf	254	FRENCH GUIANA	French Guiana	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
pf	pyf	258	FRENCH POLYNESIA	French Polynesia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
tf	atf	260	FRENCH SOUTHERN TERRITORIES	French Southern Territories	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ga	gab	266	GABON	Gabon	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gm	gmb	270	GAMBIA	Gambia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ge	geo	268	GEORGIA	Georgia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
de	deu	276	GERMANY	Germany	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gh	gha	288	GHANA	Ghana	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gi	gib	292	GIBRALTAR	Gibraltar	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gr	grc	300	GREECE	Greece	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gl	grl	304	GREENLAND	Greenland	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gd	grd	308	GRENADA	Grenada	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gp	glp	312	GUADELOUPE	Guadeloupe	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gu	gum	316	GUAM	Guam	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gt	gtm	320	GUATEMALA	Guatemala	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gg	ggy	831	GUERNSEY	Guernsey	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gn	gin	324	GUINEA	Guinea	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gw	gnb	624	GUINEA-BISSAU	Guinea-Bissau	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
gy	guy	328	GUYANA	Guyana	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ht	hti	332	HAITI	Haiti	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
hm	hmd	334	HEARD ISLAND AND MCDONALD ISLANDS	Heard Island And Mcdonald Islands	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
va	vat	336	HOLY SEE (VATICAN CITY STATE)	Holy See (Vatican City State)	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
hn	hnd	340	HONDURAS	Honduras	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
hk	hkg	344	HONG KONG	Hong Kong	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
hu	hun	348	HUNGARY	Hungary	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
is	isl	352	ICELAND	Iceland	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
id	idn	360	INDONESIA	Indonesia	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ir	irn	364	IRAN, ISLAMIC REPUBLIC OF	Iran, Islamic Republic of	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
iq	irq	368	IRAQ	Iraq	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ie	irl	372	IRELAND	Ireland	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
im	imn	833	ISLE OF MAN	Isle Of Man	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
il	isr	376	ISRAEL	Israel	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
it	ita	380	ITALY	Italy	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
jm	jam	388	JAMAICA	Jamaica	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
jp	jpn	392	JAPAN	Japan	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
je	jey	832	JERSEY	Jersey	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
jo	jor	400	JORDAN	Jordan	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
kz	kaz	398	KAZAKHSTAN	Kazakhstan	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ke	ken	404	KENYA	Kenya	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
ki	kir	296	KIRIBATI	Kiribati	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
kp	prk	408	KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF	Korea, Democratic People's Republic of	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
kr	kor	410	KOREA, REPUBLIC OF	Korea, Republic of	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
xk	xkx	900	KOSOVO	Kosovo	\N	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:38:44.716+05:30	\N
kw	kwt	414	KUWAIT	Kuwait	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
kg	kgz	417	KYRGYZSTAN	Kyrgyzstan	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
la	lao	418	LAO PEOPLE'S DEMOCRATIC REPUBLIC	Lao People's Democratic Republic	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
lv	lva	428	LATVIA	Latvia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
lb	lbn	422	LEBANON	Lebanon	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ls	lso	426	LESOTHO	Lesotho	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
lr	lbr	430	LIBERIA	Liberia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ly	lby	434	LIBYA	Libya	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
li	lie	438	LIECHTENSTEIN	Liechtenstein	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
lt	ltu	440	LITHUANIA	Lithuania	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
lu	lux	442	LUXEMBOURG	Luxembourg	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mo	mac	446	MACAO	Macao	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mg	mdg	450	MADAGASCAR	Madagascar	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mw	mwi	454	MALAWI	Malawi	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
my	mys	458	MALAYSIA	Malaysia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mv	mdv	462	MALDIVES	Maldives	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ml	mli	466	MALI	Mali	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mt	mlt	470	MALTA	Malta	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mh	mhl	584	MARSHALL ISLANDS	Marshall Islands	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mq	mtq	474	MARTINIQUE	Martinique	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mr	mrt	478	MAURITANIA	Mauritania	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mu	mus	480	MAURITIUS	Mauritius	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
yt	myt	175	MAYOTTE	Mayotte	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mx	mex	484	MEXICO	Mexico	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
fm	fsm	583	MICRONESIA, FEDERATED STATES OF	Micronesia, Federated States of	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
md	mda	498	MOLDOVA, REPUBLIC OF	Moldova, Republic of	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mc	mco	492	MONACO	Monaco	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mn	mng	496	MONGOLIA	Mongolia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
me	mne	499	MONTENEGRO	Montenegro	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ms	msr	500	MONTSERRAT	Montserrat	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ma	mar	504	MOROCCO	Morocco	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mz	moz	508	MOZAMBIQUE	Mozambique	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mm	mmr	104	MYANMAR	Myanmar	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
na	nam	516	NAMIBIA	Namibia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
nr	nru	520	NAURU	Nauru	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
np	npl	524	NEPAL	Nepal	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
nl	nld	528	NETHERLANDS	Netherlands	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
nc	ncl	540	NEW CALEDONIA	New Caledonia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
nz	nzl	554	NEW ZEALAND	New Zealand	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ni	nic	558	NICARAGUA	Nicaragua	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ne	ner	562	NIGER	Niger	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ng	nga	566	NIGERIA	Nigeria	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
nu	niu	570	NIUE	Niue	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
nf	nfk	574	NORFOLK ISLAND	Norfolk Island	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mk	mkd	807	NORTH MACEDONIA	North Macedonia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mp	mnp	580	NORTHERN MARIANA ISLANDS	Northern Mariana Islands	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
no	nor	578	NORWAY	Norway	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
om	omn	512	OMAN	Oman	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pk	pak	586	PAKISTAN	Pakistan	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pw	plw	585	PALAU	Palau	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ps	pse	275	PALESTINIAN TERRITORY, OCCUPIED	Palestinian Territory, Occupied	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pa	pan	591	PANAMA	Panama	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pg	png	598	PAPUA NEW GUINEA	Papua New Guinea	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
py	pry	600	PARAGUAY	Paraguay	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pe	per	604	PERU	Peru	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ph	phl	608	PHILIPPINES	Philippines	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pn	pcn	612	PITCAIRN	Pitcairn	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pl	pol	616	POLAND	Poland	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pt	prt	620	PORTUGAL	Portugal	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pr	pri	630	PUERTO RICO	Puerto Rico	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
qa	qat	634	QATAR	Qatar	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
re	reu	638	REUNION	Reunion	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ro	rom	642	ROMANIA	Romania	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ru	rus	643	RUSSIAN FEDERATION	Russian Federation	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
rw	rwa	646	RWANDA	Rwanda	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
bl	blm	652	SAINT BARTHÉLEMY	Saint Barthélemy	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sh	shn	654	SAINT HELENA	Saint Helena	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
kn	kna	659	SAINT KITTS AND NEVIS	Saint Kitts and Nevis	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
lc	lca	662	SAINT LUCIA	Saint Lucia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
mf	maf	663	SAINT MARTIN (FRENCH PART)	Saint Martin (French part)	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
pm	spm	666	SAINT PIERRE AND MIQUELON	Saint Pierre and Miquelon	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
vc	vct	670	SAINT VINCENT AND THE GRENADINES	Saint Vincent and the Grenadines	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ws	wsm	882	SAMOA	Samoa	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sm	smr	674	SAN MARINO	San Marino	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
st	stp	678	SAO TOME AND PRINCIPE	Sao Tome and Principe	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sa	sau	682	SAUDI ARABIA	Saudi Arabia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sn	sen	686	SENEGAL	Senegal	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
rs	srb	688	SERBIA	Serbia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sc	syc	690	SEYCHELLES	Seychelles	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sl	sle	694	SIERRA LEONE	Sierra Leone	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sg	sgp	702	SINGAPORE	Singapore	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sx	sxm	534	SINT MAARTEN	Sint Maarten	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sk	svk	703	SLOVAKIA	Slovakia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
si	svn	705	SLOVENIA	Slovenia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sb	slb	090	SOLOMON ISLANDS	Solomon Islands	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
so	som	706	SOMALIA	Somalia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
za	zaf	710	SOUTH AFRICA	South Africa	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
gs	sgs	239	SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS	South Georgia and the South Sandwich Islands	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ss	ssd	728	SOUTH SUDAN	South Sudan	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
es	esp	724	SPAIN	Spain	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
lk	lka	144	SRI LANKA	Sri Lanka	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sd	sdn	729	SUDAN	Sudan	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sr	sur	740	SURINAME	Suriname	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sj	sjm	744	SVALBARD AND JAN MAYEN	Svalbard and Jan Mayen	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sz	swz	748	SWAZILAND	Swaziland	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
se	swe	752	SWEDEN	Sweden	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ch	che	756	SWITZERLAND	Switzerland	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
sy	syr	760	SYRIAN ARAB REPUBLIC	Syrian Arab Republic	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tw	twn	158	TAIWAN, PROVINCE OF CHINA	Taiwan, Province of China	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tj	tjk	762	TAJIKISTAN	Tajikistan	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tz	tza	834	TANZANIA, UNITED REPUBLIC OF	Tanzania, United Republic of	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
th	tha	764	THAILAND	Thailand	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tl	tls	626	TIMOR LESTE	Timor Leste	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tg	tgo	768	TOGO	Togo	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tk	tkl	772	TOKELAU	Tokelau	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
to	ton	776	TONGA	Tonga	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tt	tto	780	TRINIDAD AND TOBAGO	Trinidad and Tobago	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tn	tun	788	TUNISIA	Tunisia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tr	tur	792	TURKEY	Turkey	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tm	tkm	795	TURKMENISTAN	Turkmenistan	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tc	tca	796	TURKS AND CAICOS ISLANDS	Turks and Caicos Islands	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
tv	tuv	798	TUVALU	Tuvalu	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ug	uga	800	UGANDA	Uganda	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ua	ukr	804	UKRAINE	Ukraine	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ae	are	784	UNITED ARAB EMIRATES	United Arab Emirates	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
gb	gbr	826	UNITED KINGDOM	United Kingdom	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
us	usa	840	UNITED STATES	United States	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
um	umi	581	UNITED STATES MINOR OUTLYING ISLANDS	United States Minor Outlying Islands	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
uy	ury	858	URUGUAY	Uruguay	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
uz	uzb	860	UZBEKISTAN	Uzbekistan	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
vu	vut	548	VANUATU	Vanuatu	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ve	ven	862	VENEZUELA	Venezuela	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
vn	vnm	704	VIET NAM	Viet Nam	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
vg	vgb	092	VIRGIN ISLANDS, BRITISH	Virgin Islands, British	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
vi	vir	850	VIRGIN ISLANDS, U.S.	Virgin Islands, U.S.	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
wf	wlf	876	WALLIS AND FUTUNA	Wallis and Futuna	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
eh	esh	732	WESTERN SAHARA	Western Sahara	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ye	yem	887	YEMEN	Yemen	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
zm	zmb	894	ZAMBIA	Zambia	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
zw	zwe	716	ZIMBABWE	Zimbabwe	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
ax	ala	248	ÅLAND ISLANDS	Åland Islands	\N	\N	2026-07-30 11:38:44.717+05:30	2026-07-30 11:38:44.717+05:30	\N
in	ind	356	INDIA	India	reg_01KYRTQJ9WJB9K699PSVYKHY55	\N	2026-07-30 11:38:44.716+05:30	2026-07-30 11:47:33.253+05:30	\N
\.


--
-- Data for Name: region_payment_provider; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.region_payment_provider (region_id, payment_provider_id, id, created_at, updated_at, deleted_at) FROM stdin;
reg_01KYRTQJ9WJB9K699PSVYKHY55	pp_system_default	regpp_01KYRTQJB6ACZRCT14JMGB1078	2026-07-30 11:47:33.28437+05:30	2026-07-30 11:47:33.28437+05:30	\N
\.


--
-- Data for Name: reservation_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservation_item (id, created_at, updated_at, deleted_at, line_item_id, location_id, quantity, external_id, description, created_by, metadata, inventory_item_id, allow_backorder, raw_quantity) FROM stdin;
\.


--
-- Data for Name: return; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return (id, order_id, claim_id, exchange_id, order_version, display_id, status, no_notification, refund_amount, raw_refund_amount, metadata, created_at, updated_at, deleted_at, received_at, canceled_at, location_id, requested_at, created_by) FROM stdin;
\.


--
-- Data for Name: return_fulfillment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_fulfillment (return_id, fulfillment_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: return_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_item (id, return_id, reason_id, item_id, quantity, raw_quantity, received_quantity, raw_received_quantity, note, metadata, created_at, updated_at, deleted_at, damaged_quantity, raw_damaged_quantity) FROM stdin;
\.


--
-- Data for Name: return_reason; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_reason (id, value, label, description, metadata, parent_return_reason_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review (id, display_id, reference, rating, customer_note, seller_note, status, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sales_channel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_channel (id, name, description, is_disabled, metadata, created_at, updated_at, deleted_at) FROM stdin;
sc_01KYRTC7GDYH13MCEX0HS51H31	Wholesale Channel	Wholesale channel for bulk buyers.	f	\N	2026-07-30 11:41:21.741+05:30	2026-07-30 11:49:15.733+05:30	\N
\.


--
-- Data for Name: sales_channel_stock_location; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_channel_stock_location (sales_channel_id, stock_location_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: script_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.script_migrations (id, script_name, created_at, finished_at) FROM stdin;
1	create-super-admin-role.js	2026-07-30 11:39:07.788627+05:30	2026-07-30 11:39:07.793781+05:30
2	migrate-normalize-currency-codes-normalization.js	2026-07-30 11:39:07.801066+05:30	2026-07-30 11:39:07.843936+05:30
3	migrate-product-option-link-ids.js	2026-07-30 11:39:07.847122+05:30	2026-07-30 11:39:07.853068+05:30
4	migrate-product-shipping-profile.js	2026-07-30 11:39:07.856972+05:30	2026-07-30 11:39:07.876218+05:30
5	migrate-tax-region-provider.js	2026-07-30 11:39:07.879822+05:30	2026-07-30 11:39:07.886698+05:30
6	reconcile-inventory-reserved-quantity.js	2026-07-30 11:39:07.890362+05:30	2026-07-30 11:39:07.900856+05:30
7	drop-fulfillment-global-unique-indexes.js	2026-07-30 11:39:07.90358+05:30	2026-07-30 11:39:07.914267+05:30
\.


--
-- Data for Name: seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller (id, name, handle, email, description, logo, banner, website_url, external_id, currency_code, status, status_reason, is_premium, closed_from, closed_to, metadata, created_at, updated_at, deleted_at, closure_note, phone, approved_at, rejected_at) FROM stdin;
\.


--
-- Data for Name: seller_address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_address (id, company, first_name, last_name, address_1, address_2, city, country_code, province, postal_code, phone, metadata, seller_id, created_at, updated_at, deleted_at, name) FROM stdin;
\.


--
-- Data for Name: seller_member; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_member (id, seller_id, member_id, role_id, is_owner, metadata, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: seller_seller_customer_customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_seller_customer_customer (seller_id, customer_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: seller_seller_fulfillment_fulfillment_set; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_seller_fulfillment_fulfillment_set (seller_id, fulfillment_set_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: seller_seller_fulfillment_service_zone; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_seller_fulfillment_service_zone (seller_id, service_zone_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: seller_seller_payout_payout_account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_seller_payout_payout_account (seller_id, payout_account_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: seller_seller_review_review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_seller_review_review (seller_id, review_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: service_zone; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_zone (id, name, metadata, fulfillment_set_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: shipping_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_option (id, name, price_type, service_zone_id, shipping_profile_id, provider_id, data, metadata, shipping_option_type_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: shipping_option_price_set; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_option_price_set (shipping_option_id, price_set_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: shipping_option_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_option_rule (id, attribute, operator, value, shipping_option_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: shipping_option_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_option_type (id, label, description, code, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: shipping_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_profile (id, name, type, metadata, created_at, updated_at, deleted_at) FROM stdin;
sp_01KYRT84RX1HZCRBCAWWEKB8N5	Default Shipping Profile	default	\N	2026-07-30 11:39:07.869+05:30	2026-07-30 11:39:07.869+05:30	\N
\.


--
-- Data for Name: stock_location; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_location (id, created_at, updated_at, deleted_at, name, address_id, metadata) FROM stdin;
\.


--
-- Data for Name: stock_location_address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_location_address (id, created_at, updated_at, deleted_at, address_1, address_2, company, city, country_code, phone, province, postal_code, metadata) FROM stdin;
\.


--
-- Data for Name: stock_location_stock_location_seller_seller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_location_stock_location_seller_seller (stock_location_id, seller_id, id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: store; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.store (id, name, default_sales_channel_id, default_region_id, default_location_id, metadata, created_at, updated_at, deleted_at) FROM stdin;
store_01KYRTC7HX1YPYRV45RSWTWH7N	Medusa Store	sc_01KYRTC7GDYH13MCEX0HS51H31	reg_01KYRTQJ9WJB9K699PSVYKHY55	\N	\N	2026-07-30 11:41:21.788558+05:30	2026-07-30 11:41:21.788558+05:30	\N
\.


--
-- Data for Name: store_currency; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.store_currency (id, currency_code, is_default, store_id, created_at, updated_at, deleted_at) FROM stdin;
stocur_01KYRTRHYZ40656E5QYGYMYBVT	inr	t	store_01KYRTC7HX1YPYRV45RSWTWH7N	2026-07-30 11:48:05.658023+05:30	2026-07-30 11:48:05.658023+05:30	\N
\.


--
-- Data for Name: store_locale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.store_locale (id, locale_code, store_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: tax_provider; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_provider (id, is_enabled, created_at, updated_at, deleted_at) FROM stdin;
tp_system	t	2026-07-30 11:38:44.748+05:30	2026-07-30 11:38:44.748+05:30	\N
\.


--
-- Data for Name: tax_rate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_rate (id, rate, code, name, is_default, is_combinable, tax_region_id, metadata, created_at, updated_at, created_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: tax_rate_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_rate_rule (id, tax_rate_id, reference_id, reference, metadata, created_at, updated_at, created_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: tax_region; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_region (id, provider_id, country_code, province_code, parent_id, metadata, created_at, updated_at, created_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, first_name, last_name, email, avatar_url, metadata, created_at, updated_at, deleted_at) FROM stdin;
user_01KYRTHYC4XESSF1DJ5M6XG0R0	Ashish	Bansal	ashishbansaldev@gmail.com	\N	\N	2026-07-30 11:44:28.997+05:30	2026-07-30 11:47:52.389+05:30	\N
\.


--
-- Data for Name: user_preference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preference (id, user_id, key, value, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: user_rbac_role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_rbac_role (user_id, rbac_role_id, id, created_at, updated_at, deleted_at) FROM stdin;
user_01KYRTHYC4XESSF1DJ5M6XG0R0	role_super_admin	userrole_01KYRTHYCJHWM3RTBWN84TFY6Q	2026-07-30 11:44:29.00977+05:30	2026-07-30 11:44:29.00977+05:30	\N
\.


--
-- Data for Name: view_configuration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.view_configuration (id, entity, name, user_id, is_system_default, configuration, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: workflow_execution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_execution (id, workflow_id, transaction_id, execution, context, state, created_at, updated_at, deleted_at, retention_time, run_id) FROM stdin;
\.


--
-- Name: link_module_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.link_module_migrations_id_seq', 50, true);


--
-- Name: mikro_orm_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mikro_orm_migrations_id_seq', 201, true);


--
-- Name: order_change_action_ordering_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_change_action_ordering_seq', 1, false);


--
-- Name: order_claim_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_claim_display_id_seq', 1, false);


--
-- Name: order_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_display_id_seq', 1, false);


--
-- Name: order_exchange_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_exchange_display_id_seq', 1, false);


--
-- Name: order_group_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_group_display_id_seq', 1, false);


--
-- Name: payout_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payout_display_id_seq', 1, false);


--
-- Name: product_change_action_ordering_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_change_action_ordering_seq', 1, false);


--
-- Name: return_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.return_display_id_seq', 1, false);


--
-- Name: review_display_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_display_id_seq', 1, false);


--
-- Name: script_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.script_migrations_id_seq', 7, true);


--
-- Name: account_holder account_holder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_holder
    ADD CONSTRAINT account_holder_pkey PRIMARY KEY (id);


--
-- Name: api_key api_key_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_key
    ADD CONSTRAINT api_key_pkey PRIMARY KEY (id);


--
-- Name: application_method_buy_rules application_method_buy_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_pkey PRIMARY KEY (application_method_id, promotion_rule_id);


--
-- Name: application_method_target_rules application_method_target_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_pkey PRIMARY KEY (application_method_id, promotion_rule_id);


--
-- Name: auth_identity auth_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_identity
    ADD CONSTRAINT auth_identity_pkey PRIMARY KEY (id);


--
-- Name: auth_mfa_factor auth_mfa_factor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_mfa_factor
    ADD CONSTRAINT auth_mfa_factor_pkey PRIMARY KEY (id);


--
-- Name: auth_mfa_recovery_code auth_mfa_recovery_code_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_mfa_recovery_code
    ADD CONSTRAINT auth_mfa_recovery_code_pkey PRIMARY KEY (id);


--
-- Name: auth_password_reset_token auth_password_reset_token_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_pkey PRIMARY KEY (id);


--
-- Name: auth_verification auth_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_verification
    ADD CONSTRAINT auth_verification_pkey PRIMARY KEY (id);


--
-- Name: capture capture_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capture
    ADD CONSTRAINT capture_pkey PRIMARY KEY (id);


--
-- Name: cart_address cart_address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_address
    ADD CONSTRAINT cart_address_pkey PRIMARY KEY (id);


--
-- Name: cart_line_item_adjustment cart_line_item_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_line_item_adjustment
    ADD CONSTRAINT cart_line_item_adjustment_pkey PRIMARY KEY (id);


--
-- Name: cart_line_item_offer_offer cart_line_item_offer_offer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_line_item_offer_offer
    ADD CONSTRAINT cart_line_item_offer_offer_pkey PRIMARY KEY (line_item_id, offer_id);


--
-- Name: cart_line_item cart_line_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_line_item
    ADD CONSTRAINT cart_line_item_pkey PRIMARY KEY (id);


--
-- Name: cart_line_item_tax_line cart_line_item_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_line_item_tax_line
    ADD CONSTRAINT cart_line_item_tax_line_pkey PRIMARY KEY (id);


--
-- Name: cart_payment_collection cart_payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_payment_collection
    ADD CONSTRAINT cart_payment_collection_pkey PRIMARY KEY (cart_id, payment_collection_id);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- Name: cart_promotion cart_promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_promotion
    ADD CONSTRAINT cart_promotion_pkey PRIMARY KEY (cart_id, promotion_id);


--
-- Name: cart_shipping_method_adjustment cart_shipping_method_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_shipping_method_adjustment
    ADD CONSTRAINT cart_shipping_method_adjustment_pkey PRIMARY KEY (id);


--
-- Name: cart_shipping_method cart_shipping_method_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_shipping_method
    ADD CONSTRAINT cart_shipping_method_pkey PRIMARY KEY (id);


--
-- Name: cart_shipping_method_tax_line cart_shipping_method_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_shipping_method_tax_line
    ADD CONSTRAINT cart_shipping_method_tax_line_pkey PRIMARY KEY (id);


--
-- Name: commission_line commission_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_line
    ADD CONSTRAINT commission_line_pkey PRIMARY KEY (id);


--
-- Name: commission_rate commission_rate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_rate
    ADD CONSTRAINT commission_rate_pkey PRIMARY KEY (id);


--
-- Name: commission_rate_value commission_rate_value_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_rate_value
    ADD CONSTRAINT commission_rate_value_pkey PRIMARY KEY (id);


--
-- Name: commission_rule commission_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_rule
    ADD CONSTRAINT commission_rule_pkey PRIMARY KEY (id);


--
-- Name: credit_line credit_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_line
    ADD CONSTRAINT credit_line_pkey PRIMARY KEY (id);


--
-- Name: currency currency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (code);


--
-- Name: customer_account_holder customer_account_holder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account_holder
    ADD CONSTRAINT customer_account_holder_pkey PRIMARY KEY (customer_id, account_holder_id);


--
-- Name: customer_address customer_address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT customer_address_pkey PRIMARY KEY (id);


--
-- Name: customer_customer_group_seller_seller customer_customer_group_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_customer_group_seller_seller
    ADD CONSTRAINT customer_customer_group_seller_seller_pkey PRIMARY KEY (customer_group_id, seller_id);


--
-- Name: customer_customer_review_review customer_customer_review_review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_customer_review_review
    ADD CONSTRAINT customer_customer_review_review_pkey PRIMARY KEY (customer_id, review_id);


--
-- Name: customer_group_customer customer_group_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_pkey PRIMARY KEY (id);


--
-- Name: customer_group customer_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_group
    ADD CONSTRAINT customer_group_pkey PRIMARY KEY (id);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_address fulfillment_address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_address
    ADD CONSTRAINT fulfillment_address_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_item fulfillment_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_item
    ADD CONSTRAINT fulfillment_item_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_label fulfillment_label_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_label
    ADD CONSTRAINT fulfillment_label_pkey PRIMARY KEY (id);


--
-- Name: fulfillment fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_provider fulfillment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_provider
    ADD CONSTRAINT fulfillment_provider_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_set fulfillment_set_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_set
    ADD CONSTRAINT fulfillment_set_pkey PRIMARY KEY (id);


--
-- Name: fulfillment_shipping_option_seller_seller fulfillment_shipping_option_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_shipping_option_seller_seller
    ADD CONSTRAINT fulfillment_shipping_option_seller_seller_pkey PRIMARY KEY (shipping_option_id, seller_id);


--
-- Name: fulfillment_shipping_profile_seller_seller fulfillment_shipping_profile_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_shipping_profile_seller_seller
    ADD CONSTRAINT fulfillment_shipping_profile_seller_seller_pkey PRIMARY KEY (shipping_profile_id, seller_id);


--
-- Name: geo_zone geo_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.geo_zone
    ADD CONSTRAINT geo_zone_pkey PRIMARY KEY (id);


--
-- Name: image image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_pkey PRIMARY KEY (id);


--
-- Name: inventory_inventory_item_seller_seller inventory_inventory_item_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_inventory_item_seller_seller
    ADD CONSTRAINT inventory_inventory_item_seller_seller_pkey PRIMARY KEY (inventory_item_id, seller_id);


--
-- Name: inventory_item inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_item
    ADD CONSTRAINT inventory_item_pkey PRIMARY KEY (id);


--
-- Name: inventory_level inventory_level_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_level
    ADD CONSTRAINT inventory_level_pkey PRIMARY KEY (id);


--
-- Name: invite invite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite
    ADD CONSTRAINT invite_pkey PRIMARY KEY (id);


--
-- Name: invite_rbac_role invite_rbac_role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_rbac_role
    ADD CONSTRAINT invite_rbac_role_pkey PRIMARY KEY (invite_id, rbac_role_id);


--
-- Name: layout_configuration layout_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.layout_configuration
    ADD CONSTRAINT layout_configuration_pkey PRIMARY KEY (id);


--
-- Name: link_module_migrations link_module_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.link_module_migrations
    ADD CONSTRAINT link_module_migrations_pkey PRIMARY KEY (id);


--
-- Name: link_module_migrations link_module_migrations_table_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.link_module_migrations
    ADD CONSTRAINT link_module_migrations_table_name_key UNIQUE (table_name);


--
-- Name: location_fulfillment_provider location_fulfillment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_fulfillment_provider
    ADD CONSTRAINT location_fulfillment_provider_pkey PRIMARY KEY (stock_location_id, fulfillment_provider_id);


--
-- Name: location_fulfillment_set location_fulfillment_set_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_fulfillment_set
    ADD CONSTRAINT location_fulfillment_set_pkey PRIMARY KEY (stock_location_id, fulfillment_set_id);


--
-- Name: media_image media_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_image
    ADD CONSTRAINT media_image_pkey PRIMARY KEY (id);


--
-- Name: member_invite member_invite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_invite
    ADD CONSTRAINT member_invite_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: mikro_orm_migrations mikro_orm_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mikro_orm_migrations
    ADD CONSTRAINT mikro_orm_migrations_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: notification_provider notification_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_provider
    ADD CONSTRAINT notification_provider_pkey PRIMARY KEY (id);


--
-- Name: offer_inventory_item offer_inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer_inventory_item
    ADD CONSTRAINT offer_inventory_item_pkey PRIMARY KEY (offer_id, inventory_item_id);


--
-- Name: offer_offer_pricing_price offer_offer_pricing_price_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer_offer_pricing_price
    ADD CONSTRAINT offer_offer_pricing_price_pkey PRIMARY KEY (offer_id, price_id);


--
-- Name: offer offer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer
    ADD CONSTRAINT offer_pkey PRIMARY KEY (id);


--
-- Name: onboarding onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding
    ADD CONSTRAINT onboarding_pkey PRIMARY KEY (id);


--
-- Name: order_address order_address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_address
    ADD CONSTRAINT order_address_pkey PRIMARY KEY (id);


--
-- Name: order_cart order_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_cart
    ADD CONSTRAINT order_cart_pkey PRIMARY KEY (order_id, cart_id);


--
-- Name: order_change_action order_change_action_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_change_action
    ADD CONSTRAINT order_change_action_pkey PRIMARY KEY (id);


--
-- Name: order_change order_change_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_change
    ADD CONSTRAINT order_change_pkey PRIMARY KEY (id);


--
-- Name: order_claim_item_image order_claim_item_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_claim_item_image
    ADD CONSTRAINT order_claim_item_image_pkey PRIMARY KEY (id);


--
-- Name: order_claim_item order_claim_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_claim_item
    ADD CONSTRAINT order_claim_item_pkey PRIMARY KEY (id);


--
-- Name: order_claim order_claim_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_claim
    ADD CONSTRAINT order_claim_pkey PRIMARY KEY (id);


--
-- Name: order_credit_line order_credit_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_credit_line
    ADD CONSTRAINT order_credit_line_pkey PRIMARY KEY (id);


--
-- Name: order_exchange_item order_exchange_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_exchange_item
    ADD CONSTRAINT order_exchange_item_pkey PRIMARY KEY (id);


--
-- Name: order_exchange order_exchange_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_exchange
    ADD CONSTRAINT order_exchange_pkey PRIMARY KEY (id);


--
-- Name: order_fulfillment order_fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_fulfillment
    ADD CONSTRAINT order_fulfillment_pkey PRIMARY KEY (order_id, fulfillment_id);


--
-- Name: order_group_order order_group_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_group_order
    ADD CONSTRAINT order_group_order_pkey PRIMARY KEY (order_group_id, order_id);


--
-- Name: order_group order_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_group
    ADD CONSTRAINT order_group_pkey PRIMARY KEY (id);


--
-- Name: order_item order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_pkey PRIMARY KEY (id);


--
-- Name: order_line_item_adjustment order_line_item_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_line_item_adjustment
    ADD CONSTRAINT order_line_item_adjustment_pkey PRIMARY KEY (id);


--
-- Name: order_line_item order_line_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_line_item
    ADD CONSTRAINT order_line_item_pkey PRIMARY KEY (id);


--
-- Name: order_line_item_tax_line order_line_item_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_line_item_tax_line
    ADD CONSTRAINT order_line_item_tax_line_pkey PRIMARY KEY (id);


--
-- Name: order_order_line_item_offer_offer order_order_line_item_offer_offer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_order_line_item_offer_offer
    ADD CONSTRAINT order_order_line_item_offer_offer_pkey PRIMARY KEY (order_line_item_id, offer_id);


--
-- Name: order_order_payout_payout order_order_payout_payout_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_order_payout_payout
    ADD CONSTRAINT order_order_payout_payout_pkey PRIMARY KEY (order_id, payout_id);


--
-- Name: order_order_review_review order_order_review_review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_order_review_review
    ADD CONSTRAINT order_order_review_review_pkey PRIMARY KEY (order_id, review_id);


--
-- Name: order_order_seller_seller order_order_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_order_seller_seller
    ADD CONSTRAINT order_order_seller_seller_pkey PRIMARY KEY (order_id, seller_id);


--
-- Name: order_payment_collection order_payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_payment_collection
    ADD CONSTRAINT order_payment_collection_pkey PRIMARY KEY (order_id, payment_collection_id);


--
-- Name: order order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (id);


--
-- Name: order_promotion order_promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_promotion
    ADD CONSTRAINT order_promotion_pkey PRIMARY KEY (order_id, promotion_id);


--
-- Name: order_shipping_method_adjustment order_shipping_method_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_shipping_method_adjustment
    ADD CONSTRAINT order_shipping_method_adjustment_pkey PRIMARY KEY (id);


--
-- Name: order_shipping_method order_shipping_method_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_shipping_method
    ADD CONSTRAINT order_shipping_method_pkey PRIMARY KEY (id);


--
-- Name: order_shipping_method_tax_line order_shipping_method_tax_line_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_shipping_method_tax_line
    ADD CONSTRAINT order_shipping_method_tax_line_pkey PRIMARY KEY (id);


--
-- Name: order_shipping order_shipping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_shipping
    ADD CONSTRAINT order_shipping_pkey PRIMARY KEY (id);


--
-- Name: order_summary order_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_pkey PRIMARY KEY (id);


--
-- Name: order_transaction order_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_transaction
    ADD CONSTRAINT order_transaction_pkey PRIMARY KEY (id);


--
-- Name: payment_collection_payment_providers payment_collection_payment_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_pkey PRIMARY KEY (payment_collection_id, payment_provider_id);


--
-- Name: payment_collection payment_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_collection
    ADD CONSTRAINT payment_collection_pkey PRIMARY KEY (id);


--
-- Name: payment_details payment_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_details
    ADD CONSTRAINT payment_details_pkey PRIMARY KEY (id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (id);


--
-- Name: payment_provider payment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_provider
    ADD CONSTRAINT payment_provider_pkey PRIMARY KEY (id);


--
-- Name: payment_session payment_session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_session
    ADD CONSTRAINT payment_session_pkey PRIMARY KEY (id);


--
-- Name: payout_account payout_account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout_account
    ADD CONSTRAINT payout_account_pkey PRIMARY KEY (id);


--
-- Name: payout_payout_seller_seller payout_payout_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout_payout_seller_seller
    ADD CONSTRAINT payout_payout_seller_seller_pkey PRIMARY KEY (payout_id, seller_id);


--
-- Name: payout payout_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_pkey PRIMARY KEY (id);


--
-- Name: price_list price_list_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_list
    ADD CONSTRAINT price_list_pkey PRIMARY KEY (id);


--
-- Name: price_list_rule price_list_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_list_rule
    ADD CONSTRAINT price_list_rule_pkey PRIMARY KEY (id);


--
-- Name: price price_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_pkey PRIMARY KEY (id);


--
-- Name: price_preference price_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_preference
    ADD CONSTRAINT price_preference_pkey PRIMARY KEY (id);


--
-- Name: price_rule price_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rule
    ADD CONSTRAINT price_rule_pkey PRIMARY KEY (id);


--
-- Name: price_set price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_set
    ADD CONSTRAINT price_set_pkey PRIMARY KEY (id);


--
-- Name: pricing_price_list_seller_seller pricing_price_list_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_price_list_seller_seller
    ADD CONSTRAINT pricing_price_list_seller_seller_pkey PRIMARY KEY (price_list_id, seller_id);


--
-- Name: product_attribute product_attribute_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute
    ADD CONSTRAINT product_attribute_pkey PRIMARY KEY (id);


--
-- Name: product_attribute_value_link product_attribute_value_link_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_value_link
    ADD CONSTRAINT product_attribute_value_link_pkey PRIMARY KEY (product_id, product_attribute_value_id);


--
-- Name: product_attribute_value product_attribute_value_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_value
    ADD CONSTRAINT product_attribute_value_pkey PRIMARY KEY (id);


--
-- Name: product_category_attribute product_category_attribute_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category_attribute
    ADD CONSTRAINT product_category_attribute_pkey PRIMARY KEY (product_attribute_id, product_category_id);


--
-- Name: product_category product_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_pkey PRIMARY KEY (id);


--
-- Name: product_category_product product_category_product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_pkey PRIMARY KEY (product_id, product_category_id);


--
-- Name: product_change_action product_change_action_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_change_action
    ADD CONSTRAINT product_change_action_pkey PRIMARY KEY (id);


--
-- Name: product_change product_change_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_change
    ADD CONSTRAINT product_change_pkey PRIMARY KEY (id);


--
-- Name: product_collection product_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_collection
    ADD CONSTRAINT product_collection_pkey PRIMARY KEY (id);


--
-- Name: product_option product_option_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_option
    ADD CONSTRAINT product_option_pkey PRIMARY KEY (id);


--
-- Name: product_option_value product_option_value_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_option_value
    ADD CONSTRAINT product_option_value_pkey PRIMARY KEY (id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- Name: product_product_category_media_media_image product_product_category_media_media_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_category_media_media_image
    ADD CONSTRAINT product_product_category_media_media_image_pkey PRIMARY KEY (product_category_id, media_image_id);


--
-- Name: product_product_category_seller_seller product_product_category_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_category_seller_seller
    ADD CONSTRAINT product_product_category_seller_seller_pkey PRIMARY KEY (product_category_id, seller_id);


--
-- Name: product_product_collection_media_media_image product_product_collection_media_media_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_collection_media_media_image
    ADD CONSTRAINT product_product_collection_media_media_image_pkey PRIMARY KEY (product_collection_id, media_image_id);


--
-- Name: product_product_option product_product_option_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_pkey PRIMARY KEY (id);


--
-- Name: product_product_option_value product_product_option_value_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_pkey PRIMARY KEY (id);


--
-- Name: product_product_review_review product_product_review_review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_review_review
    ADD CONSTRAINT product_product_review_review_pkey PRIMARY KEY (product_id, review_id);


--
-- Name: product_sales_channel product_sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_sales_channel
    ADD CONSTRAINT product_sales_channel_pkey PRIMARY KEY (product_id, sales_channel_id);


--
-- Name: product_seller product_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_seller
    ADD CONSTRAINT product_seller_pkey PRIMARY KEY (product_id, seller_id);


--
-- Name: product_shipping_profile product_shipping_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_shipping_profile
    ADD CONSTRAINT product_shipping_profile_pkey PRIMARY KEY (product_id, shipping_profile_id);


--
-- Name: product_tag product_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tag
    ADD CONSTRAINT product_tag_pkey PRIMARY KEY (id);


--
-- Name: product_tags product_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_pkey PRIMARY KEY (product_id, product_tag_id);


--
-- Name: product_type product_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_type
    ADD CONSTRAINT product_type_pkey PRIMARY KEY (id);


--
-- Name: product_variant_inventory_item product_variant_inventory_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant_inventory_item
    ADD CONSTRAINT product_variant_inventory_item_pkey PRIMARY KEY (variant_id, inventory_item_id);


--
-- Name: product_variant_option product_variant_option_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_pkey PRIMARY KEY (variant_id, option_value_id);


--
-- Name: product_variant product_variant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_pkey PRIMARY KEY (id);


--
-- Name: product_variant_price_set product_variant_price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant_price_set
    ADD CONSTRAINT product_variant_price_set_pkey PRIMARY KEY (variant_id, price_set_id);


--
-- Name: product_variant_product_image product_variant_product_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant_product_image
    ADD CONSTRAINT product_variant_product_image_pkey PRIMARY KEY (id);


--
-- Name: professional_details professional_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_details
    ADD CONSTRAINT professional_details_pkey PRIMARY KEY (id);


--
-- Name: promotion_application_method promotion_application_method_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_application_method
    ADD CONSTRAINT promotion_application_method_pkey PRIMARY KEY (id);


--
-- Name: promotion_campaign_budget promotion_campaign_budget_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_campaign_budget
    ADD CONSTRAINT promotion_campaign_budget_pkey PRIMARY KEY (id);


--
-- Name: promotion_campaign_budget_usage promotion_campaign_budget_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_campaign_budget_usage
    ADD CONSTRAINT promotion_campaign_budget_usage_pkey PRIMARY KEY (id);


--
-- Name: promotion_campaign promotion_campaign_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_campaign
    ADD CONSTRAINT promotion_campaign_pkey PRIMARY KEY (id);


--
-- Name: promotion_campaign_seller_seller promotion_campaign_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_campaign_seller_seller
    ADD CONSTRAINT promotion_campaign_seller_seller_pkey PRIMARY KEY (campaign_id, seller_id);


--
-- Name: promotion_cost promotion_cost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_cost
    ADD CONSTRAINT promotion_cost_pkey PRIMARY KEY (id);


--
-- Name: promotion promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_pkey PRIMARY KEY (id);


--
-- Name: promotion_promotion_rule promotion_promotion_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_pkey PRIMARY KEY (promotion_id, promotion_rule_id);


--
-- Name: promotion_promotion_seller_seller promotion_promotion_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_promotion_seller_seller
    ADD CONSTRAINT promotion_promotion_seller_seller_pkey PRIMARY KEY (promotion_id, seller_id);


--
-- Name: promotion_rule promotion_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_rule
    ADD CONSTRAINT promotion_rule_pkey PRIMARY KEY (id);


--
-- Name: promotion_rule_value promotion_rule_value_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_rule_value
    ADD CONSTRAINT promotion_rule_value_pkey PRIMARY KEY (id);


--
-- Name: property_label property_label_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_label
    ADD CONSTRAINT property_label_pkey PRIMARY KEY (id);


--
-- Name: provider_identity provider_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_identity
    ADD CONSTRAINT provider_identity_pkey PRIMARY KEY (id);


--
-- Name: publishable_api_key_sales_channel publishable_api_key_sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publishable_api_key_sales_channel
    ADD CONSTRAINT publishable_api_key_sales_channel_pkey PRIMARY KEY (publishable_key_id, sales_channel_id);


--
-- Name: rbac_policy rbac_policy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbac_policy
    ADD CONSTRAINT rbac_policy_pkey PRIMARY KEY (id);


--
-- Name: rbac_role_parent rbac_role_parent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbac_role_parent
    ADD CONSTRAINT rbac_role_parent_pkey PRIMARY KEY (id);


--
-- Name: rbac_role rbac_role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbac_role
    ADD CONSTRAINT rbac_role_pkey PRIMARY KEY (id);


--
-- Name: rbac_role_policy rbac_role_policy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbac_role_policy
    ADD CONSTRAINT rbac_role_policy_pkey PRIMARY KEY (id);


--
-- Name: refund refund_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_pkey PRIMARY KEY (id);


--
-- Name: refund_reason refund_reason_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_reason
    ADD CONSTRAINT refund_reason_pkey PRIMARY KEY (id);


--
-- Name: region_country region_country_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region_country
    ADD CONSTRAINT region_country_pkey PRIMARY KEY (iso_2);


--
-- Name: region_payment_provider region_payment_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region_payment_provider
    ADD CONSTRAINT region_payment_provider_pkey PRIMARY KEY (region_id, payment_provider_id);


--
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (id);


--
-- Name: reservation_item reservation_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_item
    ADD CONSTRAINT reservation_item_pkey PRIMARY KEY (id);


--
-- Name: return_fulfillment return_fulfillment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_fulfillment
    ADD CONSTRAINT return_fulfillment_pkey PRIMARY KEY (return_id, fulfillment_id);


--
-- Name: return_item return_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_item
    ADD CONSTRAINT return_item_pkey PRIMARY KEY (id);


--
-- Name: return return_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return
    ADD CONSTRAINT return_pkey PRIMARY KEY (id);


--
-- Name: return_reason return_reason_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_reason
    ADD CONSTRAINT return_reason_pkey PRIMARY KEY (id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);


--
-- Name: sales_channel sales_channel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_channel
    ADD CONSTRAINT sales_channel_pkey PRIMARY KEY (id);


--
-- Name: sales_channel_stock_location sales_channel_stock_location_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_channel_stock_location
    ADD CONSTRAINT sales_channel_stock_location_pkey PRIMARY KEY (sales_channel_id, stock_location_id);


--
-- Name: script_migrations script_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.script_migrations
    ADD CONSTRAINT script_migrations_pkey PRIMARY KEY (id);


--
-- Name: seller_address seller_address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_address
    ADD CONSTRAINT seller_address_pkey PRIMARY KEY (id);


--
-- Name: seller_member seller_member_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_member
    ADD CONSTRAINT seller_member_pkey PRIMARY KEY (id);


--
-- Name: seller seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller
    ADD CONSTRAINT seller_pkey PRIMARY KEY (id);


--
-- Name: seller_seller_customer_customer seller_seller_customer_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_seller_customer_customer
    ADD CONSTRAINT seller_seller_customer_customer_pkey PRIMARY KEY (seller_id, customer_id);


--
-- Name: seller_seller_fulfillment_fulfillment_set seller_seller_fulfillment_fulfillment_set_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_seller_fulfillment_fulfillment_set
    ADD CONSTRAINT seller_seller_fulfillment_fulfillment_set_pkey PRIMARY KEY (seller_id, fulfillment_set_id);


--
-- Name: seller_seller_fulfillment_service_zone seller_seller_fulfillment_service_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_seller_fulfillment_service_zone
    ADD CONSTRAINT seller_seller_fulfillment_service_zone_pkey PRIMARY KEY (seller_id, service_zone_id);


--
-- Name: seller_seller_payout_payout_account seller_seller_payout_payout_account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_seller_payout_payout_account
    ADD CONSTRAINT seller_seller_payout_payout_account_pkey PRIMARY KEY (seller_id, payout_account_id);


--
-- Name: seller_seller_review_review seller_seller_review_review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_seller_review_review
    ADD CONSTRAINT seller_seller_review_review_pkey PRIMARY KEY (seller_id, review_id);


--
-- Name: service_zone service_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_zone
    ADD CONSTRAINT service_zone_pkey PRIMARY KEY (id);


--
-- Name: shipping_option shipping_option_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_pkey PRIMARY KEY (id);


--
-- Name: shipping_option_price_set shipping_option_price_set_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option_price_set
    ADD CONSTRAINT shipping_option_price_set_pkey PRIMARY KEY (shipping_option_id, price_set_id);


--
-- Name: shipping_option_rule shipping_option_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option_rule
    ADD CONSTRAINT shipping_option_rule_pkey PRIMARY KEY (id);


--
-- Name: shipping_option_type shipping_option_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option_type
    ADD CONSTRAINT shipping_option_type_pkey PRIMARY KEY (id);


--
-- Name: shipping_profile shipping_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_profile
    ADD CONSTRAINT shipping_profile_pkey PRIMARY KEY (id);


--
-- Name: stock_location_address stock_location_address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_location_address
    ADD CONSTRAINT stock_location_address_pkey PRIMARY KEY (id);


--
-- Name: stock_location stock_location_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_location
    ADD CONSTRAINT stock_location_pkey PRIMARY KEY (id);


--
-- Name: stock_location_stock_location_seller_seller stock_location_stock_location_seller_seller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_location_stock_location_seller_seller
    ADD CONSTRAINT stock_location_stock_location_seller_seller_pkey PRIMARY KEY (stock_location_id, seller_id);


--
-- Name: store_currency store_currency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_currency
    ADD CONSTRAINT store_currency_pkey PRIMARY KEY (id);


--
-- Name: store_locale store_locale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_locale
    ADD CONSTRAINT store_locale_pkey PRIMARY KEY (id);


--
-- Name: store store_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_pkey PRIMARY KEY (id);


--
-- Name: tax_provider tax_provider_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_provider
    ADD CONSTRAINT tax_provider_pkey PRIMARY KEY (id);


--
-- Name: tax_rate tax_rate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT tax_rate_pkey PRIMARY KEY (id);


--
-- Name: tax_rate_rule tax_rate_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rate_rule
    ADD CONSTRAINT tax_rate_rule_pkey PRIMARY KEY (id);


--
-- Name: tax_region tax_region_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT tax_region_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_preference user_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preference
    ADD CONSTRAINT user_preference_pkey PRIMARY KEY (id);


--
-- Name: user_rbac_role user_rbac_role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_rbac_role
    ADD CONSTRAINT user_rbac_role_pkey PRIMARY KEY (user_id, rbac_role_id);


--
-- Name: view_configuration view_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_configuration
    ADD CONSTRAINT view_configuration_pkey PRIMARY KEY (id);


--
-- Name: workflow_execution workflow_execution_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_execution
    ADD CONSTRAINT workflow_execution_pkey PRIMARY KEY (workflow_id, transaction_id, run_id);


--
-- Name: IDX_account_holder_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_account_holder_deleted_at" ON public.account_holder USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_account_holder_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_account_holder_id_5cb3a0c0" ON public.customer_account_holder USING btree (account_holder_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_account_holder_provider_id_external_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_account_holder_provider_id_external_id_unique" ON public.account_holder USING btree (provider_id, external_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_api_key_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_api_key_deleted_at" ON public.api_key USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_api_key_redacted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_api_key_redacted" ON public.api_key USING btree (redacted) WHERE (deleted_at IS NULL);


--
-- Name: IDX_api_key_revoked_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_api_key_revoked_at" ON public.api_key USING btree (revoked_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_api_key_token_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_api_key_token_unique" ON public.api_key USING btree (token);


--
-- Name: IDX_api_key_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_api_key_type" ON public.api_key USING btree (type);


--
-- Name: IDX_application_method_allocation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_application_method_allocation" ON public.promotion_application_method USING btree (allocation);


--
-- Name: IDX_application_method_target_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_application_method_target_type" ON public.promotion_application_method USING btree (target_type);


--
-- Name: IDX_application_method_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_application_method_type" ON public.promotion_application_method USING btree (type);


--
-- Name: IDX_auth_identity_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_identity_deleted_at" ON public.auth_identity USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_factor_auth_identity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_mfa_factor_auth_identity_id" ON public.auth_mfa_factor USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_factor_auth_identity_provider_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_auth_mfa_factor_auth_identity_provider_active" ON public.auth_mfa_factor USING btree (auth_identity_id, provider) WHERE ((deleted_at IS NULL) AND (status = ANY (ARRAY['pending'::text, 'enabled'::text])));


--
-- Name: IDX_auth_mfa_factor_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_mfa_factor_deleted_at" ON public.auth_mfa_factor USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_recovery_code_auth_identity_code_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_auth_mfa_recovery_code_auth_identity_code_hash" ON public.auth_mfa_recovery_code USING btree (auth_identity_id, code_hash) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_recovery_code_auth_identity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_mfa_recovery_code_auth_identity_id" ON public.auth_mfa_recovery_code USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_mfa_recovery_code_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_mfa_recovery_code_deleted_at" ON public.auth_mfa_recovery_code USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_auth_identity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_password_reset_token_auth_identity_id" ON public.auth_password_reset_token USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_password_reset_token_deleted_at" ON public.auth_password_reset_token USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_password_reset_token_expires_at" ON public.auth_password_reset_token USING btree (expires_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_provider_identity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_password_reset_token_provider_identity_id" ON public.auth_password_reset_token USING btree (provider_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_password_reset_token_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_password_reset_token_token_hash" ON public.auth_password_reset_token USING btree (token_hash) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_verification_auth_identity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_verification_auth_identity_id" ON public.auth_verification USING btree (auth_identity_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_verification_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_auth_verification_deleted_at" ON public.auth_verification USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_auth_verification_unique_auth_identity_entity_id_entity_typ; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_auth_verification_unique_auth_identity_entity_id_entity_typ" ON public.auth_verification USING btree (auth_identity_id, entity_id, entity_type) WHERE (deleted_at IS NULL);


--
-- Name: IDX_campaign_budget_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_campaign_budget_type" ON public.promotion_campaign_budget USING btree (type);


--
-- Name: IDX_campaign_id_6bc8fdb7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_campaign_id_6bc8fdb7" ON public.promotion_campaign_seller_seller USING btree (campaign_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_capture_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_capture_deleted_at" ON public.capture USING btree (deleted_at);


--
-- Name: IDX_capture_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_capture_payment_id" ON public.capture USING btree (payment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_address_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_address_deleted_at" ON public.cart_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_billing_address_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_billing_address_id" ON public.cart USING btree (billing_address_id) WHERE ((deleted_at IS NULL) AND (billing_address_id IS NOT NULL));


--
-- Name: IDX_cart_credit_line_reference_reference_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_credit_line_reference_reference_id" ON public.credit_line USING btree (reference, reference_id) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_currency_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_currency_code" ON public.cart USING btree (currency_code);


--
-- Name: IDX_cart_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_customer_id" ON public.cart USING btree (customer_id) WHERE ((deleted_at IS NULL) AND (customer_id IS NOT NULL));


--
-- Name: IDX_cart_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_deleted_at" ON public.cart USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_id_-4a39f6c9" ON public.cart_payment_collection USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_id_-71069c16; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_id_-71069c16" ON public.order_cart USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_id_-a9d4a70b" ON public.cart_promotion USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_line_item_adjustment_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_line_item_adjustment_deleted_at" ON public.cart_line_item_adjustment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_line_item_adjustment_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_line_item_adjustment_item_id" ON public.cart_line_item_adjustment USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_line_item_cart_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_line_item_cart_id" ON public.cart_line_item USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_line_item_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_line_item_deleted_at" ON public.cart_line_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_line_item_tax_line_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_line_item_tax_line_deleted_at" ON public.cart_line_item_tax_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_line_item_tax_line_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_line_item_tax_line_item_id" ON public.cart_line_item_tax_line USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_region_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_region_id" ON public.cart USING btree (region_id) WHERE ((deleted_at IS NULL) AND (region_id IS NOT NULL));


--
-- Name: IDX_cart_sales_channel_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_sales_channel_id" ON public.cart USING btree (sales_channel_id) WHERE ((deleted_at IS NULL) AND (sales_channel_id IS NOT NULL));


--
-- Name: IDX_cart_shipping_address_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_shipping_address_id" ON public.cart USING btree (shipping_address_id) WHERE ((deleted_at IS NULL) AND (shipping_address_id IS NOT NULL));


--
-- Name: IDX_cart_shipping_method_adjustment_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_shipping_method_adjustment_deleted_at" ON public.cart_shipping_method_adjustment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_shipping_method_adjustment_shipping_method_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_shipping_method_adjustment_shipping_method_id" ON public.cart_shipping_method_adjustment USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_shipping_method_cart_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_shipping_method_cart_id" ON public.cart_shipping_method USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_cart_shipping_method_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_shipping_method_deleted_at" ON public.cart_shipping_method USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_shipping_method_tax_line_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_shipping_method_tax_line_deleted_at" ON public.cart_shipping_method_tax_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_cart_shipping_method_tax_line_shipping_method_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cart_shipping_method_tax_line_shipping_method_id" ON public.cart_shipping_method_tax_line USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_category_handle_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_category_handle_unique" ON public.product_category USING btree (handle) WHERE (deleted_at IS NULL);


--
-- Name: IDX_collection_handle_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_collection_handle_unique" ON public.product_collection USING btree (handle) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_line_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_line_deleted_at" ON public.commission_line USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_line_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_line_item_id" ON public.commission_line USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_line_shipping_method_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_line_shipping_method_id" ON public.commission_line USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_rate_code_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_commission_rate_code_unique" ON public.commission_rate USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_rate_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_rate_deleted_at" ON public.commission_rate USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_rate_value_commission_rate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_rate_value_commission_rate_id" ON public.commission_rate_value USING btree (commission_rate_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_rate_value_currency_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_rate_value_currency_code" ON public.commission_rate_value USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_rate_value_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_rate_value_deleted_at" ON public.commission_rate_value USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_rule_commission_rate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_rule_commission_rate_id" ON public.commission_rule USING btree (commission_rate_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_commission_rule_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_commission_rule_deleted_at" ON public.commission_rule USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_credit_line_cart_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_credit_line_cart_id" ON public.credit_line USING btree (cart_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_credit_line_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_credit_line_deleted_at" ON public.credit_line USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_address_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_address_customer_id" ON public.customer_address USING btree (customer_id);


--
-- Name: IDX_customer_address_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_address_deleted_at" ON public.customer_address USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_address_unique_customer_billing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_customer_address_unique_customer_billing" ON public.customer_address USING btree (customer_id) WHERE (is_default_billing = true);


--
-- Name: IDX_customer_address_unique_customer_shipping; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_customer_address_unique_customer_shipping" ON public.customer_address USING btree (customer_id) WHERE (is_default_shipping = true);


--
-- Name: IDX_customer_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_deleted_at" ON public.customer USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_email_has_account_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_customer_email_has_account_unique" ON public.customer USING btree (email, has_account) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_group_customer_customer_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_group_customer_customer_group_id" ON public.customer_group_customer USING btree (customer_group_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_group_customer_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_group_customer_customer_id" ON public.customer_group_customer USING btree (customer_id);


--
-- Name: IDX_customer_group_customer_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_group_customer_deleted_at" ON public.customer_group_customer USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_group_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_group_deleted_at" ON public.customer_group USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_group_id_f8237fc0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_group_id_f8237fc0" ON public.customer_customer_group_seller_seller USING btree (customer_group_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_id_-71525e4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_id_-71525e4c" ON public.seller_seller_customer_customer USING btree (customer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_id_10fcc48aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_id_10fcc48aa" ON public.customer_customer_review_review USING btree (customer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_customer_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_customer_id_5cb3a0c0" ON public.customer_account_holder USING btree (customer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_deleted_at_-1344d0cc2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-1344d0cc2" ON public.promotion_promotion_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-13980f8aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-13980f8aa" ON public.product_category_attribute USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-194faa82; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-194faa82" ON public.seller_seller_fulfillment_service_zone USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-1c99f363b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-1c99f363b" ON public.offer_offer_pricing_price USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-1d67bae40; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-1e5992737; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-1e5992737" ON public.location_fulfillment_provider USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-1ec91615a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-1ec91615a" ON public.cart_line_item_offer_offer USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-21bd4ca26; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-21bd4ca26" ON public.inventory_inventory_item_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-28d346d54; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-28d346d54" ON public.fulfillment_shipping_option_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-31ea43a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-31ea43a" ON public.return_fulfillment USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-3d86eb18; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-3d86eb18" ON public.order_group_order USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-4a39f6c9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-4a39f6c9" ON public.cart_payment_collection USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-507c7c25c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-507c7c25c" ON public.fulfillment_shipping_profile_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-71069c16; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-71069c16" ON public.order_cart USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-71518339; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-71518339" ON public.order_promotion USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-71525e4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-71525e4c" ON public.seller_seller_customer_customer USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-85069d44; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-85069d44" ON public.invite_rbac_role USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-9f778482; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-9f778482" ON public.order_order_payout_payout USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-a9d4a70b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-a9d4a70b" ON public.cart_promotion USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-bd8ccaa1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-bd8ccaa1" ON public.seller_seller_fulfillment_fulfillment_set USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-e88adb96; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-e88adb96" ON public.location_fulfillment_set USING btree (deleted_at);


--
-- Name: IDX_deleted_at_-e8d2543e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_-e8d2543e" ON public.order_fulfillment USING btree (deleted_at);


--
-- Name: IDX_deleted_at_10fcc48aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_10fcc48aa" ON public.customer_customer_review_review USING btree (deleted_at);


--
-- Name: IDX_deleted_at_139d4bc2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_139d4bc2c" ON public.product_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_1596d6a63; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_1596d6a63" ON public.product_product_category_media_media_image USING btree (deleted_at);


--
-- Name: IDX_deleted_at_169ccbc72; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_169ccbc72" ON public.offer_inventory_item USING btree (deleted_at);


--
-- Name: IDX_deleted_at_17a262437; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_17a262437" ON public.product_shipping_profile USING btree (deleted_at);


--
-- Name: IDX_deleted_at_17b4c4e35; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_17b4c4e35" ON public.product_variant_inventory_item USING btree (deleted_at);


--
-- Name: IDX_deleted_at_1c934dab0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_1c934dab0" ON public.region_payment_provider USING btree (deleted_at);


--
-- Name: IDX_deleted_at_1e2584ca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_1e2584ca" ON public.pricing_price_list_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_20b454295; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_20b454295" ON public.product_sales_channel USING btree (deleted_at);


--
-- Name: IDX_deleted_at_26d06f470; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_26d06f470" ON public.sales_channel_stock_location USING btree (deleted_at);


--
-- Name: IDX_deleted_at_26ede7b11; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_26ede7b11" ON public.product_product_collection_media_media_image USING btree (deleted_at);


--
-- Name: IDX_deleted_at_27558f8ef; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_27558f8ef" ON public.product_product_category_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_27941828; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_27941828" ON public.order_order_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_27bd68d4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_27bd68d4" ON public.payout_payout_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_47f8d028; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_47f8d028" ON public.product_product_review_review USING btree (deleted_at);


--
-- Name: IDX_deleted_at_4f72ad74; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_4f72ad74" ON public.seller_seller_review_review USING btree (deleted_at);


--
-- Name: IDX_deleted_at_52b23597; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_52b23597" ON public.product_variant_price_set USING btree (deleted_at);


--
-- Name: IDX_deleted_at_5cb3a0c0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_5cb3a0c0" ON public.customer_account_holder USING btree (deleted_at);


--
-- Name: IDX_deleted_at_64ff0c4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_64ff0c4c" ON public.user_rbac_role USING btree (deleted_at);


--
-- Name: IDX_deleted_at_6976ea48; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_6976ea48" ON public.stock_location_stock_location_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_6bc8fdb7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_6bc8fdb7" ON public.promotion_campaign_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_7387180; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_7387180" ON public.seller_seller_payout_payout_account USING btree (deleted_at);


--
-- Name: IDX_deleted_at_9cadde9e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_9cadde9e" ON public.order_order_review_review USING btree (deleted_at);


--
-- Name: IDX_deleted_at_ba32fa9c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_ba32fa9c" ON public.shipping_option_price_set USING btree (deleted_at);


--
-- Name: IDX_deleted_at_e7759b62; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_e7759b62" ON public.product_attribute_value_link USING btree (deleted_at);


--
-- Name: IDX_deleted_at_f42b9949; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_f42b9949" ON public.order_payment_collection USING btree (deleted_at);


--
-- Name: IDX_deleted_at_f8237fc0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_f8237fc0" ON public.customer_customer_group_seller_seller USING btree (deleted_at);


--
-- Name: IDX_deleted_at_fa551633; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_deleted_at_fa551633" ON public.order_order_line_item_offer_offer USING btree (deleted_at);


--
-- Name: IDX_fulfillment_address_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_address_deleted_at" ON public.fulfillment_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_deleted_at" ON public.fulfillment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_id_-31ea43a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_id_-31ea43a" ON public.return_fulfillment USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_id_-e8d2543e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_id_-e8d2543e" ON public.order_fulfillment USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_item_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_item_deleted_at" ON public.fulfillment_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_item_fulfillment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_item_fulfillment_id" ON public.fulfillment_item USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_item_inventory_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_item_inventory_item_id" ON public.fulfillment_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_item_line_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_item_line_item_id" ON public.fulfillment_item USING btree (line_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_label_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_label_deleted_at" ON public.fulfillment_label USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_label_fulfillment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_label_fulfillment_id" ON public.fulfillment_label USING btree (fulfillment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_location_id" ON public.fulfillment USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_provider_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_provider_deleted_at" ON public.fulfillment_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_provider_id_-1e5992737; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_provider_id_-1e5992737" ON public.location_fulfillment_provider USING btree (fulfillment_provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_set_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_set_deleted_at" ON public.fulfillment_set USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_fulfillment_set_id_-bd8ccaa1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_set_id_-bd8ccaa1" ON public.seller_seller_fulfillment_fulfillment_set USING btree (fulfillment_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_set_id_-e88adb96; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_set_id_-e88adb96" ON public.location_fulfillment_set USING btree (fulfillment_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_fulfillment_shipping_option_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fulfillment_shipping_option_id" ON public.fulfillment USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_geo_zone_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_geo_zone_city" ON public.geo_zone USING btree (city) WHERE ((deleted_at IS NULL) AND (city IS NOT NULL));


--
-- Name: IDX_geo_zone_country_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_geo_zone_country_code" ON public.geo_zone USING btree (country_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_geo_zone_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_geo_zone_deleted_at" ON public.geo_zone USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_geo_zone_province_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_geo_zone_province_code" ON public.geo_zone USING btree (province_code) WHERE ((deleted_at IS NULL) AND (province_code IS NOT NULL));


--
-- Name: IDX_geo_zone_service_zone_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_geo_zone_service_zone_id" ON public.geo_zone USING btree (service_zone_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_id_-1344d0cc2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-1344d0cc2" ON public.promotion_promotion_seller_seller USING btree (id);


--
-- Name: IDX_id_-13980f8aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-13980f8aa" ON public.product_category_attribute USING btree (id);


--
-- Name: IDX_id_-194faa82; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-194faa82" ON public.seller_seller_fulfillment_service_zone USING btree (id);


--
-- Name: IDX_id_-1c99f363b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-1c99f363b" ON public.offer_offer_pricing_price USING btree (id);


--
-- Name: IDX_id_-1d67bae40; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (id);


--
-- Name: IDX_id_-1e5992737; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-1e5992737" ON public.location_fulfillment_provider USING btree (id);


--
-- Name: IDX_id_-1ec91615a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-1ec91615a" ON public.cart_line_item_offer_offer USING btree (id);


--
-- Name: IDX_id_-21bd4ca26; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-21bd4ca26" ON public.inventory_inventory_item_seller_seller USING btree (id);


--
-- Name: IDX_id_-28d346d54; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-28d346d54" ON public.fulfillment_shipping_option_seller_seller USING btree (id);


--
-- Name: IDX_id_-31ea43a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-31ea43a" ON public.return_fulfillment USING btree (id);


--
-- Name: IDX_id_-3d86eb18; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-3d86eb18" ON public.order_group_order USING btree (id);


--
-- Name: IDX_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-4a39f6c9" ON public.cart_payment_collection USING btree (id);


--
-- Name: IDX_id_-507c7c25c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-507c7c25c" ON public.fulfillment_shipping_profile_seller_seller USING btree (id);


--
-- Name: IDX_id_-71069c16; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-71069c16" ON public.order_cart USING btree (id);


--
-- Name: IDX_id_-71518339; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-71518339" ON public.order_promotion USING btree (id);


--
-- Name: IDX_id_-71525e4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-71525e4c" ON public.seller_seller_customer_customer USING btree (id);


--
-- Name: IDX_id_-85069d44; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-85069d44" ON public.invite_rbac_role USING btree (id);


--
-- Name: IDX_id_-9f778482; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-9f778482" ON public.order_order_payout_payout USING btree (id);


--
-- Name: IDX_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-a9d4a70b" ON public.cart_promotion USING btree (id);


--
-- Name: IDX_id_-bd8ccaa1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-bd8ccaa1" ON public.seller_seller_fulfillment_fulfillment_set USING btree (id);


--
-- Name: IDX_id_-e88adb96; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-e88adb96" ON public.location_fulfillment_set USING btree (id);


--
-- Name: IDX_id_-e8d2543e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_-e8d2543e" ON public.order_fulfillment USING btree (id);


--
-- Name: IDX_id_10fcc48aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_10fcc48aa" ON public.customer_customer_review_review USING btree (id);


--
-- Name: IDX_id_139d4bc2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_139d4bc2c" ON public.product_seller USING btree (id);


--
-- Name: IDX_id_1596d6a63; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_1596d6a63" ON public.product_product_category_media_media_image USING btree (id);


--
-- Name: IDX_id_169ccbc72; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_169ccbc72" ON public.offer_inventory_item USING btree (id);


--
-- Name: IDX_id_17a262437; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_17a262437" ON public.product_shipping_profile USING btree (id);


--
-- Name: IDX_id_17b4c4e35; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (id);


--
-- Name: IDX_id_1c934dab0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_1c934dab0" ON public.region_payment_provider USING btree (id);


--
-- Name: IDX_id_1e2584ca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_1e2584ca" ON public.pricing_price_list_seller_seller USING btree (id);


--
-- Name: IDX_id_20b454295; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_20b454295" ON public.product_sales_channel USING btree (id);


--
-- Name: IDX_id_26d06f470; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_26d06f470" ON public.sales_channel_stock_location USING btree (id);


--
-- Name: IDX_id_26ede7b11; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_26ede7b11" ON public.product_product_collection_media_media_image USING btree (id);


--
-- Name: IDX_id_27558f8ef; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_27558f8ef" ON public.product_product_category_seller_seller USING btree (id);


--
-- Name: IDX_id_27941828; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_27941828" ON public.order_order_seller_seller USING btree (id);


--
-- Name: IDX_id_27bd68d4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_27bd68d4" ON public.payout_payout_seller_seller USING btree (id);


--
-- Name: IDX_id_47f8d028; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_47f8d028" ON public.product_product_review_review USING btree (id);


--
-- Name: IDX_id_4f72ad74; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_4f72ad74" ON public.seller_seller_review_review USING btree (id);


--
-- Name: IDX_id_52b23597; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_52b23597" ON public.product_variant_price_set USING btree (id);


--
-- Name: IDX_id_5cb3a0c0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_5cb3a0c0" ON public.customer_account_holder USING btree (id);


--
-- Name: IDX_id_64ff0c4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_64ff0c4c" ON public.user_rbac_role USING btree (id);


--
-- Name: IDX_id_6976ea48; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_6976ea48" ON public.stock_location_stock_location_seller_seller USING btree (id);


--
-- Name: IDX_id_6bc8fdb7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_6bc8fdb7" ON public.promotion_campaign_seller_seller USING btree (id);


--
-- Name: IDX_id_7387180; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_7387180" ON public.seller_seller_payout_payout_account USING btree (id);


--
-- Name: IDX_id_9cadde9e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_9cadde9e" ON public.order_order_review_review USING btree (id);


--
-- Name: IDX_id_ba32fa9c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_ba32fa9c" ON public.shipping_option_price_set USING btree (id);


--
-- Name: IDX_id_e7759b62; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_e7759b62" ON public.product_attribute_value_link USING btree (id);


--
-- Name: IDX_id_f42b9949; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_f42b9949" ON public.order_payment_collection USING btree (id);


--
-- Name: IDX_id_f8237fc0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_f8237fc0" ON public.customer_customer_group_seller_seller USING btree (id);


--
-- Name: IDX_id_fa551633; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_id_fa551633" ON public.order_order_line_item_offer_offer USING btree (id);


--
-- Name: IDX_image_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_image_deleted_at" ON public.image USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_image_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_image_product_id" ON public.image USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_item_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_inventory_item_deleted_at" ON public.inventory_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_inventory_item_id_-21bd4ca26; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_inventory_item_id_-21bd4ca26" ON public.inventory_inventory_item_seller_seller USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_item_id_169ccbc72; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_inventory_item_id_169ccbc72" ON public.offer_inventory_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_item_id_17b4c4e35; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_inventory_item_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_item_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_inventory_item_sku" ON public.inventory_item USING btree (sku) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_level_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_inventory_level_deleted_at" ON public.inventory_level USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_inventory_level_inventory_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_inventory_level_inventory_item_id" ON public.inventory_level USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_level_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_inventory_level_location_id" ON public.inventory_level USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_inventory_level_location_id_inventory_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_inventory_level_location_id_inventory_item_id" ON public.inventory_level USING btree (inventory_item_id, location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_invite_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_invite_deleted_at" ON public.invite USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_invite_email_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_invite_email_unique" ON public.invite USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: IDX_invite_id_-85069d44; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_invite_id_-85069d44" ON public.invite_rbac_role USING btree (invite_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_invite_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_invite_token" ON public.invite USING btree (token) WHERE (deleted_at IS NULL);


--
-- Name: IDX_layout_configuration_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_layout_configuration_deleted_at" ON public.layout_configuration USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_layout_configuration_zone_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_layout_configuration_zone_unique" ON public.layout_configuration USING btree (zone) WHERE ((is_system_default = true) AND (deleted_at IS NULL));


--
-- Name: IDX_layout_configuration_zone_user_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_layout_configuration_zone_user_id_unique" ON public.layout_configuration USING btree (zone, user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_line_item_adjustment_promotion_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_line_item_adjustment_promotion_id" ON public.cart_line_item_adjustment USING btree (promotion_id) WHERE ((deleted_at IS NULL) AND (promotion_id IS NOT NULL));


--
-- Name: IDX_line_item_id_-1ec91615a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_line_item_id_-1ec91615a" ON public.cart_line_item_offer_offer USING btree (line_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_line_item_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_line_item_product_id" ON public.cart_line_item USING btree (product_id) WHERE ((deleted_at IS NULL) AND (product_id IS NOT NULL));


--
-- Name: IDX_line_item_product_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_line_item_product_type_id" ON public.order_line_item USING btree (product_type_id) WHERE ((deleted_at IS NULL) AND (product_type_id IS NOT NULL));


--
-- Name: IDX_line_item_tax_line_tax_rate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_line_item_tax_line_tax_rate_id" ON public.cart_line_item_tax_line USING btree (tax_rate_id) WHERE ((deleted_at IS NULL) AND (tax_rate_id IS NOT NULL));


--
-- Name: IDX_line_item_variant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_line_item_variant_id" ON public.cart_line_item USING btree (variant_id) WHERE ((deleted_at IS NULL) AND (variant_id IS NOT NULL));


--
-- Name: IDX_media_image_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_media_image_deleted_at" ON public.media_image USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_media_image_id_1596d6a63; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_media_image_id_1596d6a63" ON public.product_product_category_media_media_image USING btree (media_image_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_media_image_id_26ede7b11; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_media_image_id_26ede7b11" ON public.product_product_collection_media_media_image USING btree (media_image_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_media_image_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_media_image_type" ON public.media_image USING btree (type) WHERE (deleted_at IS NULL);


--
-- Name: IDX_member_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_member_deleted_at" ON public.member USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_member_email_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_member_email_unique" ON public.member USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: IDX_member_invite_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_member_invite_deleted_at" ON public.member_invite USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_member_invite_email_seller_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_member_invite_email_seller_id_unique" ON public.member_invite USING btree (email, seller_id) WHERE ((deleted_at IS NULL) AND (accepted = false));


--
-- Name: IDX_member_invite_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_member_invite_seller_id" ON public.member_invite USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_member_invite_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_member_invite_token" ON public.member_invite USING btree (token) WHERE (deleted_at IS NULL);


--
-- Name: IDX_notification_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_notification_deleted_at" ON public.notification USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_notification_idempotency_key_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_notification_idempotency_key_unique" ON public.notification USING btree (idempotency_key) WHERE (deleted_at IS NULL);


--
-- Name: IDX_notification_provider_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_notification_provider_deleted_at" ON public.notification_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_notification_provider_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_notification_provider_id" ON public.notification USING btree (provider_id);


--
-- Name: IDX_notification_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_notification_receiver_id" ON public.notification USING btree (receiver_id);


--
-- Name: IDX_offer_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_deleted_at" ON public.offer USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_ean; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_ean" ON public.offer USING btree (ean) WHERE ((deleted_at IS NULL) AND (ean IS NOT NULL));


--
-- Name: IDX_offer_id_-1c99f363b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_id_-1c99f363b" ON public.offer_offer_pricing_price USING btree (offer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_id_-1ec91615a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_id_-1ec91615a" ON public.cart_line_item_offer_offer USING btree (offer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_id_169ccbc72; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_id_169ccbc72" ON public.offer_inventory_item USING btree (offer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_id_fa551633; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_id_fa551633" ON public.order_order_line_item_offer_offer USING btree (offer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_product_id" ON public.offer USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_seller_id" ON public.offer USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_seller_sku_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_offer_seller_sku_unique" ON public.offer USING btree (seller_id, sku) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_shipping_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_shipping_profile_id" ON public.offer USING btree (shipping_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_offer_upc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_upc" ON public.offer USING btree (upc) WHERE ((deleted_at IS NULL) AND (upc IS NOT NULL));


--
-- Name: IDX_offer_variant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_offer_variant_id" ON public.offer USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_onboarding_account_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_onboarding_account_id_unique" ON public.onboarding USING btree (account_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_onboarding_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_onboarding_deleted_at" ON public.onboarding USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_option_value_option_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_option_value_option_id_unique" ON public.product_option_value USING btree (option_id, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_address_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_address_customer_id" ON public.order_address USING btree (customer_id);


--
-- Name: IDX_order_address_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_address_deleted_at" ON public.order_address USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_billing_address_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_billing_address_id" ON public."order" USING btree (billing_address_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_action_claim_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_action_claim_id" ON public.order_change_action USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_action_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_action_deleted_at" ON public.order_change_action USING btree (deleted_at);


--
-- Name: IDX_order_change_action_exchange_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_action_exchange_id" ON public.order_change_action USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_action_order_change_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_action_order_change_id" ON public.order_change_action USING btree (order_change_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_action_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_action_order_id" ON public.order_change_action USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_action_ordering; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_action_ordering" ON public.order_change_action USING btree (ordering) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_action_return_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_action_return_id" ON public.order_change_action USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_change_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_change_type" ON public.order_change USING btree (change_type);


--
-- Name: IDX_order_change_claim_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_claim_id" ON public.order_change USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_deleted_at" ON public.order_change USING btree (deleted_at);


--
-- Name: IDX_order_change_exchange_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_exchange_id" ON public.order_change USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_order_id" ON public.order_change USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_order_id_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_order_id_version" ON public.order_change USING btree (order_id, version);


--
-- Name: IDX_order_change_return_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_return_id" ON public.order_change USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_change_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_status" ON public.order_change USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_change_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_change_version" ON public.order_change USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_deleted_at" ON public.order_claim USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_display_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_display_id" ON public.order_claim USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_item_claim_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_item_claim_id" ON public.order_claim_item USING btree (claim_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_item_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_item_deleted_at" ON public.order_claim_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_item_image_claim_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_item_image_claim_item_id" ON public.order_claim_item_image USING btree (claim_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_item_image_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_item_image_deleted_at" ON public.order_claim_item_image USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_claim_item_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_item_item_id" ON public.order_claim_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_order_id" ON public.order_claim USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_claim_return_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_claim_return_id" ON public.order_claim USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_credit_line_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_credit_line_deleted_at" ON public.order_credit_line USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_credit_line_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_credit_line_order_id" ON public.order_credit_line USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_credit_line_order_id_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_credit_line_order_id_version" ON public.order_credit_line USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_currency_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_currency_code" ON public."order" USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_custom_display_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_order_custom_display_id" ON public."order" USING btree (custom_display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_customer_id" ON public."order" USING btree (customer_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_deleted_at" ON public."order" USING btree (deleted_at);


--
-- Name: IDX_order_display_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_display_id" ON public."order" USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_exchange_deleted_at" ON public.order_exchange USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_display_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_exchange_display_id" ON public.order_exchange USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_item_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_exchange_item_deleted_at" ON public.order_exchange_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_item_exchange_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_exchange_item_exchange_id" ON public.order_exchange_item USING btree (exchange_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_item_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_exchange_item_item_id" ON public.order_exchange_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_exchange_order_id" ON public.order_exchange USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_exchange_return_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_exchange_return_id" ON public.order_exchange USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_group_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_group_deleted_at" ON public.order_group USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_group_id_-3d86eb18; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_group_id_-3d86eb18" ON public.order_group_order USING btree (order_group_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_-3d86eb18; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_id_-3d86eb18" ON public.order_group_order USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_-71069c16; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_id_-71069c16" ON public.order_cart USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_-71518339; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_id_-71518339" ON public.order_promotion USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_-9f778482; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_id_-9f778482" ON public.order_order_payout_payout USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_-e8d2543e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_id_-e8d2543e" ON public.order_fulfillment USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_27941828; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_id_27941828" ON public.order_order_seller_seller USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_9cadde9e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_id_9cadde9e" ON public.order_order_review_review USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_id_f42b9949; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_id_f42b9949" ON public.order_payment_collection USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_is_draft_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_is_draft_order" ON public."order" USING btree (is_draft_order) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_item_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_item_deleted_at" ON public.order_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_item_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_item_item_id" ON public.order_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_item_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_item_order_id" ON public.order_item USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_item_order_id_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_item_order_id_version" ON public.order_item USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_adjustment_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_line_item_adjustment_item_id" ON public.order_line_item_adjustment USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_id_fa551633; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_line_item_id_fa551633" ON public.order_order_line_item_offer_offer USING btree (order_line_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_line_item_product_id" ON public.order_line_item USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_tax_line_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_line_item_tax_line_item_id" ON public.order_line_item_tax_line USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_line_item_variant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_line_item_variant_id" ON public.order_line_item USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_region_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_region_id" ON public."order" USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_sales_channel_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_sales_channel_id" ON public."order" USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_address_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_address_id" ON public."order" USING btree (shipping_address_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_claim_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_claim_id" ON public.order_shipping USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_shipping_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_deleted_at" ON public.order_shipping USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_shipping_exchange_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_exchange_id" ON public.order_shipping USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_shipping_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_item_id" ON public.order_shipping USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_method_adjustment_shipping_method_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_method_adjustment_shipping_method_id" ON public.order_shipping_method_adjustment USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_method_adjustment_version_shipping_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_order_shipping_method_adjustment_version_shipping_method" ON public.order_shipping_method_adjustment USING btree (version, shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_method_shipping_option_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_method_shipping_option_id" ON public.order_shipping_method USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_method_tax_line_shipping_method_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_method_tax_line_shipping_method_id" ON public.order_shipping_method_tax_line USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_order_id" ON public.order_shipping USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_order_id_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_order_id_version" ON public.order_shipping USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_shipping_return_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_return_id" ON public.order_shipping USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_shipping_shipping_method_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_shipping_shipping_method_id" ON public.order_shipping USING btree (shipping_method_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_summary_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_summary_deleted_at" ON public.order_summary USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_order_summary_order_id_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_summary_order_id_version" ON public.order_summary USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_claim_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_transaction_claim_id" ON public.order_transaction USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_transaction_currency_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_transaction_currency_code" ON public.order_transaction USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_exchange_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_transaction_exchange_id" ON public.order_transaction USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_order_transaction_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_transaction_order_id" ON public.order_transaction USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_order_id_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_transaction_order_id_version" ON public.order_transaction USING btree (order_id, version) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_reference_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_transaction_reference_id" ON public.order_transaction USING btree (reference_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_order_transaction_return_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_order_transaction_return_id" ON public.order_transaction USING btree (return_id) WHERE ((return_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_payment_collection_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_collection_deleted_at" ON public.payment_collection USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_payment_collection_id_-4a39f6c9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_collection_id_-4a39f6c9" ON public.cart_payment_collection USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_collection_id_f42b9949; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_collection_id_f42b9949" ON public.order_payment_collection USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_deleted_at" ON public.payment USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_payment_details_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_details_deleted_at" ON public.payment_details USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_details_seller_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_payment_details_seller_id_unique" ON public.payment_details USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_payment_collection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_payment_collection_id" ON public.payment USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_payment_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_payment_session_id" ON public.payment USING btree (payment_session_id);


--
-- Name: IDX_payment_payment_session_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_payment_payment_session_id_unique" ON public.payment USING btree (payment_session_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_provider_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_provider_deleted_at" ON public.payment_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_provider_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_provider_id" ON public.payment USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_provider_id_1c934dab0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_provider_id_1c934dab0" ON public.region_payment_provider USING btree (payment_provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payment_session_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_session_deleted_at" ON public.payment_session USING btree (deleted_at);


--
-- Name: IDX_payment_session_payment_collection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payment_session_payment_collection_id" ON public.payment_session USING btree (payment_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payout_account_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payout_account_deleted_at" ON public.payout_account USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payout_account_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payout_account_id" ON public.payout USING btree (account_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payout_account_id_7387180; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payout_account_id_7387180" ON public.seller_seller_payout_payout_account USING btree (payout_account_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payout_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payout_deleted_at" ON public.payout USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payout_id_-9f778482; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payout_id_-9f778482" ON public.order_order_payout_payout USING btree (payout_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_payout_id_27bd68d4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_payout_id_27bd68d4" ON public.payout_payout_seller_seller USING btree (payout_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_currency_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_currency_code" ON public.price USING btree (currency_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_deleted_at" ON public.price USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_id_-1c99f363b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_id_-1c99f363b" ON public.offer_offer_pricing_price USING btree (price_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_list_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_list_deleted_at" ON public.price_list USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_list_id_1e2584ca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_list_id_1e2584ca" ON public.pricing_price_list_seller_seller USING btree (price_list_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_list_id_status_starts_at_ends_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_list_id_status_starts_at_ends_at" ON public.price_list USING btree (id, status, starts_at, ends_at) WHERE ((deleted_at IS NULL) AND (status = 'active'::text));


--
-- Name: IDX_price_list_rule_attribute; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_list_rule_attribute" ON public.price_list_rule USING btree (attribute) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_list_rule_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_list_rule_deleted_at" ON public.price_list_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_list_rule_price_list_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_list_rule_price_list_id" ON public.price_list_rule USING btree (price_list_id) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_list_rule_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_list_rule_value" ON public.price_list_rule USING gin (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_preference_attribute_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_price_preference_attribute_value" ON public.price_preference USING btree (attribute, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_preference_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_preference_deleted_at" ON public.price_preference USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_price_list_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_price_list_id" ON public.price USING btree (price_list_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_price_set_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_price_set_id" ON public.price USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_attribute; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_rule_attribute" ON public.price_rule USING btree (attribute) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_attribute_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_rule_attribute_value" ON public.price_rule USING btree (attribute, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_attribute_value_price_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_rule_attribute_value_price_id" ON public.price_rule USING btree (attribute, value, price_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_rule_deleted_at" ON public.price_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_rule_operator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_rule_operator" ON public.price_rule USING btree (operator);


--
-- Name: IDX_price_rule_operator_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_rule_operator_value" ON public.price_rule USING btree (operator, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_price_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_rule_price_id" ON public.price_rule USING btree (price_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_rule_price_id_attribute_operator_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_price_rule_price_id_attribute_operator_unique" ON public.price_rule USING btree (price_id, attribute, operator) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_set_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_set_deleted_at" ON public.price_set USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_price_set_id_52b23597; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_set_id_52b23597" ON public.product_variant_price_set USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_price_set_id_ba32fa9c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_price_set_id_ba32fa9c" ON public.shipping_option_price_set USING btree (price_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_prodchact_ordering; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_prodchact_ordering" ON public.product_change_action USING btree (ordering) WHERE (deleted_at IS NULL);


--
-- Name: IDX_prodchact_product_change_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_prodchact_product_change_id" ON public.product_change_action USING btree (product_change_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_prodchact_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_prodchact_product_id" ON public.product_change_action USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_attribute_handle_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_product_attribute_handle_unique" ON public.product_attribute USING btree (handle) WHERE ((deleted_at IS NULL) AND (handle IS NOT NULL));


--
-- Name: IDX_product_attribute_id_-13980f8aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_attribute_id_-13980f8aa" ON public.product_category_attribute USING btree (product_attribute_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_attribute_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_attribute_product_id" ON public.product_attribute USING btree (product_id) WHERE ((deleted_at IS NULL) AND (product_id IS NOT NULL));


--
-- Name: IDX_product_attribute_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_attribute_type" ON public.product_attribute USING btree (type) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_attribute_value_handle_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_product_attribute_value_handle_unique" ON public.product_attribute_value USING btree (attribute_id, handle) WHERE ((deleted_at IS NULL) AND (handle IS NOT NULL));


--
-- Name: IDX_product_attribute_value_id_e7759b62; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_attribute_value_id_e7759b62" ON public.product_attribute_value_link USING btree (product_attribute_value_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_category_id_-13980f8aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_category_id_-13980f8aa" ON public.product_category_attribute USING btree (product_category_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_category_id_1596d6a63; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_category_id_1596d6a63" ON public.product_product_category_media_media_image USING btree (product_category_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_category_id_27558f8ef; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_category_id_27558f8ef" ON public.product_product_category_seller_seller USING btree (product_category_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_category_parent_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_category_parent_category_id" ON public.product_category USING btree (parent_category_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_category_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_category_path" ON public.product_category USING btree (mpath) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_change_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_change_product_id" ON public.product_change USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_change_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_change_status" ON public.product_change USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_collection_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_collection_deleted_at" ON public.product_collection USING btree (deleted_at);


--
-- Name: IDX_product_collection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_collection_id" ON public.product USING btree (collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_collection_id_26ede7b11; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_collection_id_26ede7b11" ON public.product_product_collection_media_media_image USING btree (product_collection_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_deleted_at" ON public.product USING btree (deleted_at);


--
-- Name: IDX_product_handle_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_product_handle_unique" ON public.product USING btree (handle) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_id_139d4bc2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_id_139d4bc2c" ON public.product_seller USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_id_17a262437; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_id_17a262437" ON public.product_shipping_profile USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_id_20b454295; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_id_20b454295" ON public.product_sales_channel USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_id_47f8d028; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_id_47f8d028" ON public.product_product_review_review USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_id_e7759b62; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_id_e7759b62" ON public.product_attribute_value_link USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_image_rank; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_image_rank" ON public.image USING btree (rank) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_image_rank_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_image_rank_product_id" ON public.image USING btree (rank, product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_image_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_image_url" ON public.image USING btree (url) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_image_url_rank_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_image_url_rank_product_id" ON public.image USING btree (url, rank, product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_option_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_option_deleted_at" ON public.product_option USING btree (deleted_at);


--
-- Name: IDX_product_option_value_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_option_value_deleted_at" ON public.product_option_value USING btree (deleted_at);


--
-- Name: IDX_product_option_value_option_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_option_value_option_id" ON public.product_option_value USING btree (option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_product_option_deleted_at" ON public.product_product_option USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_product_option_product_id" ON public.product_product_option USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_product_option_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_product_option_product_option_id" ON public.product_product_option USING btree (product_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_value_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_product_option_value_deleted_at" ON public.product_product_option_value USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_value_product_option_value_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_product_option_value_product_option_value_id" ON public.product_product_option_value USING btree (product_option_value_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_product_option_value_product_product_option_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_product_option_value_product_product_option_id" ON public.product_product_option_value USING btree (product_product_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_status" ON public.product USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_tag_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_tag_deleted_at" ON public.product_tag USING btree (deleted_at);


--
-- Name: IDX_product_type_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_type_deleted_at" ON public.product_type USING btree (deleted_at);


--
-- Name: IDX_product_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_type_id" ON public.product USING btree (type_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_barcode_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_product_variant_barcode_unique" ON public.product_variant USING btree (barcode) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_variant_deleted_at" ON public.product_variant USING btree (deleted_at);


--
-- Name: IDX_product_variant_ean_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_product_variant_ean_unique" ON public.product_variant USING btree (ean) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_id_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_variant_id_product_id" ON public.product_variant USING btree (id, product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_variant_product_id" ON public.product_variant USING btree (product_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_product_image_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_variant_product_image_deleted_at" ON public.product_variant_product_image USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_product_image_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_variant_product_image_image_id" ON public.product_variant_product_image USING btree (image_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_product_image_variant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_product_variant_product_image_variant_id" ON public.product_variant_product_image USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_sku_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_product_variant_sku_unique" ON public.product_variant USING btree (sku) WHERE (deleted_at IS NULL);


--
-- Name: IDX_product_variant_upc_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_product_variant_upc_unique" ON public.product_variant USING btree (upc) WHERE (deleted_at IS NULL);


--
-- Name: IDX_professional_details_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_professional_details_deleted_at" ON public.professional_details USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_professional_details_seller_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_professional_details_seller_id_unique" ON public.professional_details USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_application_method_currency_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_application_method_currency_code" ON public.promotion_application_method USING btree (currency_code) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_promotion_application_method_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_application_method_deleted_at" ON public.promotion_application_method USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_application_method_promotion_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_promotion_application_method_promotion_id_unique" ON public.promotion_application_method USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_campaign_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_budget_campaign_id_unique" ON public.promotion_campaign_budget USING btree (campaign_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_campaign_budget_deleted_at" ON public.promotion_campaign_budget USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_usage_attribute_value_budget_id_u; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_budget_usage_attribute_value_budget_id_u" ON public.promotion_campaign_budget_usage USING btree (attribute_value, budget_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_usage_budget_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_campaign_budget_usage_budget_id" ON public.promotion_campaign_budget_usage USING btree (budget_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_budget_usage_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_campaign_budget_usage_deleted_at" ON public.promotion_campaign_budget_usage USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_campaign_identifier_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_promotion_campaign_campaign_identifier_unique" ON public.promotion_campaign USING btree (campaign_identifier) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_campaign_deleted_at" ON public.promotion_campaign USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_campaign_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_campaign_id" ON public.promotion USING btree (campaign_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_cost_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_cost_deleted_at" ON public.promotion_cost USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_cost_promotion_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_promotion_cost_promotion_id_unique" ON public.promotion_cost USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_deleted_at" ON public.promotion USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_id_-1344d0cc2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_id_-1344d0cc2" ON public.promotion_promotion_seller_seller USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_id_-71518339; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_id_-71518339" ON public.order_promotion USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_id_-a9d4a70b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_id_-a9d4a70b" ON public.cart_promotion USING btree (promotion_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_is_automatic; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_is_automatic" ON public.promotion USING btree (is_automatic) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_attribute; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_attribute" ON public.promotion_rule USING btree (attribute);


--
-- Name: IDX_promotion_rule_attribute_operator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_attribute_operator" ON public.promotion_rule USING btree (attribute, operator) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_attribute_operator_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_attribute_operator_id" ON public.promotion_rule USING btree (operator, attribute, id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_deleted_at" ON public.promotion_rule USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_operator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_operator" ON public.promotion_rule USING btree (operator);


--
-- Name: IDX_promotion_rule_value_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_value_deleted_at" ON public.promotion_rule_value USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_value_promotion_rule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_value_promotion_rule_id" ON public.promotion_rule_value USING btree (promotion_rule_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_value_rule_id_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_value_rule_id_value" ON public.promotion_rule_value USING btree (promotion_rule_id, value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_rule_value_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_rule_value_value" ON public.promotion_rule_value USING btree (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_status" ON public.promotion USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: IDX_promotion_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_promotion_type" ON public.promotion USING btree (type);


--
-- Name: IDX_property_label_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_property_label_deleted_at" ON public.property_label USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_property_label_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_property_label_entity" ON public.property_label USING btree (entity) WHERE (deleted_at IS NULL);


--
-- Name: IDX_property_label_entity_property_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_property_label_entity_property_unique" ON public.property_label USING btree (entity, property) WHERE (deleted_at IS NULL);


--
-- Name: IDX_provider_identity_auth_identity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_provider_identity_auth_identity_id" ON public.provider_identity USING btree (auth_identity_id);


--
-- Name: IDX_provider_identity_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_provider_identity_deleted_at" ON public.provider_identity USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_provider_identity_provider_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_provider_identity_provider_entity_id" ON public.provider_identity USING btree (entity_id, provider);


--
-- Name: IDX_publishable_key_id_-1d67bae40; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_publishable_key_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (publishable_key_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_policy_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_policy_deleted_at" ON public.rbac_policy USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_policy_key_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_rbac_policy_key_unique" ON public.rbac_policy USING btree (key) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_policy_operation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_policy_operation" ON public.rbac_policy USING btree (operation) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_policy_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_policy_resource" ON public.rbac_policy USING btree (resource) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_deleted_at" ON public.rbac_role USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_id_-85069d44; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_id_-85069d44" ON public.invite_rbac_role USING btree (rbac_role_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_id_64ff0c4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_id_64ff0c4c" ON public.user_rbac_role USING btree (rbac_role_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_name_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_rbac_role_name_unique" ON public.rbac_role USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_parent_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_parent_deleted_at" ON public.rbac_role_parent USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_parent_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_parent_parent_id" ON public.rbac_role_parent USING btree (parent_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_parent_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_parent_role_id" ON public.rbac_role_parent USING btree (role_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_parent_role_id_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_rbac_role_parent_role_id_parent_id_unique" ON public.rbac_role_parent USING btree (role_id, parent_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_policy_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_policy_deleted_at" ON public.rbac_role_policy USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_policy_policy_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_policy_policy_id" ON public.rbac_role_policy USING btree (policy_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_policy_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_rbac_role_policy_role_id" ON public.rbac_role_policy USING btree (role_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_rbac_role_policy_role_id_policy_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_rbac_role_policy_role_id_policy_id_unique" ON public.rbac_role_policy USING btree (role_id, policy_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_refund_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_refund_deleted_at" ON public.refund USING btree (deleted_at);


--
-- Name: IDX_refund_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_refund_payment_id" ON public.refund USING btree (payment_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_refund_reason_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_refund_reason_deleted_at" ON public.refund_reason USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_refund_refund_reason_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_refund_refund_reason_id" ON public.refund USING btree (refund_reason_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_region_country_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_region_country_deleted_at" ON public.region_country USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_region_country_region_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_region_country_region_id" ON public.region_country USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_region_country_region_id_iso_2_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_region_country_region_id_iso_2_unique" ON public.region_country USING btree (region_id, iso_2);


--
-- Name: IDX_region_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_region_deleted_at" ON public.region USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_region_id_1c934dab0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_region_id_1c934dab0" ON public.region_payment_provider USING btree (region_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_reservation_item_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_reservation_item_deleted_at" ON public.reservation_item USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_reservation_item_inventory_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_reservation_item_inventory_item_id" ON public.reservation_item USING btree (inventory_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_reservation_item_line_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_reservation_item_line_item_id" ON public.reservation_item USING btree (line_item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_reservation_item_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_reservation_item_location_id" ON public.reservation_item USING btree (location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_claim_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_claim_id" ON public.return USING btree (claim_id) WHERE ((claim_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_return_display_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_display_id" ON public.return USING btree (display_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_exchange_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_exchange_id" ON public.return USING btree (exchange_id) WHERE ((exchange_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_return_id_-31ea43a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_id_-31ea43a" ON public.return_fulfillment USING btree (return_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_item_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_item_deleted_at" ON public.return_item USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_item_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_item_item_id" ON public.return_item USING btree (item_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_item_reason_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_item_reason_id" ON public.return_item USING btree (reason_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_item_return_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_item_return_id" ON public.return_item USING btree (return_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_order_id" ON public.return USING btree (order_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_reason_parent_return_reason_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_reason_parent_return_reason_id" ON public.return_reason USING btree (parent_return_reason_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_return_reason_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_return_reason_value" ON public.return_reason USING btree (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_review_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_review_deleted_at" ON public.review USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_review_id_10fcc48aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_review_id_10fcc48aa" ON public.customer_customer_review_review USING btree (review_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_review_id_47f8d028; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_review_id_47f8d028" ON public.product_product_review_review USING btree (review_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_review_id_4f72ad74; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_review_id_4f72ad74" ON public.seller_seller_review_review USING btree (review_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_review_id_9cadde9e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_review_id_9cadde9e" ON public.order_order_review_review USING btree (review_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_sales_channel_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_sales_channel_deleted_at" ON public.sales_channel USING btree (deleted_at);


--
-- Name: IDX_sales_channel_id_-1d67bae40; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_sales_channel_id_-1d67bae40" ON public.publishable_api_key_sales_channel USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_sales_channel_id_20b454295; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_sales_channel_id_20b454295" ON public.product_sales_channel USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_sales_channel_id_26d06f470; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_sales_channel_id_26d06f470" ON public.sales_channel_stock_location USING btree (sales_channel_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_active_closure; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_active_closure" ON public.seller USING btree (status, closed_from, closed_to) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_address_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_address_deleted_at" ON public.seller_address USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_address_seller_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_seller_address_seller_id_unique" ON public.seller_address USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_deleted_at" ON public.seller USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_email_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_seller_email_unique" ON public.seller USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_external_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_seller_external_id_unique" ON public.seller USING btree (external_id) WHERE ((deleted_at IS NULL) AND (external_id IS NOT NULL));


--
-- Name: IDX_seller_handle_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_seller_handle_unique" ON public.seller USING btree (handle) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_-1344d0cc2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_-1344d0cc2" ON public.promotion_promotion_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_-194faa82; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_-194faa82" ON public.seller_seller_fulfillment_service_zone USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_-21bd4ca26; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_-21bd4ca26" ON public.inventory_inventory_item_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_-28d346d54; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_-28d346d54" ON public.fulfillment_shipping_option_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_-507c7c25c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_-507c7c25c" ON public.fulfillment_shipping_profile_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_-71525e4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_-71525e4c" ON public.seller_seller_customer_customer USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_-bd8ccaa1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_-bd8ccaa1" ON public.seller_seller_fulfillment_fulfillment_set USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_139d4bc2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_139d4bc2c" ON public.product_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_1e2584ca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_1e2584ca" ON public.pricing_price_list_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_27558f8ef; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_27558f8ef" ON public.product_product_category_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_27941828; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_27941828" ON public.order_order_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_27bd68d4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_27bd68d4" ON public.payout_payout_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_4f72ad74; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_4f72ad74" ON public.seller_seller_review_review USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_6976ea48; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_6976ea48" ON public.stock_location_stock_location_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_6bc8fdb7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_6bc8fdb7" ON public.promotion_campaign_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_7387180; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_7387180" ON public.seller_seller_payout_payout_account USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_id_f8237fc0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_id_f8237fc0" ON public.customer_customer_group_seller_seller USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_member_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_member_deleted_at" ON public.seller_member USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_member_member_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_member_member_id" ON public.seller_member USING btree (member_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_member_seller_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_seller_member_seller_id" ON public.seller_member USING btree (seller_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_member_seller_id_member_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_seller_member_seller_id_member_id_unique" ON public.seller_member USING btree (seller_id, member_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_seller_name_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_seller_name_unique" ON public.seller USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: IDX_service_zone_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_service_zone_deleted_at" ON public.service_zone USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_service_zone_fulfillment_set_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_service_zone_fulfillment_set_id" ON public.service_zone USING btree (fulfillment_set_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_service_zone_id_-194faa82; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_service_zone_id_-194faa82" ON public.seller_seller_fulfillment_service_zone USING btree (service_zone_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_method_adjustment_promotion_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_method_adjustment_promotion_id" ON public.cart_shipping_method_adjustment USING btree (promotion_id) WHERE ((deleted_at IS NULL) AND (promotion_id IS NOT NULL));


--
-- Name: IDX_shipping_method_option_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_method_option_id" ON public.cart_shipping_method USING btree (shipping_option_id) WHERE ((deleted_at IS NULL) AND (shipping_option_id IS NOT NULL));


--
-- Name: IDX_shipping_method_tax_line_tax_rate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_method_tax_line_tax_rate_id" ON public.cart_shipping_method_tax_line USING btree (tax_rate_id) WHERE ((deleted_at IS NULL) AND (tax_rate_id IS NOT NULL));


--
-- Name: IDX_shipping_option_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_deleted_at" ON public.shipping_option USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_shipping_option_id_-28d346d54; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_id_-28d346d54" ON public.fulfillment_shipping_option_seller_seller USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_id_ba32fa9c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_id_ba32fa9c" ON public.shipping_option_price_set USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_provider_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_provider_id" ON public.shipping_option USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_rule_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_rule_deleted_at" ON public.shipping_option_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_shipping_option_rule_shipping_option_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_rule_shipping_option_id" ON public.shipping_option_rule USING btree (shipping_option_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_service_zone_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_service_zone_id" ON public.shipping_option USING btree (service_zone_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_shipping_option_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_shipping_option_type_id" ON public.shipping_option USING btree (shipping_option_type_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_shipping_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_shipping_profile_id" ON public.shipping_option USING btree (shipping_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_option_type_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_option_type_deleted_at" ON public.shipping_option_type USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_shipping_profile_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_profile_deleted_at" ON public.shipping_profile USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_shipping_profile_id_-507c7c25c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_profile_id_-507c7c25c" ON public.fulfillment_shipping_profile_seller_seller USING btree (shipping_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_shipping_profile_id_17a262437; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_shipping_profile_id_17a262437" ON public.product_shipping_profile USING btree (shipping_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_single_default_region; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_single_default_region" ON public.tax_rate USING btree (tax_region_id) WHERE ((is_default = true) AND (deleted_at IS NULL));


--
-- Name: IDX_stock_location_address_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_location_address_deleted_at" ON public.stock_location_address USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_stock_location_address_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_stock_location_address_id_unique" ON public.stock_location USING btree (address_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_stock_location_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_location_deleted_at" ON public.stock_location USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_stock_location_id_-1e5992737; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_location_id_-1e5992737" ON public.location_fulfillment_provider USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_stock_location_id_-e88adb96; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_location_id_-e88adb96" ON public.location_fulfillment_set USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_stock_location_id_26d06f470; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_location_id_26d06f470" ON public.sales_channel_stock_location USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_stock_location_id_6976ea48; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_stock_location_id_6976ea48" ON public.stock_location_stock_location_seller_seller USING btree (stock_location_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_store_currency_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_store_currency_deleted_at" ON public.store_currency USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_store_currency_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_store_currency_store_id" ON public.store_currency USING btree (store_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_store_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_store_deleted_at" ON public.store USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_store_locale_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_store_locale_deleted_at" ON public.store_locale USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_store_locale_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_store_locale_store_id" ON public.store_locale USING btree (store_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tag_value_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_tag_value_unique" ON public.product_tag USING btree (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_provider_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_provider_deleted_at" ON public.tax_provider USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_rate_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_rate_deleted_at" ON public.tax_rate USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_tax_rate_rule_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_rate_rule_deleted_at" ON public.tax_rate_rule USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_tax_rate_rule_reference_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_rate_rule_reference_id" ON public.tax_rate_rule USING btree (reference_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_rate_rule_tax_rate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_rate_rule_tax_rate_id" ON public.tax_rate_rule USING btree (tax_rate_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_rate_rule_unique_rate_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_tax_rate_rule_unique_rate_reference" ON public.tax_rate_rule USING btree (tax_rate_id, reference_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_rate_tax_region_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_rate_tax_region_id" ON public.tax_rate USING btree (tax_region_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_region_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_region_deleted_at" ON public.tax_region USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_tax_region_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_region_parent_id" ON public.tax_region USING btree (parent_id);


--
-- Name: IDX_tax_region_provider_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_tax_region_provider_id" ON public.tax_region USING btree (provider_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_tax_region_unique_country_nullable_province; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_tax_region_unique_country_nullable_province" ON public.tax_region USING btree (country_code) WHERE ((province_code IS NULL) AND (deleted_at IS NULL));


--
-- Name: IDX_tax_region_unique_country_province; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_tax_region_unique_country_province" ON public.tax_region USING btree (country_code, province_code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_type_value_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_type_value_unique" ON public.product_type USING btree (value) WHERE (deleted_at IS NULL);


--
-- Name: IDX_unique_promotion_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_unique_promotion_code" ON public.promotion USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_deleted_at" ON public."user" USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: IDX_user_email_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_user_email_unique" ON public."user" USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_id_64ff0c4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_id_64ff0c4c" ON public.user_rbac_role USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_preference_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_preference_deleted_at" ON public.user_preference USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_preference_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_preference_user_id" ON public.user_preference USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_user_preference_user_id_key_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_user_preference_user_id_key_unique" ON public.user_preference USING btree (user_id, key) WHERE (deleted_at IS NULL);


--
-- Name: IDX_variant_id_17b4c4e35; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_variant_id_17b4c4e35" ON public.product_variant_inventory_item USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_variant_id_52b23597; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_variant_id_52b23597" ON public.product_variant_price_set USING btree (variant_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_view_configuration_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_view_configuration_deleted_at" ON public.view_configuration USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_view_configuration_entity_is_system_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_view_configuration_entity_is_system_default" ON public.view_configuration USING btree (entity, is_system_default) WHERE (deleted_at IS NULL);


--
-- Name: IDX_view_configuration_entity_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_view_configuration_entity_user_id" ON public.view_configuration USING btree (entity, user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_view_configuration_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_view_configuration_user_id" ON public.view_configuration USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_deleted_at" ON public.workflow_execution USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_id" ON public.workflow_execution USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_retention_time_updated_at_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_retention_time_updated_at_state" ON public.workflow_execution USING btree (retention_time, updated_at, state) WHERE ((deleted_at IS NULL) AND (retention_time IS NOT NULL));


--
-- Name: IDX_workflow_execution_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_run_id" ON public.workflow_execution USING btree (run_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_state" ON public.workflow_execution USING btree (state) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_state_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_state_updated_at" ON public.workflow_execution USING btree (state, updated_at) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_transaction_id" ON public.workflow_execution USING btree (transaction_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_updated_at_retention_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_updated_at_retention_time" ON public.workflow_execution USING btree (updated_at, retention_time) WHERE ((deleted_at IS NULL) AND (retention_time IS NOT NULL) AND ((state)::text = ANY ((ARRAY['done'::character varying, 'failed'::character varying, 'reverted'::character varying])::text[])));


--
-- Name: IDX_workflow_execution_workflow_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_workflow_id" ON public.workflow_execution USING btree (workflow_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_workflow_id_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_workflow_execution_workflow_id_transaction_id" ON public.workflow_execution USING btree (workflow_id, transaction_id) WHERE (deleted_at IS NULL);


--
-- Name: IDX_workflow_execution_workflow_id_transaction_id_run_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_workflow_execution_workflow_id_transaction_id_run_id_unique" ON public.workflow_execution USING btree (workflow_id, transaction_id, run_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_script_name_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_script_name_unique ON public.script_migrations USING btree (script_name);


--
-- Name: tax_rate_rule FK_tax_rate_rule_tax_rate_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rate_rule
    ADD CONSTRAINT "FK_tax_rate_rule_tax_rate_id" FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rate(id) ON DELETE CASCADE;


--
-- Name: tax_rate FK_tax_rate_tax_region_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rate
    ADD CONSTRAINT "FK_tax_rate_tax_region_id" FOREIGN KEY (tax_region_id) REFERENCES public.tax_region(id) ON DELETE CASCADE;


--
-- Name: tax_region FK_tax_region_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT "FK_tax_region_parent_id" FOREIGN KEY (parent_id) REFERENCES public.tax_region(id) ON DELETE CASCADE;


--
-- Name: tax_region FK_tax_region_provider_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_region
    ADD CONSTRAINT "FK_tax_region_provider_id" FOREIGN KEY (provider_id) REFERENCES public.tax_provider(id) ON DELETE SET NULL;


--
-- Name: application_method_buy_rules application_method_buy_rules_application_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_application_method_id_foreign FOREIGN KEY (application_method_id) REFERENCES public.promotion_application_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_method_buy_rules application_method_buy_rules_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_method_buy_rules
    ADD CONSTRAINT application_method_buy_rules_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_method_target_rules application_method_target_rules_application_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_application_method_id_foreign FOREIGN KEY (application_method_id) REFERENCES public.promotion_application_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_method_target_rules application_method_target_rules_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_method_target_rules
    ADD CONSTRAINT application_method_target_rules_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_mfa_factor auth_mfa_factor_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_mfa_factor
    ADD CONSTRAINT auth_mfa_factor_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_mfa_recovery_code auth_mfa_recovery_code_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_mfa_recovery_code
    ADD CONSTRAINT auth_mfa_recovery_code_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_password_reset_token auth_password_reset_token_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_password_reset_token auth_password_reset_token_provider_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_password_reset_token
    ADD CONSTRAINT auth_password_reset_token_provider_identity_id_foreign FOREIGN KEY (provider_identity_id) REFERENCES public.provider_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_verification auth_verification_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_verification
    ADD CONSTRAINT auth_verification_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: capture capture_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capture
    ADD CONSTRAINT capture_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart cart_billing_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_billing_address_id_foreign FOREIGN KEY (billing_address_id) REFERENCES public.cart_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_line_item_adjustment cart_line_item_adjustment_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_line_item_adjustment
    ADD CONSTRAINT cart_line_item_adjustment_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.cart_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_line_item cart_line_item_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_line_item
    ADD CONSTRAINT cart_line_item_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_line_item_tax_line cart_line_item_tax_line_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_line_item_tax_line
    ADD CONSTRAINT cart_line_item_tax_line_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.cart_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart cart_shipping_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_shipping_address_id_foreign FOREIGN KEY (shipping_address_id) REFERENCES public.cart_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_shipping_method_adjustment cart_shipping_method_adjustment_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_shipping_method_adjustment
    ADD CONSTRAINT cart_shipping_method_adjustment_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.cart_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_shipping_method cart_shipping_method_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_shipping_method
    ADD CONSTRAINT cart_shipping_method_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_shipping_method_tax_line cart_shipping_method_tax_line_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_shipping_method_tax_line
    ADD CONSTRAINT cart_shipping_method_tax_line_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.cart_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: commission_rate_value commission_rate_value_commission_rate_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_rate_value
    ADD CONSTRAINT commission_rate_value_commission_rate_id_foreign FOREIGN KEY (commission_rate_id) REFERENCES public.commission_rate(id) ON UPDATE CASCADE;


--
-- Name: commission_rule commission_rule_commission_rate_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_rule
    ADD CONSTRAINT commission_rule_commission_rate_id_foreign FOREIGN KEY (commission_rate_id) REFERENCES public.commission_rate(id) ON UPDATE CASCADE;


--
-- Name: credit_line credit_line_cart_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_line
    ADD CONSTRAINT credit_line_cart_id_foreign FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON UPDATE CASCADE;


--
-- Name: customer_address customer_address_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT customer_address_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_group_customer customer_group_customer_customer_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_customer_group_id_foreign FOREIGN KEY (customer_group_id) REFERENCES public.customer_group(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_group_customer customer_group_customer_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_group_customer
    ADD CONSTRAINT customer_group_customer_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fulfillment fulfillment_delivery_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_delivery_address_id_foreign FOREIGN KEY (delivery_address_id) REFERENCES public.fulfillment_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fulfillment_item fulfillment_item_fulfillment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_item
    ADD CONSTRAINT fulfillment_item_fulfillment_id_foreign FOREIGN KEY (fulfillment_id) REFERENCES public.fulfillment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fulfillment_label fulfillment_label_fulfillment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment_label
    ADD CONSTRAINT fulfillment_label_fulfillment_id_foreign FOREIGN KEY (fulfillment_id) REFERENCES public.fulfillment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fulfillment fulfillment_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.fulfillment_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fulfillment fulfillment_shipping_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulfillment
    ADD CONSTRAINT fulfillment_shipping_option_id_foreign FOREIGN KEY (shipping_option_id) REFERENCES public.shipping_option(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: geo_zone geo_zone_service_zone_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.geo_zone
    ADD CONSTRAINT geo_zone_service_zone_id_foreign FOREIGN KEY (service_zone_id) REFERENCES public.service_zone(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: image image_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_level inventory_level_inventory_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_level
    ADD CONSTRAINT inventory_level_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: member_invite member_invite_seller_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_invite
    ADD CONSTRAINT member_invite_seller_id_foreign FOREIGN KEY (seller_id) REFERENCES public.seller(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification notification_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.notification_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: onboarding onboarding_account_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding
    ADD CONSTRAINT onboarding_account_id_foreign FOREIGN KEY (account_id) REFERENCES public.payout_account(id) ON UPDATE CASCADE;


--
-- Name: order order_billing_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_billing_address_id_foreign FOREIGN KEY (billing_address_id) REFERENCES public.order_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_change_action order_change_action_order_change_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_change_action
    ADD CONSTRAINT order_change_action_order_change_id_foreign FOREIGN KEY (order_change_id) REFERENCES public.order_change(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_change order_change_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_change
    ADD CONSTRAINT order_change_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_credit_line order_credit_line_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_credit_line
    ADD CONSTRAINT order_credit_line_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_item order_item_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_item order_item_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_line_item_adjustment order_line_item_adjustment_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_line_item_adjustment
    ADD CONSTRAINT order_line_item_adjustment_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_line_item_tax_line order_line_item_tax_line_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_line_item_tax_line
    ADD CONSTRAINT order_line_item_tax_line_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.order_line_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_line_item order_line_item_totals_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_line_item
    ADD CONSTRAINT order_line_item_totals_id_foreign FOREIGN KEY (totals_id) REFERENCES public.order_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order order_shipping_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_shipping_address_id_foreign FOREIGN KEY (shipping_address_id) REFERENCES public.order_address(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_shipping_method_adjustment order_shipping_method_adjustment_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_shipping_method_adjustment
    ADD CONSTRAINT order_shipping_method_adjustment_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.order_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_shipping_method_tax_line order_shipping_method_tax_line_shipping_method_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_shipping_method_tax_line
    ADD CONSTRAINT order_shipping_method_tax_line_shipping_method_id_foreign FOREIGN KEY (shipping_method_id) REFERENCES public.order_shipping_method(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_shipping order_shipping_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_shipping
    ADD CONSTRAINT order_shipping_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_summary order_summary_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_summary
    ADD CONSTRAINT order_summary_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_transaction order_transaction_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_transaction
    ADD CONSTRAINT order_transaction_order_id_foreign FOREIGN KEY (order_id) REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_collection_payment_providers payment_collection_payment_providers_payment_col_aa276_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_payment_col_aa276_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_collection_payment_providers payment_collection_payment_providers_payment_pro_2d555_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_collection_payment_providers
    ADD CONSTRAINT payment_collection_payment_providers_payment_pro_2d555_foreign FOREIGN KEY (payment_provider_id) REFERENCES public.payment_provider(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_details payment_details_seller_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_details
    ADD CONSTRAINT payment_details_seller_id_foreign FOREIGN KEY (seller_id) REFERENCES public.seller(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment payment_payment_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_payment_collection_id_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_session payment_session_payment_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_session
    ADD CONSTRAINT payment_session_payment_collection_id_foreign FOREIGN KEY (payment_collection_id) REFERENCES public.payment_collection(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payout payout_account_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_account_id_foreign FOREIGN KEY (account_id) REFERENCES public.payout_account(id) ON UPDATE CASCADE;


--
-- Name: price_list_rule price_list_rule_price_list_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_list_rule
    ADD CONSTRAINT price_list_rule_price_list_id_foreign FOREIGN KEY (price_list_id) REFERENCES public.price_list(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price price_price_list_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_price_list_id_foreign FOREIGN KEY (price_list_id) REFERENCES public.price_list(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price price_price_set_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price
    ADD CONSTRAINT price_price_set_id_foreign FOREIGN KEY (price_set_id) REFERENCES public.price_set(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: price_rule price_rule_price_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rule
    ADD CONSTRAINT price_rule_price_id_foreign FOREIGN KEY (price_id) REFERENCES public.price(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_attribute_value product_attribute_value_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_attribute_value
    ADD CONSTRAINT product_attribute_value_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.product_attribute(id) ON DELETE CASCADE;


--
-- Name: product_category product_category_parent_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_parent_category_id_foreign FOREIGN KEY (parent_category_id) REFERENCES public.product_category(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_category_product product_category_product_product_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_product_category_id_foreign FOREIGN KEY (product_category_id) REFERENCES public.product_category(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_category_product product_category_product_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category_product
    ADD CONSTRAINT product_category_product_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_change_action product_change_action_product_change_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_change_action
    ADD CONSTRAINT product_change_action_product_change_id_fkey FOREIGN KEY (product_change_id) REFERENCES public.product_change(id) ON DELETE SET NULL;


--
-- Name: product product_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_collection_id_foreign FOREIGN KEY (collection_id) REFERENCES public.product_collection(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_option_value product_option_value_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_option_value
    ADD CONSTRAINT product_option_value_option_id_foreign FOREIGN KEY (option_id) REFERENCES public.product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_product_option product_product_option_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_product_option product_product_option_product_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_option
    ADD CONSTRAINT product_product_option_product_option_id_foreign FOREIGN KEY (product_option_id) REFERENCES public.product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_product_option_value product_product_option_value_product_option_value_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_product_option_value_id_foreign FOREIGN KEY (product_option_value_id) REFERENCES public.product_option_value(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_product_option_value product_product_option_value_product_product_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_product_option_value
    ADD CONSTRAINT product_product_option_value_product_product_option_id_foreign FOREIGN KEY (product_product_option_id) REFERENCES public.product_product_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_tags product_tags_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_tags product_tags_product_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_product_tag_id_foreign FOREIGN KEY (product_tag_id) REFERENCES public.product_tag(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product product_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_type_id_foreign FOREIGN KEY (type_id) REFERENCES public.product_type(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_variant_option product_variant_option_option_value_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_option_value_id_foreign FOREIGN KEY (option_value_id) REFERENCES public.product_option_value(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variant_option product_variant_option_variant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant_option
    ADD CONSTRAINT product_variant_option_variant_id_foreign FOREIGN KEY (variant_id) REFERENCES public.product_variant(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variant product_variant_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.product(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variant_product_image product_variant_product_image_image_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variant_product_image
    ADD CONSTRAINT product_variant_product_image_image_id_foreign FOREIGN KEY (image_id) REFERENCES public.image(id) ON DELETE CASCADE;


--
-- Name: professional_details professional_details_seller_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_details
    ADD CONSTRAINT professional_details_seller_id_foreign FOREIGN KEY (seller_id) REFERENCES public.seller(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_application_method promotion_application_method_promotion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_application_method
    ADD CONSTRAINT promotion_application_method_promotion_id_foreign FOREIGN KEY (promotion_id) REFERENCES public.promotion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_campaign_budget promotion_campaign_budget_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_campaign_budget
    ADD CONSTRAINT promotion_campaign_budget_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.promotion_campaign(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_campaign_budget_usage promotion_campaign_budget_usage_budget_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_campaign_budget_usage
    ADD CONSTRAINT promotion_campaign_budget_usage_budget_id_foreign FOREIGN KEY (budget_id) REFERENCES public.promotion_campaign_budget(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion promotion_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.promotion_campaign(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: promotion_promotion_rule promotion_promotion_rule_promotion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_promotion_id_foreign FOREIGN KEY (promotion_id) REFERENCES public.promotion(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_promotion_rule promotion_promotion_rule_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_promotion_rule
    ADD CONSTRAINT promotion_promotion_rule_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promotion_rule_value promotion_rule_value_promotion_rule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_rule_value
    ADD CONSTRAINT promotion_rule_value_promotion_rule_id_foreign FOREIGN KEY (promotion_rule_id) REFERENCES public.promotion_rule(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: provider_identity provider_identity_auth_identity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_identity
    ADD CONSTRAINT provider_identity_auth_identity_id_foreign FOREIGN KEY (auth_identity_id) REFERENCES public.auth_identity(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rbac_role_parent rbac_role_parent_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbac_role_parent
    ADD CONSTRAINT rbac_role_parent_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.rbac_role(id) ON UPDATE CASCADE;


--
-- Name: rbac_role_parent rbac_role_parent_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbac_role_parent
    ADD CONSTRAINT rbac_role_parent_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.rbac_role(id) ON UPDATE CASCADE;


--
-- Name: rbac_role_policy rbac_role_policy_policy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbac_role_policy
    ADD CONSTRAINT rbac_role_policy_policy_id_foreign FOREIGN KEY (policy_id) REFERENCES public.rbac_policy(id) ON UPDATE CASCADE;


--
-- Name: rbac_role_policy rbac_role_policy_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rbac_role_policy
    ADD CONSTRAINT rbac_role_policy_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.rbac_role(id) ON UPDATE CASCADE;


--
-- Name: refund refund_payment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund
    ADD CONSTRAINT refund_payment_id_foreign FOREIGN KEY (payment_id) REFERENCES public.payment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: region_country region_country_region_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region_country
    ADD CONSTRAINT region_country_region_id_foreign FOREIGN KEY (region_id) REFERENCES public.region(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reservation_item reservation_item_inventory_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_item
    ADD CONSTRAINT reservation_item_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_item(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: return_reason return_reason_parent_return_reason_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_reason
    ADD CONSTRAINT return_reason_parent_return_reason_id_foreign FOREIGN KEY (parent_return_reason_id) REFERENCES public.return_reason(id);


--
-- Name: seller_address seller_address_seller_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_address
    ADD CONSTRAINT seller_address_seller_id_foreign FOREIGN KEY (seller_id) REFERENCES public.seller(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_zone service_zone_fulfillment_set_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_zone
    ADD CONSTRAINT service_zone_fulfillment_set_id_foreign FOREIGN KEY (fulfillment_set_id) REFERENCES public.fulfillment_set(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_option shipping_option_provider_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_provider_id_foreign FOREIGN KEY (provider_id) REFERENCES public.fulfillment_provider(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: shipping_option_rule shipping_option_rule_shipping_option_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option_rule
    ADD CONSTRAINT shipping_option_rule_shipping_option_id_foreign FOREIGN KEY (shipping_option_id) REFERENCES public.shipping_option(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_option shipping_option_service_zone_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_service_zone_id_foreign FOREIGN KEY (service_zone_id) REFERENCES public.service_zone(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_option shipping_option_shipping_option_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_shipping_option_type_id_foreign FOREIGN KEY (shipping_option_type_id) REFERENCES public.shipping_option_type(id) ON UPDATE CASCADE;


--
-- Name: shipping_option shipping_option_shipping_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_option
    ADD CONSTRAINT shipping_option_shipping_profile_id_foreign FOREIGN KEY (shipping_profile_id) REFERENCES public.shipping_profile(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_location stock_location_address_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_location
    ADD CONSTRAINT stock_location_address_id_foreign FOREIGN KEY (address_id) REFERENCES public.stock_location_address(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_currency store_currency_store_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_currency
    ADD CONSTRAINT store_currency_store_id_foreign FOREIGN KEY (store_id) REFERENCES public.store(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_locale store_locale_store_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_locale
    ADD CONSTRAINT store_locale_store_id_foreign FOREIGN KEY (store_id) REFERENCES public.store(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

