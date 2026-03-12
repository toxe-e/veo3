import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8787;
const WEBHOOK_SECRET = process.env.KIE_WEBHOOK_SECRET || '';
const ACCEPT_UNVERIFIED = process.env.ACCEPT_UNVERIFIED === 'true';

let lastWebhook = null;

const app = express();
app.use(
  express.json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);

function verifySignature(req) {
  if (!WEBHOOK_SECRET) {
    return { valid: true, reason: 'secret-missing' };
  }

  const signature = req.get('x-kie-signature') || '';
  if (!signature) {
    return { valid: false, reason: 'missing-signature' };
  }

  const hmac = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.rawBody || Buffer.from(''))
    .digest('hex');

  const expected = `sha256=${hmac}`;
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );

  return { valid: isValid, reason: isValid ? 'ok' : 'mismatch', signature };
}

app.post('/veo3/callback', (req, res) => {
  const { valid, reason, signature } = verifySignature(req);
  if (!valid && !ACCEPT_UNVERIFIED) {
    console.warn('[VEO3][WEBHOOK] invalid signature:', reason);
    return res.status(401).json({ ok: false, reason: 'invalid-signature' });
  }

  if (!valid && ACCEPT_UNVERIFIED) {
    console.warn('[VEO3][WEBHOOK] invalid signature but ACCEPT_UNVERIFIED=true:', reason);
  }

  const payload = req.body ?? {};
  console.log('[VEO3][WEBHOOK] task update', JSON.stringify(payload, null, 2));

  lastWebhook = {
    receivedAt: new Date().toISOString(),
    verified: valid,
    reason,
    signature,
    headers: {
      'content-type': req.get('content-type') || null,
      'user-agent': req.get('user-agent') || null
    },
    payload
  };

  res.json({ ok: true, verified: valid });
});

app.get('/veo3/last-callback', (_req, res) => {
  if (!lastWebhook) {
    return res.status(204).send();
  }

  res.json(lastWebhook);
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`veo3 webhook listening on port ${PORT}`);
});
