import { z } from 'zod';

// Branding configuration schema
export const BrandingConfigSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyLogo: z.string().url('Company logo must be a valid URL'),
  companyEmail: z.string().email('Company email must be valid'),
  companyPhone: z.string().min(7, 'Company phone is required'),
  companyAddress: z.string().min(5, 'Company address is required'),
  website: z.string().url('Company website must be a valid URL'),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Primary color must be a valid hex color'),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Secondary color must be a valid hex color'),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Accent color must be a valid hex color'),
  favicon: z.string().url('Favicon must be a valid URL'),
  applicationName: z.string().min(1, 'Application name is required'),
});

// Type for the configuration
export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;

// Default branding configuration (can be overridden)
export const defaultBrandingConfig: BrandingConfig = {
  companyName: 'AI Lead Scoring CRM',
  companyLogo: 'https://example.com/logo.png',
  companyEmail: 'info@aileadscoringcrm.com',
  companyPhone: '+1-800-555-1234',
  companyAddress: '123 Main Street, City, State ZIP',
  website: 'https://aileadscoringcrm.com',
  primaryColor: '#2563eb',
  secondaryColor: '#10b981',
  accentColor: '#f59e0b',
  favicon: 'https://example.com/favicon.png',
  applicationName: 'AI Lead Scoring CRM',
};

// Validate and export configuration
const config = BrandingConfigSchema.parse(process.env.BRANDING_CONFIG || JSON.parse('{}'));
export const brandingConfig = config;