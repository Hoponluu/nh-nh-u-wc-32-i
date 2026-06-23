const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS headers - public data
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('public_snapshots')
      .select('data, published_at')
      .eq('id', 'latest')
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    if (!data) {
      return res.status(404).json({ error: 'No data available' });
    }

    // Cache for 60 seconds
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      data: data.data,
      publishedAt: data.published_at
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
