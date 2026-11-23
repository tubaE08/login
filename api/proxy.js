export default async function handler(req, res) {
  const { email, amount } = req.query;

  if (!email || !amount) {
    return res.status(400).json({ error: "Email and amount are required" });
  }

  const targetUrl = `https://darktoolshub.site/bot/email.php?email=${encodeURIComponent(
    email
  )}&amount=${encodeURIComponent(amount)}`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy request failed", details: error.message });
  }
}
