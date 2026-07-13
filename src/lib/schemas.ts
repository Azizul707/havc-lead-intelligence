import { z } from 'zod'

// Schema for Profile updates (Feature 3)
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must not exceed 100 characters'),
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100, 'Company name must not exceed 100 characters'),
  phone: z.string().trim().min(10, 'Phone must be at least 10 characters').max(20, 'Phone must not exceed 20 characters'),
  timezone: z.string().min(1, 'Timezone is required'),
  country: z.string().trim().min(1, 'Country is required'),
})

// Schema for Scheduling Appointments (Feature 3)
export const appointmentSchema = z.object({
  date: z.string().min(1, 'Appointment date is required'),
  time: z.string().min(1, 'Appointment time is required'),
  type: z.string().min(1, 'Service type is required'),
  notes: z.string().trim().max(1000, 'Internal notes must not exceed 1000 characters').optional().or(z.literal('')),
})

// Schema for Dispatcher Internal Notes (Feature 3)
export const noteSchema = z.object({
  note: z.string().trim().min(2, 'Note must contain at least 2 characters').max(2000, 'Note must not exceed 2000 characters'),
})

// Schema for Dispatcher Reminders (Feature 3)
export const reminderSchema = z.object({
  date: z.string().min(1, 'Follow-up date is required'),
  time: z.string().min(1, 'Callback time is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Invalid priority selection',
  }),
  message: z.string().trim().min(2, 'Follow-up instruction must be at least 2 characters').max(500, 'Instruction must not exceed 500 characters'),
})

// Schema for updating existing appointment (date/time/type/notes)
export const appointmentUpdateSchema = z.object({
  date: z.string().min(1, 'Appointment date is required'),
  time: z.string().min(1, 'Appointment time is required'),
  type: z.string().min(1, 'Service type is required'),
  notes: z.string().trim().max(1000, 'Internal notes must not exceed 1000 characters').optional().or(z.literal('')),
})

// Schema for editing existing note content
export const noteUpdateSchema = z.object({
  note: z.string().trim().min(2, 'Note must contain at least 2 characters').max(2000, 'Note must not exceed 2000 characters'),
})

// TypeScript types inferred directly from Zod schemas (Feature 11)
export type ProfileInput = z.infer<typeof profileSchema>
export type AppointmentInput = z.infer<typeof appointmentSchema>
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>
export type NoteInput = z.infer<typeof noteSchema>
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>
export type ReminderInput = z.infer<typeof reminderSchema>