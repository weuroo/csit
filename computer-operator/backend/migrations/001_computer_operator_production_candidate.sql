-- COMPUTER_OPERATOR_PRODUCTION_V1 candidate infrastructure.
-- Additive / disabled by default. No production authority is granted by this migration.

insert into public.pm_computer_capability_registry_v1(
  capability_key, action_class, risk_class, stage, enabled, read_only,
  requires_fresh_owner_auth, requires_human_approval, local_user_presence_required,
  description, constraints_json
) values (
  'COMPUTER_OPERATOR_PRODUCTION_V1','AUTHORIZED_SURFACE_OPERATOR','HIGH','PILOT',false,false,
  true,true,true,
  'Bounded real Windows authorized-surface operator. Request-via-Paojai only; short lease; no persistent authority; no shell/files/clipboard/credentials/high-impact actions.',
  jsonb_build_object(
    'request_via_orchestrator',true,
    'max_lease_seconds',30,
    'max_commands_per_lease',12,
    'max_text_chars',512,
    'allowed_commands',jsonb_build_array('SCREEN_CAPTURE','FOCUS_WINDOW','MOUSE_MOVE','MOUSE_CLICK','TYPE_TEXT','KEY_PRESS'),
    'screen_scope','FOREGROUND_ALLOWLISTED_WINDOW_ONLY',
    'left_click_only',true,
    'shell',false,'file_read',false,'file_write',false,'clipboard',false,'network_discovery',false,
    'credential_surfaces',false,'payment_surfaces',false,'high_impact_actions',false,
    'production_execution',true,
    'persistent_execution_authority',false,'persistent_sensor_authority',false,
    'local_emergency_stop_required',true,'auto_reclose',true,'rollback_required',true
  )
) on conflict (capability_key) do update set
  stage='PILOT', enabled=false, updated_at=now(), constraints_json=excluded.constraints_json,
  description=excluded.description, requires_fresh_owner_auth=true, requires_human_approval=true,
  local_user_presence_required=true;

create table if not exists public.pm_computer_operator_prod_sessions_v1 (
  session_id uuid primary key default gen_random_uuid(),
  device_key text not null references public.pm_computer_device_registry_v1(device_key),
  owner_command_id uuid references public.pm_signed_owner_commands_v1(command_id),
  state text not null default 'AUTHORIZED' check (state in ('AUTHORIZED','CLAIMED','COMPLETED','REVOKED','EXPIRED')),
  allowed_window_titles jsonb not null default '[]'::jsonb,
  allow_screen boolean not null default false,
  allow_mouse boolean not null default false,
  allow_keyboard boolean not null default false,
  high_impact_allowed boolean not null default false,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  completed_at timestamptz,
  revoked_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (high_impact_allowed = false)
);

create table if not exists public.pm_computer_operator_prod_leases_v1 (
  lease_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.pm_computer_operator_prod_sessions_v1(session_id),
  device_key text not null references public.pm_computer_device_registry_v1(device_key),
  state text not null default 'ISSUED' check (state in ('ISSUED','COMPLETED','ABORTED','EXPIRED')),
  lease_nonce text not null unique,
  commands jsonb not null,
  expires_at timestamptz not null,
  completed_at timestamptz,
  result_metadata jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pm_computer_operator_prod_one_live_lease_v1
on public.pm_computer_operator_prod_leases_v1(device_key)
where state='ISSUED';

create table if not exists public.pm_computer_operator_prod_command_queue_v1 (
  command_batch_id uuid primary key default gen_random_uuid(),
  request_key text not null unique,
  device_key text not null references public.pm_computer_device_registry_v1(device_key),
  requested_by_agent_key text not null,
  state text not null default 'PENDING' check (state in ('PENDING','LEASED','COMPLETED','BLOCKED','CANCELLED')),
  allowed_window_titles jsonb not null default '[]'::jsonb,
  commands jsonb not null,
  risk_level text not null default 'HIGH' check (risk_level in ('LOW','MEDIUM','HIGH','CRITICAL')),
  high_impact boolean not null default false,
  human_approval_required boolean not null default true,
  evidence jsonb not null default '{}'::jsonb,
  lease_id uuid references public.pm_computer_operator_prod_leases_v1(lease_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (high_impact = false)
);

create or replace function public.pm_reclose_expired_computer_operator_prod_v1()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare v_expired int:=0; v_live boolean:=false;
begin
  update public.pm_computer_operator_prod_sessions_v1
     set state='EXPIRED',updated_at=now()
   where state in ('AUTHORIZED','CLAIMED') and expires_at<=now();
  update public.pm_computer_operator_prod_leases_v1
     set state='EXPIRED',updated_at=now(),evidence=evidence||jsonb_build_object('expired_at',now())
   where state='ISSUED' and expires_at<=now();
  get diagnostics v_expired=row_count;
  select exists(select 1 from public.pm_computer_operator_prod_leases_v1 where state='ISSUED' and expires_at>now()) into v_live;
  if not v_live then
    update public.pm_computer_capability_registry_v1 set enabled=false,updated_at=now()
     where capability_key='COMPUTER_OPERATOR_PRODUCTION_V1' and enabled=true;
    update public.pm_guardian_circuit_breakers
       set is_open=true,reason='AUTO_RECLOSE_COMPUTER_OPERATOR_PRODUCTION_V1',
           opened_at=case when is_open then opened_at else now() end,
           opened_by='pm_reclose_expired_computer_operator_prod_v1',updated_at=now()
     where component='computer_executor' and is_open=false and coalesce(reason,'') like 'COMPUTER_OPERATOR_PROD_LEASE:%';
  end if;
  return jsonb_build_object('ok',true,'expired_leases',v_expired,'live_lease',v_live);
end $$;

create or replace function public.pm_claim_computer_operator_prod_session_v1(p_device_key text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare s public.pm_computer_operator_prod_sessions_v1%rowtype;
begin
  perform public.pm_reclose_expired_computer_operator_prod_v1();
  select * into s from public.pm_computer_operator_prod_sessions_v1
   where device_key=p_device_key and state='AUTHORIZED' and expires_at>now() and revoked_at is null
   order by created_at desc limit 1 for update;
  if not found then return jsonb_build_object('allowed',false,'reason','NO_ACTIVE_AUTHORIZED_PRODUCTION_SESSION'); end if;
  update public.pm_computer_operator_prod_sessions_v1 set state='CLAIMED',claimed_at=now(),updated_at=now() where session_id=s.session_id;
  return jsonb_build_object('allowed',true,'session_id',s.session_id,'expires_at',s.expires_at,
    'allowed_window_titles',s.allowed_window_titles,'allow_screen',s.allow_screen,'allow_mouse',s.allow_mouse,'allow_keyboard',s.allow_keyboard);
end $$;

-- This function never invents commands. It leases only a preauthorized queue batch.
create or replace function public.pm_issue_computer_operator_prod_lease_v1(p_device_key text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare s public.pm_computer_operator_prod_sessions_v1%rowtype; q public.pm_computer_operator_prod_command_queue_v1%rowtype;
        d public.pm_computer_device_registry_v1%rowtype; c public.pm_computer_capability_registry_v1%rowtype;
        b public.pm_guardian_circuit_breakers%rowtype; v_lease uuid:=gen_random_uuid(); v_nonce text:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''); v_exp timestamptz:=now()+interval '30 seconds';
begin
  perform public.pm_reclose_expired_computer_operator_prod_v1();
  select * into d from public.pm_computer_device_registry_v1 where device_key=p_device_key for update;
  if not found or d.revoked_at is not null or d.owner_binding_state<>'VERIFIED' or d.execution_authority<>true then return jsonb_build_object('allowed',false,'reason','DEVICE_NOT_PRODUCTION_AUTHORIZED'); end if;
  if d.last_seen_at is null or d.last_seen_at<now()-interval '90 seconds' then return jsonb_build_object('allowed',false,'reason','HEARTBEAT_STALE'); end if;
  select * into s from public.pm_computer_operator_prod_sessions_v1 where device_key=p_device_key and state='CLAIMED' and expires_at>now() and revoked_at is null order by claimed_at desc limit 1 for update;
  if not found or s.high_impact_allowed then return jsonb_build_object('allowed',false,'reason','PRODUCTION_SESSION_INVALID'); end if;
  select * into c from public.pm_computer_capability_registry_v1 where capability_key='COMPUTER_OPERATOR_PRODUCTION_V1' for update;
  if not found or c.stage<>'PRODUCTION' or c.enabled<>false or c.requires_fresh_owner_auth<>true or c.requires_human_approval<>true or c.local_user_presence_required<>true then return jsonb_build_object('allowed',false,'reason','CAPABILITY_NOT_RELEASED'); end if;
  select * into b from public.pm_guardian_circuit_breakers where component='computer_executor' for update;
  if not found or b.is_open<>true then return jsonb_build_object('allowed',false,'reason','BREAKER_NOT_OPEN_PRELEASE'); end if;
  select * into q from public.pm_computer_operator_prod_command_queue_v1
   where device_key=p_device_key and state='PENDING' and high_impact=false and human_approval_required=true
   order by created_at asc limit 1 for update skip locked;
  if not found then return jsonb_build_object('allowed',false,'reason','NO_PREAUTHORIZED_COMMAND_BATCH'); end if;
  if jsonb_typeof(q.commands)<>'array' then
    update public.pm_computer_operator_prod_command_queue_v1 set state='BLOCKED',updated_at=now(),evidence=evidence||jsonb_build_object('blocked_reason','COMMANDS_NOT_ARRAY') where command_batch_id=q.command_batch_id;
    return jsonb_build_object('allowed',false,'reason','COMMANDS_NOT_ARRAY');
  end if;
  if jsonb_array_length(q.commands)<1 or jsonb_array_length(q.commands)>12 then
    update public.pm_computer_operator_prod_command_queue_v1 set state='BLOCKED',updated_at=now(),evidence=evidence||jsonb_build_object('blocked_reason','COMMAND_COUNT_INVALID') where command_batch_id=q.command_batch_id;
    return jsonb_build_object('allowed',false,'reason','COMMAND_COUNT_INVALID');
  end if;
  insert into public.pm_computer_operator_prod_leases_v1(lease_id,session_id,device_key,state,lease_nonce,commands,expires_at,evidence)
  values(v_lease,s.session_id,p_device_key,'ISSUED',v_nonce,q.commands,v_exp,jsonb_build_object('command_batch_id',q.command_batch_id,'request_key',q.request_key));
  update public.pm_computer_operator_prod_command_queue_v1 set state='LEASED',lease_id=v_lease,updated_at=now() where command_batch_id=q.command_batch_id;
  update public.pm_computer_capability_registry_v1 set enabled=true,updated_at=now() where capability_key='COMPUTER_OPERATOR_PRODUCTION_V1' and enabled=false;
  if not found then
    update public.pm_computer_operator_prod_leases_v1 set state='ABORTED',updated_at=now(),evidence=evidence||jsonb_build_object('abort_reason','CAPABILITY_ENABLE_RACE') where lease_id=v_lease;
    update public.pm_computer_operator_prod_command_queue_v1 set state='BLOCKED',updated_at=now(),evidence=evidence||jsonb_build_object('blocked_reason','CAPABILITY_ENABLE_RACE') where command_batch_id=q.command_batch_id;
    return jsonb_build_object('allowed',false,'reason','CAPABILITY_ENABLE_RACE');
  end if;
  update public.pm_guardian_circuit_breakers set is_open=false,reason='COMPUTER_OPERATOR_PROD_LEASE:'||v_lease::text||':EXPIRES:'||v_exp::text,opened_at=null,opened_by='pm_issue_computer_operator_prod_lease_v1',updated_at=now() where component='computer_executor' and is_open=true;
  if not found then
    update public.pm_computer_operator_prod_leases_v1 set state='ABORTED',updated_at=now(),evidence=evidence||jsonb_build_object('abort_reason','BREAKER_CLOSE_RACE') where lease_id=v_lease;
    update public.pm_computer_operator_prod_command_queue_v1 set state='BLOCKED',updated_at=now(),evidence=evidence||jsonb_build_object('blocked_reason','BREAKER_CLOSE_RACE') where command_batch_id=q.command_batch_id;
    update public.pm_computer_capability_registry_v1 set enabled=false,updated_at=now() where capability_key='COMPUTER_OPERATOR_PRODUCTION_V1';
    update public.pm_guardian_circuit_breakers set is_open=true,reason='COMPUTER_OPERATOR_PROD_BREAKER_CLOSE_RACE_FAIL_CLOSED',opened_at=coalesce(opened_at,now()),opened_by='pm_issue_computer_operator_prod_lease_v1',updated_at=now() where component='computer_executor';
    return jsonb_build_object('allowed',false,'reason','BREAKER_CLOSE_RACE');
  end if;
  return jsonb_build_object('allowed',true,'lease_id',v_lease,'lease_nonce',v_nonce,'expires_at',v_exp,
    'capability','COMPUTER_OPERATOR_PRODUCTION_V1','production_execution',true,'persistent_execution_authority',false,
    'allow_real_desktop',true,'allow_real_app',true,'allow_screen',s.allow_screen,'allow_mouse',s.allow_mouse,'allow_keyboard',s.allow_keyboard,
    'high_impact_allowed',false,'allowed_window_titles',s.allowed_window_titles,'commands',q.commands);
end $$;

create or replace function public.pm_abort_computer_operator_prod_v1(p_device_key text,p_lease_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
begin
  update public.pm_computer_operator_prod_leases_v1 set state='ABORTED',updated_at=now(),evidence=evidence||jsonb_build_object('abort_reason',left(coalesce(p_reason,'CLIENT_ABORT'),180),'aborted_at',now()) where lease_id=p_lease_id and device_key=p_device_key and state='ISSUED';
  update public.pm_computer_operator_prod_command_queue_v1 set state='BLOCKED',updated_at=now(),evidence=evidence||jsonb_build_object('abort_reason',left(coalesce(p_reason,'CLIENT_ABORT'),180)) where lease_id=p_lease_id and state='LEASED';
  update public.pm_computer_capability_registry_v1 set enabled=false,updated_at=now() where capability_key='COMPUTER_OPERATOR_PRODUCTION_V1';
  update public.pm_guardian_circuit_breakers set is_open=true,reason='COMPUTER_OPERATOR_PROD_ABORT_REOPENED',opened_at=case when is_open then opened_at else now() end,opened_by='pm_abort_computer_operator_prod_v1',updated_at=now() where component='computer_executor';
  return jsonb_build_object('ok',true,'breaker_open',true,'capability_enabled',false);
end $$;

-- Completion only closes the batch; semantic outcome verification remains separate.
create or replace function public.pm_complete_computer_operator_prod_v1(p_device_key text,p_lease_id uuid,p_lease_nonce text,p_results jsonb)
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare l public.pm_computer_operator_prod_leases_v1%rowtype;
begin
  perform public.pm_reclose_expired_computer_operator_prod_v1();
  select * into l from public.pm_computer_operator_prod_leases_v1 where lease_id=p_lease_id and device_key=p_device_key and state='ISSUED' and expires_at>now() and lease_nonce=p_lease_nonce for update;
  if not found then return jsonb_build_object('accepted',false,'reason','LEASE_INVALID_OR_EXPIRED'); end if;
  if jsonb_typeof(p_results)<>'array' or jsonb_array_length(p_results)<1 or jsonb_array_length(p_results)>12 then return jsonb_build_object('accepted',false,'reason','RESULT_COUNT_INVALID'); end if;
  if exists(select 1 from jsonb_array_elements(p_results) x where coalesce((x->>'ok')::boolean,false)<>true) then return jsonb_build_object('accepted',false,'reason','COMMAND_RESULT_FAILED'); end if;
  update public.pm_computer_operator_prod_leases_v1 set state='COMPLETED',completed_at=now(),updated_at=now(),
    result_metadata=jsonb_build_object(
      'result_count',jsonb_array_length(p_results),
      'command_ids',(select coalesce(jsonb_agg(x->>'command_id'),'[]'::jsonb) from jsonb_array_elements(p_results) x),
      'command_types',(select coalesce(jsonb_agg(x->>'type'),'[]'::jsonb) from jsonb_array_elements(p_results) x),
      'completed_at',now(),
      'raw_screen_bytes_stored',false,
      'typed_text_stored',false
    ) where lease_id=p_lease_id;
  update public.pm_computer_operator_prod_command_queue_v1 set state='COMPLETED',updated_at=now(),evidence=evidence||jsonb_build_object('execution_completed_at',now()) where lease_id=p_lease_id and state='LEASED';
  update public.pm_computer_capability_registry_v1 set enabled=false,updated_at=now() where capability_key='COMPUTER_OPERATOR_PRODUCTION_V1';
  update public.pm_guardian_circuit_breakers set is_open=true,reason='COMPUTER_OPERATOR_PROD_COMPLETE_REOPENED',opened_at=case when is_open then opened_at else now() end,opened_by='pm_complete_computer_operator_prod_v1',updated_at=now() where component='computer_executor';
  return jsonb_build_object('accepted',true,'breaker_open',true,'capability_auto_disabled',true,'semantic_outcome_verified',false);
end $$;
