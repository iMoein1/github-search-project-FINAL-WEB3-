const GITHUB_API_BASE = 'https://api.github.com';

/**
 * A general fetch utility that handles standard GitHub API errors.
 */
async function apiFetch(url) {
    const response = await fetch(url);

    if (response.status === 403) {
        // Handling Rate Limit
        throw new Error('RATE_LIMIT: API rate limit exceeded. Please use OAuth for higher limits.');
    }
    
    // Handle other server errors (e.g., 500) but ignore 404 here
    if (!response.ok && response.status !== 404) {
        throw new Error(`API Error ${response.status}: An unexpected GitHub server error occurred.`);
    }

    return response;
}

/**
 * Fetches a specific GitHub user profile.
 * @param {string} username - GitHub username.
 * @returns {Promise<object|null>} - User data or null if 404.
 */
export async function fetchUser(username) {
    const response = await apiFetch(`${GITHUB_API_BASE}/users/${username}`);
    
    if (response.status === 404) {
        return null; // User not found
    }

    return response.json();
}

/**
 * Searches for users for the suggestion list.
 * @param {string} query - Search term.
 * @returns {Promise<string[]>} - Array of matching usernames.
 */
export async function searchUsers(query) {
    if (query.length < 3) return [];
    
    const url = `${GITHUB_API_BASE}/search/users?q=${query}&per_page=5`;
    
    try {
        const response = await apiFetch(url);
        
        const data = await response.json();
        // Return only the login names
        return data.items.map(item => item.login); 
    } catch (error) {
        // Log rate limit for search but return empty array
        if (error.message.startsWith('RATE_LIMIT')) {
             console.error("Suggestions API Rate Limit Exceeded.");
        }
        return [];
    }
}