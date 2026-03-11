import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8787;
const WEBHOOK_SECRET = process.env.KIE_WEBHOOK_SECRET || '';

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

  return { valid: isValid, reason: isValid ? 'ok' : 'mismatch' };
}

app.post('/veo3/callback', (req, res) => {
  const { valid, reason } = verifySignature(req);
  if (!valid) {
    console.warn('[VEO3][WEBHOOK] invalid signature:', reason);
    return res.status(401).json({ ok: false, reason: 'invalid-signature' });
  }

  const payload = req.body ?? {};
  console.log('[VEO3][WEBHOOK] task update', JSON.stringify(payload, null, 2));

  // TODO: persist payload (DB, file, queue) so downstream jobs can fetch the assets.

  res.json({ ok: true });
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`veo3 webhook listening on port ${PORT}`);
});
