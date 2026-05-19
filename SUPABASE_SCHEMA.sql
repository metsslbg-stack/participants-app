-- ================================================================
-- METSS LBG Participant Registration App — Supabase Schema
-- Production project: cpqhljqwxjgscdoepant.supabase.co
-- Staging project:    hcdgrdkahowzestlpges.supabase.co
-- Last updated: May 2026
-- ================================================================
-- Run all of this in Supabase Dashboard → SQL Editor
-- to recreate or verify the full database schema.
-- ================================================================

-- ── TABLES ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  organizer               text,
  program                 text,
  event_date              date,
  days                    integer DEFAULT 1,
  mel_question            text,
  mel_question_required   text DEFAULT 'false',
  event_code              text,
  signatory_name          text,
  signatory_title         text,
  signatory_signature_url text,
  created_at              timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid REFERENCES events(id) ON DELETE CASCADE,
  name           text NOT NULL,
  sex            text,
  org            text,
  prog           text,
  position_title text,
  email          text,
  phone          text,
  notes          text,
  code           text,
  day_attended   text,
  reg_type       text DEFAULT 'Pre-registration',
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  uuid REFERENCES participants(id) ON DELETE CASCADE,
  event_id        uuid REFERENCES events(id) ON DELETE CASCADE,
  day             text NOT NULL,
  signed_at       timestamptz DEFAULT now(),
  signature_url   text
);

-- ── CONSTRAINTS ──────────────────────────────────────────────────

-- Prevents duplicate attendance for same participant on same day
-- Critical for concurrent signing prevention
CREATE UNIQUE INDEX IF NOT EXISTS unique_attendance_day
  ON attendance(event_id, participant_id, day);

-- ── FUNCTIONS ────────────────────────────────────────────────────

-- Atomic participant code generation
-- Uses advisory lock to prevent race conditions under concurrent submissions
CREATE OR REPLACE FUNCTION get_next_participant_code(p_event_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  max_num integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_event_id::text));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '[^0-9]', '', 'g'), '')::integer), 0)
    INTO max_num
    FROM participants
   WHERE event_id = p_event_id;
  RETURN lpad((max_num + 1)::text, 3, '0');
END;
$$;

-- ── STORAGE ──────────────────────────────────────────────────────
-- Bucket: signatures (public)
-- Used for: participant attendance signatures, event signatory images
-- Path pattern: {event_id}/{participant_id}/{day}_{timestamp}.png
