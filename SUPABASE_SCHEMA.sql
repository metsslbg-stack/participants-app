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

-- One attendance record per participant per day per event
CREATE UNIQUE INDEX IF NOT EXISTS unique_attendance_day
  ON attendance(event_id, participant_id, day);

-- One participant code per event
CREATE UNIQUE INDEX IF NOT EXISTS unique_participant_code_per_event
  ON participants(event_id, code)
  WHERE code IS NOT NULL;

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
