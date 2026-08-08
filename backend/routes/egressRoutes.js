const express = require('express');

const router = express.Router();

const CANDIDATES = [
  { host: 'smtp-relay.sendinblue.com', port: 587 },
  { host: 'smtp-relay.sendinblue.com', port: 465 },
  { host: 'smtp-relay.brevo.com', port: 587 },
  { host: 'smtp-relay.brevo.com', port: 465 },
];

function probe(host, port) {
  return new Promise((resolve) => {
    const net = require('net');
    const sock = net.connect({ host, port });
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