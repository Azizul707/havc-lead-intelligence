-- =============================================================================
-- HVAC AI Lead Intelligence Platform - Demo Events
-- Version: 1.1.0
-- =============================================================================

insert into public.lead_events (lead_id, event_type, description, metadata)
values
(
    '30000000-0000-0000-0000-000000000003',
    'NOTE_ADDED',
    'Dispatcher logged an internal note: "Commercial lobby AC compressor is dead. Business critical incident. Building manager notified."',
    '{"bulk": false}'::jsonb
),
(
    '30000000-0000-0000-0000-000000000003',
    'STATUS_CHANGED',
    'Technician visit scheduled for commercial split system overhaul at 4514 Congress Ave, Austin.',
    '{"new_status": "SCHEDULED"}'::jsonb
);
