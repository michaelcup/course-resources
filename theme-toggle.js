/**
 * Theme Toggle for Thinkific Lessons
 * Provides dark/light mode functionality across all lessons
 * Version 1.0
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
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Use saved theme, or fall back to system preference, or default to light
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        this.applyTheme(theme);
        this.updateToggleButton(theme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.applyTheme(newTheme);
        this.updateToggleButton(newTheme);
        
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
    
    updateToggleButton(theme) {
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        
        if (!themeIcon || !themeText) return;
        
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light';
            themeIcon.classList.add('active');
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark';
            themeIcon.classList.remove('active');
        }
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

// Global function for onclick handler
function toggleTheme() {
    if (themeToggle) {
        themeToggle.toggleTheme();
    }
}