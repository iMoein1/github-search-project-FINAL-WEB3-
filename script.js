// Configuration
const defaultConfig = {
 main_title: "Discover GitHub",
 title_highlight: "Developers",
 subtitle: "Search and explore GitHub profiles with ease. Find developers, view their repositories, and discover amazing projects.",
 search_placeholder: "Enter GitHub username...",
 repos_title: "Repositories",
 repos_subtitle: "Explore public repositories and contributions",
 background_color: "#0a0e27",
 surface_color: "#1e293b",
 text_color: "#e5e7eb",
 primary_action_color: "#14b8a6",
 secondary_action_color: "#06b6d4",
 font_family: "Inter",
 font_size: 16
    };

let config = {};
let currentUser = null;
let allRepos = [];
let currentPage = 1;
const reposPerPage = 6;
let searchTimeout = null;

// Language colors
 const languageColors = {
   JavaScript: "#f1e05a",
   TypeScript: "#2b7489",
   Python: "#3572A5",
   Java: "#b07219",
   Go: "#00ADD8",
   Ruby: "#701516",
   PHP: "#4F5D95",
   Swift: "#ffac45",
   Kotlin: "#F18E33",
   Rust: "#dea584",
   C: "#555555",
   "C++": "#f34b7d",
   "C#": "#178600",
   HTML: "#e34c26",
   CSS: "#563d7c",
   Shell: "#89e051",
   Dart: "#00B4AB",
   Vue: "#41b883",
  React: "#61dafb"
        };

// Config change handler
  async function onConfigChange(newConfig) {
  const customFont = newConfig.font_family || defaultConfig.font_family;
  const baseFontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const baseSize = newConfig.font_size || defaultConfig.font_size;

  document.body.style.fontFamily = `${customFont}, ${baseFontStack}`;
  document.body.style.fontSize = `${baseSize}px`;

 const heroTitle = document.querySelector('.hero-title');
   if (heroTitle) {
       heroTitle.style.fontSize = `${baseSize * 4}px`;
       heroTitle.style.fontFamily = `${customFont}, ${baseFontStack}`;
   }

 const heroSubtitle = document.querySelector('.hero-subtitle');
   if (heroSubtitle) {
       heroSubtitle.style.fontSize = `${baseSize * 1.25}px`;
       }

 const backgroundColor = newConfig.background_color || defaultConfig.background_color;
 const primaryColor = newConfig.primary_action_color || defaultConfig.primary_action_color;

 document.getElementById('mainTitle').textContent = newConfig.main_title || defaultConfig.main_title;
 document.getElementById('titleHighlight').textContent = newConfig.title_highlight || defaultConfig.title_highlight;
 document.getElementById('subtitle').textContent = newConfig.subtitle || defaultConfig.subtitle;
 document.getElementById('searchInput').placeholder = newConfig.search_placeholder || defaultConfig.search_placeholder;
 document.getElementById('reposTitle').textContent = newConfig.repos_title || defaultConfig.repos_title;
 document.getElementById('reposSubtitle').textContent = newConfig.repos_subtitle || defaultConfig.repos_subtitle;
   }

 // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const suggestionsDiv = document.getElementById('suggestions');
  const errorContainer = document.getElementById('errorContainer');
  const searchLoading = document.getElementById('searchLoading');
  const searchPage = document.getElementById('searchPage');
  const profilePage = document.getElementById('profilePage');
  const backButton = document.getElementById('backButton');
  const navLinks = document.querySelectorAll('.nav-link');

// Search with debounce
searchInput.addEventListener('input', function() {
 clearTimeout(searchTimeout);
 const query = this.value.trim();

if (query.length < 2) {
  suggestionsDiv.classList.add('hidden');
  errorContainer.classList.add('hidden');
 return;
 }

searchTimeout = setTimeout(() => {
    fetchSuggestions(query);
    }, 400);
  });

// Enter key search
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const username = this.value.trim();
    if (username) {
    suggestionsDiv.classList.add('hidden');
       fetchUserProfile(username);
          }
       }
   });

// Fetch suggestions
async function fetchSuggestions(query) {
    try {
      const response = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=5`);
                
    if (!response.ok) {
    if (response.status === 403) {
       showError('API rate limit exceeded. Please try again later.');
        return;
     }
    throw new Error('Failed to fetch suggestions');
       }

 const data = await response.json();
if (data.items && data.items.length > 0) {
    displaySuggestions(data.items);
     } else {
         suggestionsDiv.classList.add('hidden');
         }
 } catch (error) {
     console.error('Error fetching suggestions:', error);
       }
   }

// Display suggestions
  function displaySuggestions(users) {
     suggestionsDiv.innerHTML = users.map(user => `
        <div class="suggestion-item" onclick="selectSuggestion('${user.login}')">
          <img src="${user.avatar_url}" alt="${user.login}" class="suggestion-avatar">
         <div class="suggestion-info">
               <h4>${user.login}</h4>
                <p>GitHub User</p>
            </div>
           </div>
`).join('');
   suggestionsDiv.classList.remove('hidden');
   errorContainer.classList.add('hidden');
    }

 // Select suggestion
function selectSuggestion(username) {
 searchInput.value = username;
  suggestionsDiv.classList.add('hidden');
  fetchUserProfile(username);
 }

 // Fetch user profile
async function fetchUserProfile(username) {
   searchLoading.classList.remove('hidden');
   errorContainer.classList.add('hidden');

 try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
                
if (response.status === 404) {
    showError('User not found. Please check the username and try again.');
       searchLoading.classList.add('hidden');
    return;
      }

 if (response.status === 403) {
     showError('API rate limit exceeded. Please wait a moment and try again.');
     searchLoading.classList.add('hidden');
   ;}

if (!response.ok) {
    throw new Error('Failed to fetch user profile');
      }

const userData = await response.json();
    currentUser = userData;
                
     await fetchUserRepos(username);
        displayUserProfile(userData);
                
         searchPage.classList.add('hidden');
         profilePage.classList.remove('hidden');
         searchLoading.classList.add('hidden');
                
            updateNavActive('profile');
      } catch (error) {
          showError('An error occurred while fetching the profile. Please try again.');
          searchLoading.classList.add('hidden');
        }
  }

 // Show error
 function showError(message) {
  errorContainer.innerHTML = `
     <div class="error-message fade-in">
        <svg class="error-icon" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
        </svg>
        <div>${message}</div>
        </div>
        `;
 errorContainer.classList.remove('hidden');
     }

// Display user profile
function displayUserProfile(user) {
   document.getElementById('profileAvatar').src = user.avatar_url;
   document.getElementById('profileAvatar').alt = user.name || user.login;
   document.getElementById('profileName').textContent = user.name || user.login;
   document.getElementById('profileUsername').textContent = `@${user.login}`;
   document.getElementById('profileBio').textContent = user.bio || 'No bio available.';
   
 // Meta information
  const metaItems = [];
            
 if (user.location) {
   metaItems.push(`
    <div class="meta-item">
        <svg class="meta-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
        </svg>
    ${user.location}
     </div>
   `);
   }
            
if (user.company) {
   metaItems.push(`
      <div class="meta-item">
         <svg class="meta-icon" fill="currentColor" viewBox="0 0 20 20">
         <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"/>
          </svg>
           ${user.company}
             </div>
            `);
   }
            
 if (user.blog) {
   metaItems.push(`
       <div class="meta-item">
       <svg class="meta-icon" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
      </svg>
   <a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" target="_blank" rel="noopener noreferrer" style="color: #14b8a6;">${user.blog}</a>
   </div>
   `);
 }
            
 if (user.twitter_username) {
     metaItems.push(`
     <div class="meta-item">
      <svg class="meta-icon" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
       @${user.twitter_username}
     </div>
      `);
          }
            
document.getElementById('profileMeta').innerHTML = metaItems.join('');
document.getElementById('githubLink').href = user.html_url;
            
// Stats
document.getElementById('reposCount').textContent = user.public_repos;
document.getElementById('followersCount').textContent = user.followers;
document.getElementById('followingCount').textContent = user.following;
  }

// Fetch user repos
 async function fetchUserRepos(username) {
    const reposLoading = document.getElementById('reposLoading');
    reposLoading.classList.remove('hidden');

 try {

  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`);
                
 if (!response.ok) {
      throw new Error('Failed to fetch repositories');
     }

  const repos = await response.json();
    allRepos = repos;
    currentPage = 1;
    displayRepos();
    reposLoading.classList.add('hidden');
 } catch (error) {
      console.error('Error fetching repos:', error);
      reposLoading.classList.add('hidden');
  }
}

// Display repos
function displayRepos() {
  const reposGrid = document.getElementById('reposGrid');
  const startIndex = (currentPage - 1) * reposPerPage;
  const endIndex = startIndex + reposPerPage;
  const reposToShow = allRepos.slice(startIndex, endIndex);

reposGrid.innerHTML = reposToShow.map(repo => {
 const languageColor = languageColors[repo.language] || '#6b7280';  
 const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

return `
   <div class="repo-card glass-light">
   <div class="repo-header">
     <div>
        <h4 class="repo-name">
        ${repo.name}
    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
        <svg class="repo-link-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
        </a>
        </h4>
        </div>
            </div>
<p class="repo-description">${repo.description || 'No description available.'}</p>
  <div class="repo-footer">
      ${repo.language ? `
  <div class="language-badge">
     <span class="language-dot" style="background: ${languageColor};"></span>
      ${repo.language}
      </div>
    ` : ''}
   <div class="repo-stat">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
    </svg>
    ${repo.stargazers_count}
      </div>
    <div class="repo-stat">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
      </svg>
       ${repo.forks_count}
       </div>
    <div class="repo-stat">
         <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm7-3.25v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5a.75.75 0 011.5 0z"/>
           </svg>
         ${updatedDate}
        </div>
      </div>
    </div>
   `;
}).join('');

 // Pagination
 const totalPages = Math.ceil(allRepos.length / reposPerPage);
 const pagination = document.getElementById('pagination');
 const prevButton = document.getElementById('prevButton');
 const nextButton = document.getElementById('nextButton');
 const pageInfo = document.getElementById('pageInfo');

if (totalPages > 1) {
    pagination.classList.remove('hidden');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
} else {
    pagination.classList.add('hidden');
    }
 }

// Pagination buttons
 document.getElementById('prevButton').addEventListener('click', () => {
   if (currentPage > 1) {
      currentPage--;
      displayRepos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
         }
  });

 document.getElementById('nextButton').addEventListener('click', () => {
  const totalPages = Math.ceil(allRepos.length / reposPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayRepos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
     }
       });

// Back button
 backButton.addEventListener('click', () => {
    profilePage.classList.add('hidden');
    searchPage.classList.remove('hidden');
    searchInput.value = '';
    suggestionsDiv.classList.add('hidden');
    errorContainer.classList.add('hidden');
    updateNavActive('search');
     });

// Navigation
  function updateNavActive(page) {
  navLinks.forEach(link => {
    if (link.dataset.page === page) {
       link.classList.add('active');
    } else {
        link.classList.remove('active');
         }
    });
        }

navLinks.forEach(link => {
   link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
                
    if (page === 'search') {
      profilePage.classList.add('hidden');
      searchPage.classList.remove('hidden');
    } else if (page === 'profile' && currentUser) {
        searchPage.classList.add('hidden');
        profilePage.classList.remove('hidden');
    } else if (page === 'repositories' && currentUser) {
        searchPage.classList.add('hidden');
         profilePage.classList.remove('hidden');
     document.querySelector('.repos-section').scrollIntoView({ behavior: 'smooth' });
         }
 updateNavActive(page);
      });
   });

// Initialize Element SDK
 if (window.elementSdk) {
     window.elementSdk.init({
      defaultConfig,
      onConfigChange,
       mapToCapabilities: (config) => ({
         recolorables: [
            {
              get: () => config.background_color || defaultConfig.background_color,
              set: (value) => {
              config.background_color = value;
               window.elementSdk.setConfig({ background_color: value });
               }
                },
         {
             get: () => config.surface_color || defaultConfig.surface_color,
             set: (value) => {
             config.surface_color = value;
             window.elementSdk.setConfig({ surface_color: value });
                }
                    },
           {
                get: () => config.text_color || defaultConfig.text_color,
                set: (value) => {
                config.text_color = value;
                window.elementSdk.setConfig({ text_color: value });
                  }
 },
{
  get: () => config.primary_action_color || defaultConfig.primary_action_color,
  set: (value) => {
  config.primary_action_color = value;
  window.elementSdk.setConfig({ primary_action_color: value });
     }
   },
  {
   get: () => config.secondary_action_color || defaultConfig.secondary_action_color,
   set: (value) => {
   config.secondary_action_color = value;
   window.elementSdk.setConfig({ secondary_action_color: value });
     }
   }
  ],
   borderables: [],
  fontEditable: {
    get: () => config.font_family || defaultConfig.font_family,
    set: (value) => {
    config.font_family = value;
    window.elementSdk.setConfig({ font_family: value });
    }
    },
  fontSizeable: {
    get: () => config.font_size || defaultConfig.font_size,
    set: (value) => {
    config.font_size = value;
    window.elementSdk.setConfig({ font_size: value });
       }
   }
 }),
mapToEditPanelValues: (config) => new Map([
 ["main_title", config.main_title || defaultConfig.main_title],
 ["title_highlight", config.title_highlight || defaultConfig.title_highlight],
 ["subtitle", config.subtitle || defaultConfig.subtitle],
 ["search_placeholder", config.search_placeholder || defaultConfig.search_placeholder],
 ["repos_title", config.repos_title || defaultConfig.repos_title],
 ["repos_subtitle", config.repos_subtitle || defaultConfig.repos_subtitle]
   ])
      });

            config = window.elementSdk.config;
            onConfigChange(config);
        } else {
            config = defaultConfig;
            onConfigChange(config);}