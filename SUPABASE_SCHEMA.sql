-- ================================================================
-- Participant Registration App — Supabase Schema
-- metsslbg-stack project: cpqhljqwxjgscdoepant.supabase.co
-- mashiteye staging project: hcdgrdkahowzestlpges.supabase.co
-- Last updated: May 2026
-- Run all of this in Supabase Dashboard → SQL Editor
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
  status                  text DEFAULT 'Draft',
  certificate_eligibility  text DEFAULT 'signed_once',
  signatory_name          text,
  signatory_title         text,
  signatory_signature_url text,
  created_at              timestamptz DEFAULT now(),
  -- Added via migration (see migration SQL below):
  -- delivery_mode text NOT NULL DEFAULT 'in_person'
  -- CHECK (delivery_mode IN ('in_person','online','hybrid'))
  delivery_mode           text NOT NULL DEFAULT 'in_person'
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
  created_at     timestamptz DEFAULT now(),
  -- Added via migration (see migration SQL below):
  attendance_mode   text,  -- 'in_person' | 'online' — set when participant signs/completes attendance
  submission_method text   -- 'attendant_assisted' | 'self_completed' | 'admin_added'
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

-- One attendance record per participant per day per event
CREATE UNIQUE INDEX IF NOT EXISTS unique_attendance_day
  ON attendance(event_id, participant_id, day);

-- One participant code per event
CREATE UNIQUE INDEX IF NOT EXISTS unique_participant_code_per_event
  ON participants(event_id, code)
  WHERE code IS NOT NULL;


-- Validate certificate eligibility values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_certificate_eligibility_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_certificate_eligibility_check
      CHECK (certificate_eligibility IN ('signed_once','signed_all_days','all_registered'));
  END IF;
END $$;

-- Validate event status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_status_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_status_check
      CHECK (status IN ('Draft','Open','Live','Closed','Archived'));
  END IF;
END $$;

-- Validate reg_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participants_reg_type_check'
  ) THEN
    ALTER TABLE participants
      ADD CONSTRAINT participants_reg_type_check
      CHECK (reg_type IN ('Pre-registration', 'Walk-in'));
  END IF;
END $$;

-- Validate sex values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participants_sex_check'
  ) THEN
    ALTER TABLE participants
      ADD CONSTRAINT participants_sex_check
      CHECK (sex IN ('Male', 'Female'));
  END IF;
END $$;

-- Validate days range
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_days_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_days_check
      CHECK (days BETWEEN 1 AND 10);
  END IF;
END $$;

-- ── FUNCTIONS ────────────────────────────────────────────────────

-- Atomic participant code generation with advisory lock
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

-- ── RLS POLICIES ─────────────────────────────────────────────────

ALTER TABLE events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance   ENABLE ROW LEVEL SECURITY;

-- Events: public read, public insert, public update/delete
-- (admin actions gated at app layer via password)
CREATE POLICY "public select events"   ON events FOR SELECT USING (true);
CREATE POLICY "public insert events"   ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "public update events"   ON events FOR UPDATE USING (true);
CREATE POLICY "public delete events"   ON events FOR DELETE USING (true);

-- Participants: public read and insert, no delete via anon
CREATE POLICY "public select participants" ON participants FOR SELECT USING (true);
CREATE POLICY "public insert participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete participants" ON participants FOR DELETE USING (true);

-- Attendance: public read and insert, update for re-sign
CREATE POLICY "public insert attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "public select attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "public update attendance" ON attendance FOR UPDATE USING (true);

-- ── STORAGE ──────────────────────────────────────────────────────
-- Bucket: signatures (public)
-- Used for: attendance signatures + event signatory images
-- Path: signatories/{event_id}.{ext} for signatory images
--       {event_id}/{participant_id}/{day}_{timestamp}.png for attendance

-- After creating the signatures bucket, run:
-- CREATE POLICY "public upload signatures"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'signatures');
-- CREATE POLICY "public read signatures"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'signatures');

-- ── AUDIT LOG ─────────────────────────────────────────────────────
-- Tracks high-value admin and operational actions for governance

CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid,
  entity_type text NOT NULL,
  entity_id   uuid,
  action      text NOT NULL,
  actor       text,
  details     jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert audit" ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "public select audit" ON audit_log FOR SELECT USING (true);

-- Logged actions: event_created, event_edited, event_deleted,
-- csv_imported, participant_edited, participant_deleted,
-- attendance_signed, certificates_generated,
-- delivery_mode_changed, attendance_mode_set

-- ── MIGRATION SQL (run on staging first, then production after approval) ─────
-- Staging:   hcdgrdkahowzestlpges.supabase.co
-- Production: cpqhljqwxjgscdoepant.supabase.co  (DO NOT RUN without explicit approval)
--
-- alter table public.events
--   add column if not exists delivery_mode text not null default 'in_person';
--
-- alter table public.participants
--   add column if not exists attendance_mode text;
--
-- alter table public.participants
--   add column if not exists submission_method text;
--
-- do $$ begin
--   if not exists (select 1 from pg_constraint where conname='events_delivery_mode_check' and conrelid='public.events'::regclass)
--   then alter table public.events add constraint events_delivery_mode_check check (delivery_mode in ('in_person','online','hybrid')); end if;
-- end $$;
--
-- do $$ begin
--   if not exists (select 1 from pg_constraint where conname='participants_attendance_mode_check' and conrelid='public.participants'::regclass)
--   then alter table public.participants add constraint participants_attendance_mode_check check (attendance_mode is null or attendance_mode in ('in_person','online')); end if;
-- end $$;
--
-- do $$ begin
--   if not exists (select 1 from pg_constraint where conname='participants_submission_method_check' and conrelid='public.participants'::regclass)
--   then alter table public.participants add constraint participants_submission_method_check check (submission_method is null or submission_method in ('attendant_assisted','self_completed','admin_added')); end if;
-- end $$;
--
-- -- Backfill existing Walk-in records as in-person / attendant-assisted (safe general default).
-- -- KNOWN ONLINE EVENTS (e.g. WETTS REFRESHER TRAINING) must be corrected separately — see below.
-- update public.participants
-- set attendance_mode = coalesce(attendance_mode, 'in_person'),
--     submission_method = coalesce(submission_method, 'attendant_assisted')
-- where reg_type = 'Walk-in';

-- ── WETTS REFRESHER TRAINING manual correction (online event) ────────────────
-- Step 1: confirm event
-- select id, name, event_date, days, delivery_mode
-- from public.events
-- where name ilike '%WETTS%REFRESHER%'
-- order by event_date desc;
--
-- Step 2: update event delivery_mode (replace <CONFIRMED_EVENT_ID>)
-- update public.events set delivery_mode = 'online' where id = '<CONFIRMED_EVENT_ID>';
--
-- Step 3: correct linked Walk-in participants
-- update public.participants
-- set attendance_mode = 'online',
--     submission_method = 'self_completed'   -- overwrite: WETTS was fully online / self-completed
-- -- If the submission method is uncertain, correct only the mode instead:
-- --   set attendance_mode = 'online'
-- where event_id = '<CONFIRMED_EVENT_ID>'
--   and reg_type = 'Walk-in';

-- Optional event-specific banner image URL (added later).
-- events.banner_url text nullable. Blank/null => app shows default banner (banner.jpg).
-- alter table public.events add column if not exists banner_url text;
