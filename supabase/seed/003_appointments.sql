-- =============================================================================
-- HVAC AI Lead Intelligence Platform - Demo Appointments
-- Version: 1.1.0
-- =============================================================================

insert into public.appointments (id, lead_id, appointment_date, appointment_time, appointment_type, status, notes)
values (
    '30000000-3333-3333-3333-333333333333',
    '30000000-0000-0000-0000-000000000003',
    current_date,
    '14:30:00',
    'Emergency Repair',
    'Scheduled',
    'Attic access ladder on the 2nd floor corridor. Technician needs tall A-frame ladder. Commercial building at 4514 Congress Ave, Austin.'
);
