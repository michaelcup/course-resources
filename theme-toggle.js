/**
 * Theme Toggle for Thinkific Lessons
 * Provides dark/light mode functionality with sun/moon toggle
 * Version 2.0
 */

class ThemeToggle {
    constructor() {
        this.init();
    }
    
    init() {
        // Initialize theme on page load
        this.initTheme();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Handle system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
        
        // Handle checkbox change
        const checkbox = document.getElementById('themeToggleCheckbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                this.applyTheme(newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Use saved theme, or fall back to system preference, or default to light
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        this.applyTheme(theme);
        this.updateToggleState(theme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.applyTheme(newTheme);
        this.updateToggleState(newTheme);
        
        // Save preference
        localStorage.setItem('theme', newTheme);
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Dispatch custom event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
    }
    
    updateToggleState(theme) {
        const checkbox = document.getElementById('themeToggleCheckbox');
        
        if (!checkbox) return;
        
        // Set checkbox state without triggering change event
        checkbox.checked = theme === 'dark';
    }
    
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
}

// Global instance
let themeToggle;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeToggle = new ThemeToggle();
    });
} else {
    themeToggle = new ThemeToggle();
}

// Global function for onclick handler (kept for backward compatibility)
function toggleTheme() {
    if (themeToggle) {
        themeToggle.toggleTheme();
    }
}