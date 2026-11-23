export default async function handler(req, res) {
  // CORS — যেকোনো origin থেকে call করা যাবে
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // শুধু GET accept করবে
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '❌ Method Not Allowed'
    });
  }

  const num = (req.query.num || '').trim();

  // নম্বর ভ্যালিডেশন
  if (!num) {
    return res.status(400).json({
      success: false,
      message: '❌ Phone number missing'
    });
  }

  if (!/^\+?[0-9]{8,15}$/.test(num)) {
    return res.status(400).json({
      success: false,
      message: '❌ Invalid phone number format'
    });
  }

  try {
    const apiResponse = await fetch(
      `https://apicall-coral.vercel.app/api?num=${encodeURIComponent(num)}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const rawText = await apiResponse.text();
    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {}

    if (apiResponse.ok) {
      const isSuccess = parsed && typeof parsed.success === 'boolean' ? parsed.success : true;
      return res.status(200).json({
        success: isSuccess,
        message: (parsed && parsed.message) || (isSuccess ? '✅ Request Send' : '❌ Request Failed'),
        number: num,
        raw: parsed || rawText.slice(0, 200)
      });
    } else {
      return res.status(200).json({
        success: false,
        message: `❌ API Error (HTTP ${apiResponse.status})`,
        number: num,
        raw: parsed || rawText.slice(0, 200)
      });
    }
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: `❌ Server Error: ${error.message}`,
      number: num
    });
  }
}

