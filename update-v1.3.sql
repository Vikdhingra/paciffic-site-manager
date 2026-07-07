-- ═══════════════════════════════════════════════════════════
-- PACIFFIC SITE CRM — v1.3 UPDATE (run once in Supabase SQL Editor)
-- Adds: request acknowledgement loop + photo archiving
-- Safe to run on an existing v1.x database.
-- ═══════════════════════════════════════════════════════════

-- Requests: supervisor acknowledgement of the office's answer
alter table pm_requests add column if not exists site_ack boolean not null default false;
-- Anything already completed doesn't need re-notifying
update pm_requests set site_ack = true where status = 'done';

-- Photos: admin can archive after review
alter table pm_photos add column if not exists archived boolean not null default false;
