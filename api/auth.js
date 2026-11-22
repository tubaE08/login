import { getUsers, saveUsers } from '../lib/db.js';
import { hash, verify, sessionCookie, current } from '../lib/auth.js';

export default async function handler(req, res) {
  const a = req.query.action;
  if (a === 'me') {
    const u = await current(req);
    return u ? res.json(u) : res.status(401).json({ error: 'Login korun' });
  }
  if (a === 'logout') {
    res.setHeader('Set-Cookie', 's=; Path=/; Max-Age=0');
    return res.json({ ok: true });
  }
  const { username = '', password = '' } = req.body || {};
  let users = await getUsers();

  // ADMIN_USER na thakle auto toiri hobe
  const AU = process.env.ADMIN_USER;
  const AP = process.env.ADMIN_PASS;
  if (AU && AP && !users.some((x) => x.username === AU)) {
    users.push({ username: AU, pass: hash(AP), role: 'admin', created: Date.now() });
    await saveUsers(users);
  }

  if (a === 'signup') {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Username 3-20 ta letter/number/_ hobe' });
    if (password.length < 6) return res.status(400).json({ error: 'Password komopokkho 6 character' });
    if (users.some((x) => x.username === username)) return res.status(409).json({ error: 'Username ager theke ache' });
    users.push({ username, pass: hash(password), role: 'user', created: Date.now() });
    await saveUsers(users);
    res.setHeader('Set-Cookie', sessionCookie(username));
    return res.json({ ok: true });
  }
  if (a === 'login') {
    const u = users.find((x) => x.username === username);
    if (!u || !verify(password, u.pass)) return res.status(401).json({ error: 'Username ba password bhul' });
    res.setHeader('Set-Cookie', sessionCookie(username));
    return res.json({ ok: true });
  }
  res.status(404).json({ error: 'unknown action' });
}
