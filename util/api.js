const GITHUB_API_BASE = 'https://api.github.com';
const AUTH_TOKEN = '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'; 

async function apiFetch(url) {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  const response = await fetch(url, { headers });

  if (response.status === 401) {
    throw new Error('AUTH_ERROR: Invalid or expired token.');
  }

  if (response.status === 403) {
    const reset = response.headers.get('X-RateLimit-Reset');
    throw new Error(`RATE_LIMIT: API rate limit exceeded. Try again after ${new Date(reset * 1000).toLocaleTimeString()}`);
  }

  if (!response.ok && response.status !== 404) {
    throw new Error(`API Error ${response.status}: Unexpected GitHub server error.`);
  }

  return response;
}

export async function fetchUser(username) {
  const response = await apiFetch(`${GITHUB_API_BASE}/users/${username}`);
  if (response.status === 404) return null;
  return response.json();
}

export async function searchUsers(query) {
  if (query.length < 3) return [];

  const url = `${GITHUB_API_BASE}/search/users?q=${encodeURIComponent(query)}&per_page=5`;

  try {
    const response = await apiFetch(url);
    const data = await response.json();
    return data.items.map(item => ({
      login: item.login,
      avatar_url: item.avatar_url
    }));
  } catch (error) {
    if (error.message.startsWith('RATE_LIMIT')) {
      console.error("Suggestions API Rate Limit Exceeded.");
    }
    return [];
  }
}
