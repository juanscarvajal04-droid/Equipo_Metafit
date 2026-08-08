const express = require('express');

const router = express.Router();

const CANDIDATES = [
  { host: 'smtp-relay.sendinblue.com', port: 587 },
  { host: 'smtp-relay.brevo.com', port: 587 },
  { host: 'smtp.gmail.com', port: 587 },
  { host: 'smtp.office365.com', port: 587 },
  { host: 'in-v3.mailjet.com', port: 587 },
  { host: 'smtp.mailgun.org', port: 587 },
  { host: 'smtp.zoho.com', port: 465 },
  { host: 'api.brevo.com', port: 443 },
  { host: 'google.com', port: 443 },
];

function probe(host, port) {
  return new Promise((resolve) => {
    const net = require('net');
    const sock = net.connect({ host, port, family: 4 });
    const t0 = Date.now();
    const done = (ok, extra) => {
      clearTimeout(guard);
      sock.destroy();
      resolve({ host, port, ok, ms: Date.now() - t0, extra });
    };
    const guard = setTimeout(() => done(false, 'timeout'), 10000);
    sock.setTimeout(10000, () => done(false, 'timeout'));
    sock.on('connect', () => done(true, 'tcp ok'));
    sock.on('error', (e) => done(false, e.message));
  });
}

router.get('/egress', async (req, res) => {
  const out = [];
  for (const c of CANDIDATES) out.push(await probe(c.host, c.port));
  res.json(out);
});

module.exports = router;