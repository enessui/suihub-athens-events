-- Event requests: pending / approved / declined, linked to the event an
-- approval creates.
--
-- Run once in Supabase → SQL Editor, on project haxojruugctziwernuap.
-- Safe to run again: every step checks whether it has already been applied.

begin;

alter table public.event_requests
  add column if not exists status     text,
  add column if not exists event_id   uuid references public.events(id) on delete set null,
  add column if not exists decided_at timestamptz;

update public.event_requests set status = 'pending' where status is null;

alter table public.event_requests
  alter column status set not null,
  alter column status set default 'pending';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'event_requests_status_check') then
    alter table public.event_requests
      add constraint event_requests_status_check
      check (status in ('pending', 'approved', 'declined'));
  end if;
end $$;

-- Requests that were already put on the calendar by hand: match them to their
-- event by title (ignoring case and punctuation), allowing the event title to
-- add words after it, e.g. "... Level 1" → "... Level 1 powered by CAIS".
-- Short titles must match exactly so something like "work" can't match by accident.
update public.event_requests r
set status = 'approved', event_id = e.id, decided_at = now()
from public.events e
where r.status = 'pending'
  and r.event_id is null
  and (
    btrim(lower(regexp_replace(e.title, '[^a-zA-Z0-9]+', ' ', 'g')))
      = btrim(lower(regexp_replace(r.title, '[^a-zA-Z0-9]+', ' ', 'g')))
    or (
      length(btrim(regexp_replace(r.title, '[^a-zA-Z0-9]+', ' ', 'g'))) >= 12
      and strpos(
        btrim(lower(regexp_replace(e.title, '[^a-zA-Z0-9]+', ' ', 'g'))),
        btrim(lower(regexp_replace(r.title, '[^a-zA-Z0-9]+', ' ', 'g')))
      ) > 0
    )
  );

commit;

-- Check: expect 3 approved (already on the calendar) and the rest pending.
select status, count(*) from public.event_requests group by status order by status;
