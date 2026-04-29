-- Download Clash Finder accounts.
-- Run this in the Supabase SQL editor for the same project used by group_plans.
-- Passwords and reset answers are hashed with pgcrypto; the browser never writes plain passwords to tables.

create extension if not exists pgcrypto;

create table if not exists public.dl_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  profile_name text not null default 'Me',
  password_hash text not null,
  reset_questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dl_users_username_unique
  on public.dl_users (lower(username));

create table if not exists public.dl_user_sessions (
  token text primary key default encode(gen_random_bytes(32), 'hex'),
  user_id uuid not null references public.dl_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '180 days'
);

create index if not exists dl_user_sessions_user_id_idx
  on public.dl_user_sessions (user_id);

create table if not exists public.dl_user_plans (
  user_id uuid primary key references public.dl_users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dl_users enable row level security;
alter table public.dl_user_sessions enable row level security;
alter table public.dl_user_plans enable row level security;

create or replace function public.dl_clean_username(value text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(value, '')));
$$;

create or replace function public.dl_normalise_answer(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(value, '')), '\s+', ' ', 'g'));
$$;

create or replace function public.dl_hash_reset_answers(reset_answers_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  answer_row jsonb;
  question_id text;
  answer_text text;
  output jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(reset_answers_input) <> 'array' then
    raise exception 'Reset answers must be an array.';
  end if;

  for answer_row in select value from jsonb_array_elements(reset_answers_input)
  loop
    question_id := trim(answer_row->>'questionId');
    answer_text := public.dl_normalise_answer(answer_row->>'answer');

    if question_id <> '' and answer_text <> '' then
      output := output || jsonb_build_array(jsonb_build_object(
        'questionId', question_id,
        'answerHash', crypt(answer_text, gen_salt('bf'))
      ));
    end if;
  end loop;

  if jsonb_array_length(output) < 1 then
    raise exception 'Answer at least one reset question.';
  end if;

  return output;
end;
$$;

create or replace function public.dl_create_session(user_id_input uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_token text;
begin
  delete from public.dl_user_sessions where expires_at < now();

  insert into public.dl_user_sessions (user_id)
  values (user_id_input)
  returning token into next_token;

  return next_token;
end;
$$;

create or replace function public.dl_user_for_session(session_token_input text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user_id uuid;
begin
  select user_id into found_user_id
  from public.dl_user_sessions
  where token = session_token_input
    and expires_at > now();

  if found_user_id is null then
    raise exception 'Session expired. Log in again.';
  end if;

  return found_user_id;
end;
$$;

create or replace function public.dl_auth_payload(user_row public.dl_users, session_token text)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'session', jsonb_build_object(
      'userId', user_row.id,
      'username', user_row.username,
      'token', session_token
    ),
    'plan', (
      select payload
      from public.dl_user_plans
      where user_id = user_row.id
    )
  );
$$;

create or replace function public.dl_register_account(
  username_input text,
  password_input text,
  profile_name_input text,
  reset_answers_input jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  username_key text := public.dl_clean_username(username_input);
  new_user public.dl_users;
  session_token text;
begin
  if username_key !~ '^[a-z0-9_.-]{3,32}$' then
    raise exception 'Use 3-32 letters, numbers, dots, dashes or underscores for your username.';
  end if;

  if length(coalesce(password_input, '')) < 8 then
    raise exception 'Password must be at least 8 characters.';
  end if;

  insert into public.dl_users (username, profile_name, password_hash, reset_questions)
  values (
    username_key,
    coalesce(nullif(trim(profile_name_input), ''), 'Me'),
    crypt(password_input, gen_salt('bf')),
    public.dl_hash_reset_answers(reset_answers_input)
  )
  returning * into new_user;

  session_token := public.dl_create_session(new_user.id);
  return public.dl_auth_payload(new_user, session_token);
exception
  when unique_violation then
    raise exception 'That username is already taken.';
end;
$$;

create or replace function public.dl_login_account(username_input text, password_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  username_key text := public.dl_clean_username(username_input);
  found_user public.dl_users;
  session_token text;
begin
  select * into found_user
  from public.dl_users
  where lower(username) = username_key;

  if found_user.id is null or crypt(password_input, found_user.password_hash) <> found_user.password_hash then
    raise exception 'Username or password is wrong.';
  end if;

  session_token := public.dl_create_session(found_user.id);
  return public.dl_auth_payload(found_user, session_token);
end;
$$;

create or replace function public.dl_save_account_plan(session_token_input text, payload_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user_id uuid := public.dl_user_for_session(session_token_input);
begin
  insert into public.dl_user_plans (user_id, payload, updated_at)
  values (found_user_id, payload_input, now())
  on conflict (user_id)
  do update set payload = excluded.payload, updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.dl_get_account_plan(session_token_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user_id uuid := public.dl_user_for_session(session_token_input);
  found_payload jsonb;
begin
  select payload into found_payload
  from public.dl_user_plans
  where user_id = found_user_id;

  return found_payload;
end;
$$;

create or replace function public.dl_get_reset_questions(username_input text)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  found_questions jsonb;
begin
  select reset_questions into found_questions
  from public.dl_users
  where lower(username) = public.dl_clean_username(username_input);

  if found_questions is null then
    raise exception 'No account found for that username.';
  end if;

  return array(
    select item.value->>'questionId'
    from jsonb_array_elements(found_questions) as item(value)
  );
end;
$$;

create or replace function public.dl_reset_account_password(
  username_input text,
  reset_answers_input jsonb,
  new_password_input text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user public.dl_users;
  stored_answer jsonb;
  submitted_answer text;
begin
  if length(coalesce(new_password_input, '')) < 8 then
    raise exception 'Password must be at least 8 characters.';
  end if;

  select * into found_user
  from public.dl_users
  where lower(username) = public.dl_clean_username(username_input);

  if found_user.id is null then
    raise exception 'No account found for that username.';
  end if;

  for stored_answer in select value from jsonb_array_elements(found_user.reset_questions)
  loop
    select public.dl_normalise_answer(answer_item.value->>'answer') into submitted_answer
    from jsonb_array_elements(reset_answers_input) as answer_item(value)
    where answer_item.value->>'questionId' = stored_answer->>'questionId'
    limit 1;

    if submitted_answer is null or crypt(submitted_answer, stored_answer->>'answerHash') <> stored_answer->>'answerHash' then
      raise exception 'One or more reset answers is wrong.';
    end if;
  end loop;

  update public.dl_users
  set password_hash = crypt(new_password_input, gen_salt('bf')),
      updated_at = now()
  where id = found_user.id;

  delete from public.dl_user_sessions where user_id = found_user.id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.dl_register_account(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.dl_login_account(text, text) to anon, authenticated;
grant execute on function public.dl_save_account_plan(text, jsonb) to anon, authenticated;
grant execute on function public.dl_get_account_plan(text) to anon, authenticated;
grant execute on function public.dl_get_reset_questions(text) to anon, authenticated;
grant execute on function public.dl_reset_account_password(text, jsonb, text) to anon, authenticated;
