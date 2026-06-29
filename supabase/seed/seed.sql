-- =============================================================================
-- HVAC AI Lead Intelligence Platform - Master Seed Entry Point
-- Version: 1.1.0
-- Execute this file to populate demo data after running install.sql
-- =============================================================================

-- Seed demo leads (5 realistic HVAC leads)
\ir 002_leads.sql

-- Seed demo appointments (1 scheduled commercial service)
\ir 003_appointments.sql

-- Seed demo reminders (1 pending, 1 overdue)
\ir 004_reminders.sql

-- Seed demo events (audit timeline entries)
\ir 005_events.sql
