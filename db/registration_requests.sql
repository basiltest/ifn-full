-- Registration request flow: a public applicant submits name/email/phone/member_type +
-- (optional/required) graduate certificate. The row + cert are written ONLY by the
-- register-request edge function using the service role, so this table stays fully locked
-- to anon/authenticated clients (no INSERT/SELECT policies). Admins read it through the
-- SECURITY DEFINER RPC below; approve/reject happen in the review-registration edge fn.
--
-- Apply: run this whole file against the project (idempotent).

-- 1. Descriptive label on profiles (NOT a permission role; role stays student/mentor/admin).
alter table public.profiles add column if not exists member_type text;

-- 2. The request queue.
create table if not exists public.registration_requests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  member_type text not null,            -- the "registering as" label (Founder, Investor, ...)
  other_text  text,                     -- free text when member_type = 'Other'
  cert_path   text,                     -- path in the registration-certs bucket; null when waived
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason      text,                     -- disapprove reason (audited)
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  submit_ip   text,                     -- for edge-fn rate limiting
  created_at  timestamptz not null default now()
);

-- One open request per email at a time (Q8). Approved/rejected rows don't block re-apply.
create unique index if not exists registration_requests_one_pending
  on public.registration_requests (lower(email)) where status = 'pending';

create index if not exists registration_requests_status_created
  on public.registration_requests (status, created_at desc);

alter table public.registration_requests enable row level security;
-- No policies on purpose: only the service role (edge functions) touches this table.

-- 3. Admin-only read for the Requests tab.
create or replace function public.admin_list_registration_requests()
returns table (
  id uuid, name text, email text, phone text, member_type text, other_text text,
  cert_path text, status text, reason text, reviewed_at timestamptz, created_at timestamptz
)
language sql security definer set search_path = public as $$
  select r.id, r.name, r.email, r.phone, r.member_type, r.other_text,
         r.cert_path, r.status, r.reason, r.reviewed_at, r.created_at
  from public.registration_requests r
  where public.is_admin()
  order by (r.status = 'pending') desc, r.created_at desc
$$;
grant execute on function public.admin_list_registration_requests() to authenticated;

-- 4. Private bucket for certificates. Only the register-request edge function (service role)
-- writes here, and it already validates type/size/magic-bytes; the bucket-level limits below
-- are defense-in-depth (5 MB, PDF/JPG/PNG only). on-conflict updates so existing buckets get them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('registration-certs', 'registration-certs', false, 5242880,
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admins can read cert objects (so the Requests tab can mint signed URLs). The edge
-- functions upload/delete with the service role, which bypasses RLS.
drop policy if exists "registration-certs admin read" on storage.objects;
create policy "registration-certs admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'registration-certs' and public.is_admin());

-- 5. Helpers the register-request edge function calls (service role only).
--    Does an auth account already exist for this email? (block duplicate sign-ups)
create or replace function public.email_exists(p_email text)
returns boolean
language sql security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users where lower(email) = lower(p_email))
$$;
grant execute on function public.email_exists(text) to service_role;

--    Fan a "new registration request" notification out to every admin.
create or replace function public.notify_admins_new_registration(p_name text, p_member_type text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, payload)
  select p.id, 'registration_request',
         jsonb_build_object('name', p_name, 'member_type', p_member_type)
  from public.profiles p
  where p.role = 'admin' and not coalesce(p.banned, false);
end
$$;
grant execute on function public.notify_admins_new_registration(text, text) to service_role;
