/**
 * Implements Debounce using Closure for optimized function execution.
 * @param {Function} func - The function to be debounced.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function with cancel/flush methods.
 */
export const debounce = (func, delay = 400) => {
    let timeoutId;
    function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    }
    debounced.cancel = () => clearTimeout(timeoutId);
    debounced.flush = function(...args) {
        clearTimeout(timeoutId);
        func.apply(this, args);
    };
    return debounced;
};

/**
 * Manages the Dark/Light theme toggle persistence.
 */
export const themeManager = (() => {
    const THEME_STORAGE_KEY = 'github_search_theme';
    
    const applyTheme = (theme) => {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    };

    return {
        init: () => {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light-theme';
            applyTheme(savedTheme);
        },
        toggle: () => {
            const isLight = document.body.classList.contains('light-theme');
            const newTheme = isLight ? 'dark-theme' : 'light-theme';
            applyTheme(newTheme);
        },
        getCurrentTheme: () => localStorage.getItem(THEME_STORAGE_KEY) || 'light-theme'
    };
})();
