exports.handler = async function(event) {
  // �� CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Password',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // �� Password check (from environment variable)
  const correctPassword = process.env.SITE_PASSWORD;
  const submittedPassword = event.headers['x-password'] || '';

  if (submittedPassword !== correctPassword) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  // �� Fetch Google Sheets CSV (URL hidden in env var)
  const sheetUrl = process.env.SHEET_CSV_URL;
  if (!sheetUrl) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Sheet URL not configured' }),
    };
  }

  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);
    const csv = await response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ csv }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
