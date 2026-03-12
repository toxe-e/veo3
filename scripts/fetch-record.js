#!/usr/bin/env node
import 'dotenv/config';

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: node scripts/fetch-record.js <taskId>');
  process.exit(1);
}

const apiKey = process.env.KIE_API_KEY;
if (!apiKey) {
  console.error('KIE_API_KEY is missing. Set it in .env or environment.');
  process.exit(1);
}

const endpoint = new URL('https://api.kie.ai/api/v1/veo/record-info');
endpoint.searchParams.set('taskId', taskId);

fetch(endpoint, {
  headers: {
    Authorization: `Bearer ${apiKey}`
  }
})
  .then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  })
  .then((json) => {
    console.log(JSON.stringify(json, null, 2));
  })
  .catch((err) => {
    console.error('Failed to fetch record info:', err.message);
    process.exit(1);
  });
