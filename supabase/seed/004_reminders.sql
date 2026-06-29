-- =============================================================================
-- HVAC AI Lead Intelligence Platform - Demo Reminders
-- Version: 1.1.0
-- =============================================================================

insert into public.reminders (id, lead_id, reminder_date, reminder_time, priority, message, status)
values
(
    '20000000-2222-2222-2222-222222222222',
    '20000000-0000-0000-0000-000000000002',
    current_date + interval '1 day',
    '09:00:00',
    'MEDIUM',
    'Call Sarah Jenkins to confirm furnace safety check appointment in Houston.',
    'Pending'
),
(
    '40000000-4444-4444-4444-444444444444',
    '40000000-0000-0000-0000-000000000004',
    current_date - interval '1 day',
    '10:15:00',
    'HIGH',
    'Follow up on heat pump installation quote sent to David Miller yesterday. High-value opportunity.',
    'Pending'
);
