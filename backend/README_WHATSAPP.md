WhatsApp Reminders — Setup Guide

Overview

This project includes a simple WhatsApp reminders scheduler that can send messages using either Meta WhatsApp Cloud API or Twilio.

Environment variables

To enable and configure the scheduler, add to your backend `.env`:

- ENABLE_WHATSAPP_SCHEDULER=true
- WHATSAPP_PROVIDER=meta OR twilio

If using Meta WhatsApp Cloud API:
- WHATSAPP_META_TOKEN=your_facebook_graph_api_token
- WHATSAPP_META_PHONE_NUMBER_ID=your_phone_number_id

If using Twilio:
- TWILIO_ACCOUNT_SID=your_twilio_account_sid
- TWILIO_AUTH_TOKEN=your_twilio_auth_token
- TWILIO_PHONE_NUMBER=your_twilio_whatsapp_number (in E.164, without 'whatsapp:')

Optional:
- WHATSAPP_CRON (cron schedule, default: "0 8 * * *" -> 08:00 UTC daily)
- WHATSAPP_TIMEZONE (timezone for cron schedule, default: UTC)
- WHATSAPP_DRY_RUN=true (will log messages without sending)

How it works

- The scheduler runs a cron job and executes three tasks:
  1. Send 'due tomorrow' reminder to payments due tomorrow.
  2. Send 'due today' reminder to payments due today.
  3. Send 'overdue' alert for payments overdue by 3+ days.

- The scheduler uses `Payment` documents and populates `customerId` to obtain customer phone numbers.

Running

Start your server normally (`npm run dev` or `npm start`). When `ENABLE_WHATSAPP_SCHEDULER=true`, the scheduler will start automatically.

Testing

Use `WHATSAPP_DRY_RUN=true` to test message generation without sending.

Security

- Keep tokens secret; do not commit to source control.
- Consider rate limits and message templates when using Meta WhatsApp Cloud API.

