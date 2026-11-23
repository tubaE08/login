const COOLDOWN = 60; // seconds
const ipHits = new Map();
const numHits = new Map();

const API_KEY = 'hexa_a635fb502df75accb2ea7edd26797776dd2c3ce04f1791ab_1_20';

function wait(map, key) {
  const left = COOLDOWN - Math.floor((Date.now() - (map.get(key) || 0)) / 1000);
  return left > 0 ? left : 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  const { name, number, business_name } = req.body || {};
  if (!name || !number || !business_name) {
    return res.status(400).json({ ok: false, error: 'সব ঘর পূরণ করুন' });
  }
  if (!/^01\d{9}$/.test(number)) {
    return res.status(400).json({ ok: false, error: 'নম্বর ঠিক নয় (01XXXXXXXXX)' });
  }
  if (name.trim().length > 40) {
    return res.status(400).json({ ok: false, error: 'Name too long' });
  }
  if (business_name.trim().length < 3 || business_name.trim().length > 50) {
    return res.status(400).json({ ok: false, error: 'Message 3 theke 50 akkhor hote hobe' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const w = Math.max(wait(ipHits, ip), wait(numHits, number));
  if (w > 0) {
    return res.status(429).json({ ok: false, wait: w, error: `আবার পাঠাতে ${w} সেকেন্ড অপেক্ষা করুন` });
  }

  const fail = (status, error, raw) => {
    ipHits.delete(ip);
    numHits.delete(number);
    return res.status(status).json({ ok: false, error, raw });
  };

  const cleanName = name.trim();
  const cleanNumber = number.trim();
  const cleanMsg = `${business_name.trim()} (From: ${cleanName})`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);

    const url = new URL('https://hexaapi.com/api/v1/proxy/smshaf');
    url.searchParams.set('api_key', API_KEY);
    url.searchParams.set('num', cleanNumber);
    url.searchParams.set('msg', cleanMsg);

    const r = await fetch(url.toString(), {
      method: 'GET',
      signal: ctrl.signal,
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });
    clearTimeout(timer);

    const text = await r.text();
    let j = null;
    try {
      j = JSON.parse(text);
    } catch (_) {}

    if (!r.ok) {
      return fail(r.status, (j && (j.error || j.message)) || ('API error (HTTP ' + r.status + ')'), j || text.slice(0, 300));
    }

    if (j && (j.ok === false || j.success === false)) {
      return fail(200, j.error || j.message || 'API failed', j);
    }

    ipHits.set(ip, Date.now());
    numHits.set(cleanNumber, Date.now());

    return res.status(200).json({
      ok: true,
      message: (j && j.message) || text || 'Message sent',
      raw: j || text
    });
  } catch (e) {
    return fail(
      500,
      e.name === 'AbortError'
        ? 'API timeout'
        : 'Connect failed: ' + (e.cause?.code || e.message)
    );
  }
}


