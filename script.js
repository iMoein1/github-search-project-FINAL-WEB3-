import { fetchUser, searchUsers } from './utils/api.js';
import { debounce, themeManager } from './utils/helpers.js';

// ===============================================
// 1. SearchApp Class - Manages State, Requests, and UI
// ===============================================

class SearchApp {
    constructor() {
        // DOM Element Selection
        this.dom = {
            input: document.getElementById('username-input'),
            form: document.getElementById('search-form'),
            suggestions: document.getElementById('suggestions-list'),
            message: document.getElementById('message-area'),
            profile: document.getElementById('profile-container'),
            themeToggle: document.getElementById('theme-toggle'),
        };

        // Application State
        this.isLoading = false; 

        // Debounce setup (Binding the method to the class instance)
        this.debouncedSuggest = debounce(this.handleSuggestions.bind(this), 400); 
        
        this.init();
    }
    
    init() {
        themeManager.init();
        this.addEventListeners();
    }
    
    // ... (بقیه متدهای UI و هندلینگ پیشنهادات: displayMessage, clearMessages, clearSuggestions, handleSuggestions) ...
    displayMessage(message, type = 'info') {
        this.dom.message.innerHTML = message;
        this.dom.message.className = `message-area ${type}`;
        this.dom.message.classList.remove('hidden');
    }

    clearMessages() {
        this.dom.message.classList.add('hidden');
        this.dom.message.innerHTML = '';
    }

    clearSuggestions() {
        this.dom.suggestions.innerHTML = '';
        this.dom.suggestions.classList.add('hidden');
    }

    async handleSuggestions(searchTerm) {
        this.clearSuggestions();
        if (searchTerm.length < 3) return;

        const users = await searchUsers(searchTerm);
        
        if (users.length > 0) {
            this.dom.suggestions.classList.remove('hidden');
            users.forEach(username => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = username;
                
                item.addEventListener('click', () => {
                    this.dom.input.value = username;
                    this.handleMainSearch(username); 
                    this.clearSuggestions();
                });
                
                this.dom.suggestions.appendChild(item);
            });
        }
    }

    // ===============================================
    // 4. Main Search Logic
    // ===============================================
    
    async handleMainSearch(username = this.dom.input.value.trim()) {
        if (!username || this.isLoading) return;
        
        this.clearMessages();
        this.clearSuggestions();
        this.dom.profile.classList.add('hidden');
        
        this.isLoading = true;
        this.displayMessage('Searching...', 'info');
        
        try {
            const userData = await fetchUser(username);
            
            if (userData === null) {
                // User not found
                this.displayMessage(`Error: User "${username}" not found!`, 'error');
                return;
            }
            
            // User found
            this.displayMessage(`Success: User "${username}" found!`, 'success');
            
            // Save data for the next page/component
            localStorage.setItem('github_user_profile', JSON.stringify(userData));
            
            // Render profile content (simulating navigation)
            this.renderProfileContent(userData); 

        } catch (error) {
            this.displayMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.isLoading = false;
        }
    }
    
    // Temporary render function to show success
    renderProfileContent(userData) {
        document.getElementById('profile-card').innerHTML = `
            <h2>Profile: ${userData.login}</h2>
            <img src="${userData.avatar_url}" alt="${userData.login}" style="width: 100px; border-radius: 50%;">
            <p><strong>Full Name:</strong> ${userData.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
            <p class="info-message">This section will be detailed by your teammate (Repos, Bio, etc.).</p>
        `;
        this.dom.profile.classList.remove('hidden');
    }

    // ===============================================
    // 5. Event Listeners Setup
    // ===============================================

    addEventListeners() {
        this.dom.themeToggle.addEventListener('click', themeManager.toggle);
        
        // Use debounced handler for suggestions on input
        this.dom.input.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            this.debouncedSuggest(searchTerm);
        });
        
        // Main search on form submission
        this.dom.form.addEventListener('submit', (event) => {
            event.preventDefault(); 
            this.handleMainSearch();
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.dom.suggestions.contains(e.target) && e.target !== this.dom.input) {
                this.clearSuggestions();
            }
        });
    }
}

// Initialize the application after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchApp();
});