# Webhook Configuration

This document centralizes the webhook configuration for all n8n workflows used in the HVAC AI Lead Intelligence Platform.

---

## Webhook Endpoints

### 1. Lead Ingestion

| Property | Value |
|----------|-------|
| **URL** | `{{WEBHOOK_BASE_URL}}/webhook/lead-ingestion` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Auth** | None (webhook URL should be kept private) |
| **Source** | n8n webhook → external forms, API calls |

**Expected Payload:**
```json
{
  "customer_name": "John Doe",
  "phone": "5551234567",
  "email": "john@example.com",
  "city": "Dallas",
  "service_type": "AC Repair",
  "property_type": "Residential",
  "issue_description": "AC unit blowing warm air, compressor making noise",
  "source": "Website"
}
```

**Response:** `{ "success": true, "lead_id": "uuid" }`

**Error Response:** `{ "success": false, "error": "message" }`

---

### 2. AI Lead Analysis

| Property | Value |
|----------|-------|
| **URL** | `{{WEBHOOK_BASE_URL}}/webhook/ai-analysis-trigger` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Auth** | None (internal use) |

**Expected Payload:**
```json
{
  "lead_id": "uuid-here",
  "customer_name": "John Doe",
  "city": "Dallas",
  "service_type": "AC Repair",
  "property_type": "Residential",
  "issue_description": "AC unit blowing warm air..."
}
```

---

### 3. Send Notification

| Property | Value |
|----------|-------|
| **URL** | `{{WEBHOOK_BASE_URL}}/webhook/send-notification` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

**Expected Payload:**
```json
{
  "to": "tech@hvaccompany.com",
  "subject": "New Lead Assigned",
  "message": "A new lead has been assigned to you...",
  "type": "email",
  "lead_id": "uuid-here",
  "customer_name": "John Doe"
}
```

---

### 4. Schedule Appointment

| Property | Value |
|----------|-------|
| **URL** | `{{WEBHOOK_BASE_URL}}/webhook/schedule-appointment` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

**Expected Payload:**
```json
{
  "lead_id": "uuid-here",
  "appointment_date": "2026-07-01",
  "appointment_time": "14:30:00",
  "appointment_type": "Repair",
  "notes": "Attic access needed"
}
```

---

### 5. Webhook Dispatcher

| Property | Value |
|----------|-------|
| **URL** | `{{WEBHOOK_BASE_URL}}/webhook/webhook-dispatcher` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

**Expected Payload:**
```json
{
  "action": "lead_created",
  "data": {
    "customer_name": "John Doe",
    "phone": "5551234567",
    "city": "Dallas"
  }
}
```

**Supported Actions:**

| Action | Routed To |
|--------|-----------|
| `lead_created` | lead-ingestion |
| `ai_analysis` | ai-lead-analysis |
| `send_notification` | send-notification |
| `schedule_appointment` | schedule-appointment |
| `status_update` | webhook-dispatcher |

---

## Authentication

Webhooks use **no authentication** by default. For production:

1. Use a private webhook URL (not publicly exposed)
2. Configure IP whitelisting in n8n
3. Add a shared secret check:

```javascript
// Optional: Add to Validate node in each workflow
const expectedToken = process.env.WEBHOOK_SECRET;
const receivedToken = $input.first().json.headers['x-webhook-secret'];

if (expectedToken && receivedToken !== expectedToken) {
  throw new Error('Invalid webhook secret');
}
```

---

## Retry Behavior

| Setting | Value |
|---------|-------|
| **Max Retries** | 3 |
| **Wait Between Tries** | 5 seconds (10s for notifications) |
| **Error Output** | Connected to error handler nodes |
| **Manual Retry** | Available in n8n execution history |

---

## Timeout Strategy

| Workflow | Timeout |
|----------|---------|
| Lead Ingestion | 30 seconds |
| AI Analysis | 60 seconds (AI API may be slow) |
| Send Notification | 30 seconds |
| Schedule Appointment | 30 seconds |
| Webhook Dispatcher | 15 seconds |

---

## Webhook Health Checklist

- [ ] All webhook URLs use environment variables, not hardcoded values
- [ ] Error paths exist for every webhook node
- [ ] Retry is configured for transient failures
- [ ] Logging captures webhook start, success, and failure
- [ ] Webhook URLs are not exposed in client-side code
- [ ] Payload validation exists before database operations
- [ ] CORS is configured if webhooks come from browser sources

---

## Environment Variables Summary

| Variable | Used By | Required |
|----------|---------|----------|
| `WEBHOOK_BASE_URL` | All workflows | Yes |
| `WEBHOOK_SECRET` | All workflows (optional auth) | No |
| `SUPABASE_URL` | Ingestion, AI, Appointment | Yes |
| `SUPABASE_SERVICE_KEY` | Ingestion, AI, Appointment | Yes |
| `OPENROUTER_API_KEY` | AI Analysis | Yes |
| `SMTP_HOST` | Notifications | Yes (if email enabled) |
| `SMTP_PORT` | Notifications | Yes (if email enabled) |
| `SMTP_USER` | Notifications | Yes (if email enabled) |
| `SMTP_PASS` | Notifications | Yes (if email enabled) |
| `SMTP_FROM_EMAIL` | Notifications | Yes (if email enabled) |

---

## FAQ

**Q: Can I use the same webhook for multiple environments?**  
A: No. Each environment (dev, staging, production) should have its own n8n instance with separate webhook URLs.

**Q: How do I test a webhook locally?**  
A: Run n8n locally and use ngrok to expose your webhook: `ngrok http 5678`. Use the ngrok URL as `WEBHOOK_BASE_URL`.

**Q: What happens if a webhook fails?**  
A: Failed executions are logged and can be viewed in n8n execution history. The workflow retries up to 3 times.

**Q: Are webhooks secure?**  
A: Webhook URLs should be kept private. For additional security, implement the shared secret check shown above.
