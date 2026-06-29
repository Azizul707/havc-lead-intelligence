// Environment configuration
const ENV_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://localhost:443/supabase.json',
  supabaseKey: process.env.SUPABASE_KEY || 'local_key',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || 'local_key',
  n8nUrl: process.env.N8N_URL || 'http://localhost:5678',
  n8nUsername: process.env.N8N_USERNAME || 'admin',
  n8nPassword: process.env.N8N_PASSWORD || 'admin',
  vercelUrl: process.env.VERCEL_URL || 'http://localhost:3000',
  vercelTeamId: process.env.VERCEL_TEAM_ID || 'local_team',
  vercelProjectId: process.env.VERCEL_PROJECT_ID || 'local_project',
};
export { ENV_CONFIG };

// API configuration
const API_CONFIG = {
  baseUrl: ENV_CONFIG.supabaseUrl + '/api/v1',
  authUrl: ENV_CONFIG.supabaseUrl + '/auth/v1',
  notificationsUrl: ENV_CONFIG.supabaseUrl + '/realtime/v1',
};
export { API_CONFIG };

// Database configuration
const DB_CONFIG = {
  databaseUrl: ENV_CONFIG.supabaseUrl + '/postgres',
  defaultSchema: 'leadintelligence',
};
export { DB_CONFIG };