drop table if exists notes;
drop table if exists folders;

create table notes (
  id integer primary key generated by default as identity,
  name text not null,
  modified timestamp not null default now(),
  content text not null
);

create table folders (
  id integer primary key generated by default as identity,
  name text not null
);

alter table notes
  add column
    folder_id integer references folders(id) on delete set null;