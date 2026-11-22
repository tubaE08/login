import { getUsers, saveUsers } from '../lib/db.js';
import { hash, current } from '../lib/auth.js';

export default async function handler(req, res) {
  const me = await current(req);
  if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const users = await getUsers();

  if (req.method === 'GET')
    return res.json(users.map(({ username, role, created }) => ({ username, role, created })));

  if (req.method === 'POST') {
    const { username = '', password = '', role = 'user' } = req.body || {};
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username) || password.length < 6) return res.status(400).json({ error: 'Invalid username/password' });
    if (users.some((x) => x.username === username)) return res.status(409).json({ error: 'Username ager theke ache' });
    users.push({ username, pass: hash(password), role: role === 'admin' ? 'admin' : 'user', created: Date.now() });
    await saveUsers(users);
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { username } = req.query;
    if (username === me.username) return res.status(400).json({ error: 'Nijeke delete kora jabe na' });
    await saveUsers(users.filter((x) => x.username !== username));
    return res.json({ ok: true });
  }
  res.status(405).end();
}
