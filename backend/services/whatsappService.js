const axios = require('axios');
require('dotenv').config();

const provider = (process.env.WHATSAPP_PROVIDER || 'none').toLowerCase();

const sendViaMeta = async (to, message) => {
  const token = process.env.WHATSAPP_META_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new Error('Meta WhatsApp credentials not configured');

  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message }
  };

  const res = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

const sendViaTwilio = async (to, message) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) throw new Error('Twilio credentials not configured');

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.append('From', `whatsapp:${from}`);
  params.append('To', `whatsapp:${to}`);
  params.append('Body', message);

  const res = await axios.post(url, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: accountSid,
      password: authToken
    }
  });

  return res.data;
};

const sendMessage = async (to, message) => {
  if (!to) throw new Error('No phone number provided');
  if (provider === 'meta') return sendViaMeta(to, message);
  if (provider === 'twilio') return sendViaTwilio(to, message);
  throw new Error('WhatsApp provider not configured (set WHATSAPP_PROVIDER)');
};

module.exports = {
  sendMessage,
  provider
};
