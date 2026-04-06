import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.method === 'POST' ? req.body?.url : req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate and normalize URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const urlObj = new URL(targetUrl);

    // Fetch HTML
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` });
    }

    const html = await response.text();

    // Parse HTML using regex (lightweight alternative to cheerio)
    const result = parseHTML(html);

    return res.status(200).json(result);
  } catch (error) {
    console.error('SEO Audit Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze URL' });
  }
}

function parseHTML(html) {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : null;

  // Extract meta keywords
  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
  const keywords = keywordsMatch ? keywordsMatch[1].trim() : null;

  // Extract robots
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  const robots = robotsMatch ? robotsMatch[1].trim() : null;

  // Extract Open Graph
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : null;

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : null;

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const ogImage = ogImageMatch ? ogImageMatch[1].trim() : null;

  // Count headings
  const h1Matches = html.match(/<h1[^>]*>/gi);
  const h1Count = h1Matches ? h1Matches.length : 0;

  const h2Matches = html.match(/<h2[^>]*>/gi);
  const h2Count = h2Matches ? h2Matches.length : 0;

  const h3Matches = html.match(/<h3[^>]*>/gi);
  const h3Count = h3Matches ? h3Matches.length : 0;

  // Count images
  const imgMatches = html.match(/<img[^>]*>/gi);
  const imagesTotal = imgMatches ? imgMatches.length : 0;

  let imagesWithoutAlt = 0;
  if (imgMatches) {
    imgMatches.forEach(img => {
      if (!img.match(/alt=["'][^"']*["']/i)) {
        imagesWithoutAlt++;
      }
    });
  }

  // Check for structured data
  const structuredDataMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i);
  const hasStructuredData = !!structuredDataMatch;

  return {
    title,
    description,
    keywords,
    robots,
    h1Count,
    h2Count,
    h3Count,
    imagesTotal,
    imagesWithoutAlt,
    hasStructuredData,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      image: ogImage
    }
  };
}
