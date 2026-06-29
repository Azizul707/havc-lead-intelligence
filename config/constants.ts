import { z } from 'zod';

// Enums and types
export const LeadStatus = z.enum(['NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'LOST']);
export type LeadStatus = z.infer<typeof LeadStatus>;

export const AppointmentStatus = z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export type AppointmentStatus = z.infer<typeof AppointmentStatus>;

export const ReminderType = z.enum(['EMAIL', 'SMS', 'IN_APP']);
export type ReminderType = z.infer<typeof ReminderType>;

export const NotificationType = z.enum(['LEAD_UPDATE', 'APPOINTMENT_CONFIRMATION', 'INVOICE_DUE', 'MAINTENANCE_REMINDER']);
export type NotificationType = z.infer<typeof NotificationType>;

export const Status = z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']);
export type Status = z.infer<typeof Status>;

export const AppointmentType = z.enum(['INSTALLATION', 'MAINTENANCE', 'REPAIR', 'INSPECTION']);
export type AppointmentType = z.infer<typeof AppointmentType>;

export const FeatureFlag = z.enum(['AI_SUMMARY', 'DISPATCHER', 'CRM', 'ANALYTICS', 'NOTIFICATIONS']);
export type FeatureFlag = z.infer<typeof FeatureFlag>;

// Application URL constants
export const ApplicationURLs = {
  DASHBOARD: '/dashboard',
  LEADS: '/leads',
  LEADS_DETAIL: '/leads/[id]',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  CRM: '/crm',
  LOGOUT: '/logout',
} as const;

export type ApplicationURLs = typeof ApplicationURLs;