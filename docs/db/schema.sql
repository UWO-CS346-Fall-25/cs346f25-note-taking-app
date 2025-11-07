CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

create table public.notes (
  id serial not null,
  user_id integer null,
  title character varying(255) not null,
  content text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  user_uuid uuid null,
  constraint notes_pkey primary key (id),
  constraint notes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.users (
  id serial not null,
  username character varying(50) not null,
  email character varying(255) not null,
  password character varying(255) not null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_username_key unique (username)
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_username on public.users using btree (username) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();
