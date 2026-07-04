-- =========================================================
-- LEADFLOW CRM / SAAS
-- MIGRATION 001
-- Fundação multiempresa + Recuperação de Vendas
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- Função updated_at
-- =========================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- =========================================================
-- TABELA: empresas
-- =========================================================

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  slug text not null unique,

  documento text,
  email text,
  telefone text,

  plano text not null default 'free'
    check (plano in ('free', 'starter', 'pro', 'enterprise')),

  status text not null default 'ativo'
    check (status in ('ativo', 'inativo', 'trial', 'cancelado')),

  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);


-- =========================================================
-- TABELA: usuarios
-- =========================================================

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),

  empresa_id uuid not null references public.empresas(id) on delete cascade,

  auth_user_id uuid unique,
  nome text not null,
  email text not null,

  cargo text,

  perfil text not null default 'membro'
    check (perfil in ('dono', 'admin', 'membro', 'vendedor', 'suporte')),

  ativo boolean not null default true,

  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now(),

  unique (empresa_id, email)
);


-- =========================================================
-- Índices empresas / usuarios
-- =========================================================

create index if not exists idx_empresas_slug
on public.empresas(slug);

create index if not exists idx_usuarios_empresa_id
on public.usuarios(empresa_id);

create index if not exists idx_usuarios_email
on public.usuarios(email);


-- =========================================================
-- Triggers updated_at
-- =========================================================

drop trigger if exists trg_empresas_updated_at on public.empresas;

create trigger trg_empresas_updated_at
before update on public.empresas
for each row
execute function public.set_updated_at();


drop trigger if exists trg_usuarios_updated_at on public.usuarios;

create trigger trg_usuarios_updated_at
before update on public.usuarios
for each row
execute function public.set_updated_at();


-- =========================================================
-- Empresa e usuário padrão de desenvolvimento
-- =========================================================

insert into public.empresas (nome, slug, email, plano, status)
values (
  'LeadFlow CRM',
  'leadflow-crm',
  'ozielpquaresma@gmail.com',
  'pro',
  'ativo'
)
on conflict (slug) do nothing;


insert into public.usuarios (empresa_id, nome, email, perfil, ativo)
select
  e.id,
  'Oziel Paraguassu',
  'ozielpquaresma@gmail.com',
  'dono',
  true
from public.empresas e
where e.slug = 'leadflow-crm'
on conflict (empresa_id, email) do nothing;


-- =========================================================
-- Adicionar empresa_id nas tabelas existentes
-- =========================================================

alter table public.clientes
add column if not exists empresa_id uuid;

alter table public.leads
add column if not exists empresa_id uuid;

alter table public.pedidos
add column if not exists empresa_id uuid;

alter table public.produtos
add column if not exists empresa_id uuid;

alter table public.automacoes
add column if not exists empresa_id uuid;

alter table public.interacoes
add column if not exists empresa_id uuid;

alter table public.webhooks
add column if not exists empresa_id uuid;


-- =========================================================
-- Vincular dados existentes à empresa padrão
-- =========================================================

update public.clientes
set empresa_id = (select id from public.empresas where slug = 'leadflow-crm' limit 1)
where empresa_id is null;

update public.leads
set empresa_id = (select id from public.empresas where slug = 'leadflow-crm' limit 1)
where empresa_id is null;

update public.pedidos
set empresa_id = (select id from public.empresas where slug = 'leadflow-crm' limit 1)
where empresa_id is null;

update public.produtos
set empresa_id = (select id from public.empresas where slug = 'leadflow-crm' limit 1)
where empresa_id is null;

update public.automacoes
set empresa_id = (select id from public.empresas where slug = 'leadflow-crm' limit 1)
where empresa_id is null;

update public.interacoes
set empresa_id = (select id from public.empresas where slug = 'leadflow-crm' limit 1)
where empresa_id is null;

update public.webhooks
set empresa_id = (select id from public.empresas where slug = 'leadflow-crm' limit 1)
where empresa_id is null;


-- =========================================================
-- Foreign keys com empresas
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_clientes_empresa') then
    alter table public.clientes
    add constraint fk_clientes_empresa
    foreign key (empresa_id) references public.empresas(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_leads_empresa') then
    alter table public.leads
    add constraint fk_leads_empresa
    foreign key (empresa_id) references public.empresas(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_pedidos_empresa') then
    alter table public.pedidos
    add constraint fk_pedidos_empresa
    foreign key (empresa_id) references public.empresas(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_produtos_empresa') then
    alter table public.produtos
    add constraint fk_produtos_empresa
    foreign key (empresa_id) references public.empresas(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_automacoes_empresa') then
    alter table public.automacoes
    add constraint fk_automacoes_empresa
    foreign key (empresa_id) references public.empresas(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_interacoes_empresa') then
    alter table public.interacoes
    add constraint fk_interacoes_empresa
    foreign key (empresa_id) references public.empresas(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_webhooks_empresa') then
    alter table public.webhooks
    add constraint fk_webhooks_empresa
    foreign key (empresa_id) references public.empresas(id) on delete cascade;
  end if;
end $$;


-- =========================================================
-- Índices por empresa
-- =========================================================

create index if not exists idx_clientes_empresa_id
on public.clientes(empresa_id);

create index if not exists idx_leads_empresa_id
on public.leads(empresa_id);

create index if not exists idx_pedidos_empresa_id
on public.pedidos(empresa_id);

create index if not exists idx_produtos_empresa_id
on public.produtos(empresa_id);

create index if not exists idx_automacoes_empresa_id
on public.automacoes(empresa_id);

create index if not exists idx_interacoes_empresa_id
on public.interacoes(empresa_id);

create index if not exists idx_webhooks_empresa_id
on public.webhooks(empresa_id);


-- =========================================================
-- View: Recuperação de Vendas
-- =========================================================

create or replace view public.vw_recuperacao_vendas as
select
  p.id as pedido_id,
  p.empresa_id,

  c.id as cliente_id,
  c.nome as cliente_nome,
  c.email as cliente_email,
  c.telefone as cliente_telefone,
  c.cidade as cliente_cidade,
  c.estado as cliente_estado,

  pr.id as produto_id,
  pr.nome as produto_nome,
  pr.valor as produto_valor,

  pl.id as plataforma_id,
  pl.nome as plataforma_nome,
  pl.slug as plataforma_slug,

  p.pedido_externo_id,
  p.status,
  p.metodo_pagamento,
  p.valor,
  p.checkout_url,
  p.pix_copia_cola,
  p.pix_qrcode_url,
  p.criado_na_plataforma,
  p.pago_em,

  extract(epoch from (now() - p.criado_na_plataforma)) / 60 as minutos_desde_criacao,

  case
    when p.status = 'pix_pendente' then 'Pix pendente'
    when p.status = 'checkout_abandonado' then 'Checkout abandonado'
    when p.status = 'cartao_recusado' then 'Cartão recusado'
    else p.status
  end as status_label,

  case
    when p.status = 'pix_pendente' then 1
    when p.status = 'checkout_abandonado' then 2
    when p.status = 'cartao_recusado' then 3
    else 99
  end as prioridade_recuperacao,

  ultima_interacao.created_at as ultima_interacao_em,
  ultima_interacao.canal as ultima_interacao_canal,
  ultima_interacao.resultado as ultima_interacao_resultado,

  (
    select count(*)
    from public.interacoes i
    where i.pedido_id = p.id
  ) as total_interacoes

from public.pedidos p
left join public.clientes c on c.id = p.cliente_id
left join public.produtos pr on pr.id = p.produto_id
left join public.plataformas pl on pl.id = p.plataforma_id

left join lateral (
  select
    i.created_at,
    i.canal,
    i.resultado
  from public.interacoes i
  where i.pedido_id = p.id
  order by i.created_at desc
  limit 1
) ultima_interacao on true

where p.pago_em is null
  and p.status in ('pix_pendente', 'checkout_abandonado', 'cartao_recusado');


-- =========================================================
-- RLS temporário para desenvolvimento
-- Depois será substituído por políticas seguras por empresa_id
-- =========================================================

alter table public.interacoes enable row level security;

drop policy if exists "Permitir inserir interacoes em desenvolvimento" on public.interacoes;
drop policy if exists "Permitir leitura interacoes em desenvolvimento" on public.interacoes;

create policy "Permitir inserir interacoes em desenvolvimento"
on public.interacoes
for insert
to anon, authenticated
with check (true);

create policy "Permitir leitura interacoes em desenvolvimento"
on public.interacoes
for select
to anon, authenticated
using (true);