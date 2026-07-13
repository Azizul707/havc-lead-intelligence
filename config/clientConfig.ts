import { z } from 'zod';

// Supported locales
export const SupportedLocales = z.enum(['en-US', 'en-CA', 'en-AU']);
export type SupportedLocale = z.infer<typeof SupportedLocales>;

// Supported currencies
export const SupportedCurrencies = z.enum(['USD', 'CAD', 'AUD']);
export type SupportedCurrency = z.infer<typeof SupportedCurrencies>;

// Client configuration schema
export const ClientConfigSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  timeZone: z.string().min(1, 'Time zone is required'),
  currency: SupportedCurrencies,
  dateFormat: z.string().min(1, 'Date format is required'),
  locale: SupportedLocales,
  businessHours: z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  }),
  contactInformation: z.object({
    email: z.string().email('Contact email must be valid'),
    phone: z.string().min(7, 'Contact phone is required'),
    address: z.string().min(5, 'Contact address is required'),
  }),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

// Default client configuration
export const defaultClientConfig: ClientConfig = {
  companyName: 'AI Lead Scoring CRM',
  timeZone: 'America/New_York',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  locale: 'en-US',
  businessHours: {
    start: '08:00',
    end: '18:00',
  },
  contactInformation: {
    email: 'contact@aileadscoringcrm.com',
    phone: '+1-800-555-1234',
    address: '123 Main Street, City, State ZIP',
  },
};

// Validate and export configuration
const clientConfig = ClientConfigSchema.parse(
  process.env.CLIENT_CONFIG ? JSON.parse(process.env.CLIENT_CONFIG) : {}
);
export { clientConfig };