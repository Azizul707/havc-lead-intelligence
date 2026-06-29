# AGENTS.md

## Project

HVAC AI Lead Intelligence Platform

Production-grade SaaS platform built for HVAC companies in the United States, Canada, and Australia.

The application receives HVAC leads from n8n, stores them in Supabase, displays them in a professional dashboard, and provides AI-powered lead intelligence.

This is NOT a demo project.

Every feature must be production ready.

---

# Tech Stack

Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- TanStack Table
- Recharts
- React Hook Form
- Zod

Backend

- Supabase
- PostgreSQL
- Row Level Security
- Supabase Auth

Automation

- n8n

AI

- OpenRouter API

Deployment

- Vercel

---

# UI Theme

Modern SaaS

Inspired by

- Linear
- Stripe Dashboard
- Vercel Dashboard

Requirements

Minimal

Professional

Lots of whitespace

Rounded cards

Excellent typography

Responsive

Desktop first

Tablet

Mobile

No flashy gradients.

No glassmorphism.

No neumorphism.

Accessibility score must be AA.

---

# Color Palette

Primary

Blue

Success

Green

Warning

Orange

Danger

Red

Background

White

Sidebar

Light Gray

Dark mode supported.

---

# Authentication

Supabase Auth

Email login

Forgot password

Remember session

Protected routes

Unauthorized users must never access dashboard pages.

---

# Pages

/login

/dashboard

/leads

/leads/[id]

/analytics

/settings

/profile

404

---

# Sidebar

Dashboard

Leads

Analytics

Settings

Profile

Logout

---

# Dashboard

Show

Total Leads

Today's Leads

Critical Leads

High Priority Leads

Average Lead Score

Average Response Time (placeholder)

Charts

Leads by Day

Priority Distribution

Service Type Distribution

Job Value Distribution

Recent Leads Table

---

# Leads Page

Server-side pagination

Search

Filter

Sort

Export CSV

Columns

Customer

Phone

Email

City

Service Type

Property Type

Priority

Lead Score

Status

Created At

Clicking a row opens lead details.

---

# Lead Details

Show

Customer Information

Issue Description

AI Summary

Recommended Action

Lead Score

Priority

Status

Timeline

Future Notes section

---

# Analytics

Cards

Total Leads

Conversion Rate (placeholder)

Average Lead Score

Emergency %

Charts

Daily Leads

Weekly Leads

Monthly Leads

Cities

Service Types

Priority

Lead Quality

---

# Database

Use Supabase only.

Never mock data unless explicitly requested.

Always use typed queries.

No raw SQL inside components.

Use server actions.

---

# API

Never call OpenRouter from frontend.

Never expose API keys.

All AI calls happen through n8n.

Frontend reads only Supabase.

---

# Status Enum

NEW

CONTACTED

SCHEDULED

COMPLETED

LOST

---

# Priority Enum

LOW

MEDIUM

HIGH

CRITICAL

---

# Lead Score

Integer

0-100

---

# Performance

Use Server Components whenever possible.

Client Components only where required.

Lazy load charts.

Lazy load tables.

Optimize bundle size.

Image optimization enabled.

---

# Security

Validate all inputs.

Use Zod.

Escape unsafe HTML.

Use RLS.

Never trust client input.

---

# Code Quality

Strict TypeScript

No any

Reusable components

No duplicated code

Feature-based architecture

Use hooks

Use utilities

Clean folder structure

ESLint

Prettier

---

# Components

Cards

Tables

Charts

Badges

Status Chips

Priority Chips

Dialogs

Drawers

Dropdowns

Pagination

Breadcrumbs

Search

Filters

Loading Skeletons

Empty States

Error States

---

# UX

Every page must include

Loading state

Error state

Empty state

Success feedback

---

# Responsive

Desktop

Laptop

Tablet

Mobile

---

# Future Ready

Architecture must support

CRM

Appointment Scheduling

Technician Dispatch

SMS

Email

WhatsApp

Voice AI

Invoices

Payments

Customer Portal

without major refactoring.

---

# Important

Do NOT generate placeholder dashboards.

Build production-quality code.

Do NOT use fake APIs.

Do NOT hardcode data.

Everything must be reusable.

Think like a senior SaaS engineer.

Every decision must prioritize maintainability and scalability.
