-- Meeting room: bookings of any length, held as "pending" until an admin
-- approves them.
--
-- Run once in Supabase → SQL Editor, on project haxojruugctziwernuap.
-- Safe to run again: every step checks whether it has already been applied.

begin;

-- 1. Start/end as minutes since midnight (10:30 = 630), plus an approval status.
alter table public.meeting_room_bookings
  add column if not exists start_minute integer,
  add column if not exists end_minute   integer,
  add column if not exists status       text,
  add column if not exists decided_at   timestamptz;

-- 2. Existing bookings were fixed two-hour blocks, confirmed on the spot.
update public.meeting_room_bookings
set start_minute = hour * 60,
    end_minute   = hour * 60 + 120,
    status       = 'approved'
where start_minute is null;

update public.meeting_room_bookings set status = 'approved' where status is null;

alter table public.meeting_room_bookings
  alter column start_minute set not null,
  alter column end_minute   set not null,
  alter column status       set not null,
  alter column status       set default 'pending',
  alter column hour         drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'meeting_room_bookings_status_check') then
    alter table public.meeting_room_bookings
      add constraint meeting_room_bookings_status_check
      check (status in ('pending', 'approved', 'declined'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'meeting_room_bookings_range_check') then
    alter table public.meeting_room_bookings
      add constraint meeting_room_bookings_range_check
      check (start_minute >= 0 and end_minute <= 1440 and end_minute > start_minute);
  end if;
end $$;

-- 3. The old "one booking per (date, hour)" rule doesn't fit variable lengths.
--    Drop whatever unique constraint or index enforced it (the primary key stays).
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.meeting_room_bookings'::regclass and contype = 'u'
  loop
    execute format('alter table public.meeting_room_bookings drop constraint %I', r.conname);
  end loop;

  for r in
    select i.relname as indexname
    from pg_index x
    join pg_class i on i.oid = x.indexrelid
    where x.indrelid = 'public.meeting_room_bookings'::regclass
      and x.indisunique and not x.indisprimary
  loop
    execute format('drop index public.%I', r.indexname);
  end loop;
end $$;

-- 4. No two live bookings (pending or approved) may overlap on the same day.
--    Enforced by the database, so two people submitting at the same moment
--    can't both get the slot. Declined requests free the time up again.
create extension if not exists btree_gist with schema extensions;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'meeting_room_bookings_no_overlap') then
    alter table public.meeting_room_bookings
      add constraint meeting_room_bookings_no_overlap
      exclude using gist (date with =, int4range(start_minute, end_minute) with &&)
      where (status in ('pending', 'approved'));
  end if;
end $$;

commit;

-- Check: should list every booking with a start, end and status.
select date, start_minute / 60.0 as starts, end_minute / 60.0 as ends, status
from public.meeting_room_bookings
order by date desc, start_minute
limit 20;
