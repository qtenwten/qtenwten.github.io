const IS_GD_API_URL = 'https://is.gd/create.php'

export async function shortenUrl(longUrl, signal) {
  const response = await fetch(`${IS_GD_API_URL}?format=json&url=${encodeURIComponent(longUrl)}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (!data.shorturl) {
    throw new Error(data.errormessage || 'Failed to shorten URL')
  }

  return {
    shortUrl: data.shorturl,
    longUrl: longUrl,
    date: new Date().toISOString(),
  }
}
