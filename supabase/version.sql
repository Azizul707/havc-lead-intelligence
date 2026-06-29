-- =============================================================================
-- HVAC AI Lead Intelligence Platform - Database Version Query
-- Version: 1.1.0
-- Purpose: Check current schema version and installation history.
-- =============================================================================

-- View all version records
select
    version,
    description,
    installed_at
from public.schema_versions
order by installed_at desc;

-- Show latest version
select
    version as current_schema_version,
    installed_at as installed_on,
    description
from public.schema_versions
order by installed_at desc
limit 1;
