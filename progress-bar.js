/**
 * Progress Bar Component for Thinkific Lessons
 * Provides reusable top progress bar with theme toggle
 * Version 1.0
 */

class ProgressBar {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'Lesson Progress',
            showThemeToggle: options.showThemeToggle !== false,
            showStats: options.showStats !== false,
            containerId: options.containerId || null,
            ...options
        };
        
        this.element = null;
        this.progressBarFill = null;
    }
    
    /**
     * Generate the progress bar HTML
     */
    generateHTML() {
        return `
            <div class="fixed-progress">
                <div class="progress-content">
                    <div class="progress-label">
                        <span>${this.options.title}</span>
                        ${this.options.showThemeToggle ? this.generateThemeToggle() : ''}
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill" id="progressBar"></div>
                    </div>
                    ${this.options.showStats ? this.generateStats() : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Generate theme toggle HTML
     */
    generateThemeToggle() {
        return `
            <div class="theme-toggle">
                <input class="toggle-checkbox" type="checkbox" id="themeToggleCheckbox">
                <div class="toggle-slot">
                    <div class="sun-icon-wrapper">
                        <div class="iconify sun-icon" data-icon="feather-sun" data-inline="false"></div>
                    </div>
                    <div class="toggle-button"></div>
                    <div class="moon-icon-wrapper">
                        <div class="iconify moon-icon" data-icon="feather-moon" data-inline="false"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate stats section (optional)
     */
    generateStats() {
        if (!this.options.stats) return '';
        
        return `
            <div class="progress-stats">
                ${this.options.stats.map(stat => `
                    <div class="stat-item ${stat.complete ? 'stat-complete' : ''}">
                        <div class="iconify" data-icon="${stat.icon}" data-inline="false"></div>
                        <span>${stat.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Initialize and inject the progress bar
     */
    init() {
        // Create the element
        this.createElement();
        
        // Inject into DOM
        this.injectIntoDOM();
        
        // Get reference to progress bar fill
        this.progressBarFill = document.getElementById('progressBar');
        
        // Set up any additional event listeners
        this.setupEventListeners();
        
        return this;
    }
    
    /**
     * Create the DOM element
     */
    createElement() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.generateHTML();
        this.element = wrapper.firstElementChild;
    }
    
    /**
     * Inject the progress bar into the DOM
     */
    injectIntoDOM() {
        if (this.options.containerId) {
            const container = document.getElementById(this.options.containerId);
            if (container) {
                container.appendChild(this.element);
                return;
            }
        }
        
        // Default: inject at the beginning of body
        document.body.insertBefore(this.element, document.body.firstChild);
    }
    
    /**
     * Set up additional event listeners
     */
    setupEventListeners() {
        // Custom event listeners can be added here
        // Theme toggle is handled by theme-toggle.js
    }
    
    /**
     * Update progress percentage
     */
    updateProgress(percentage) {
        if (this.progressBarFill) {
            this.progressBarFill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
        }
    }
    
    /**
     * Update the title
     */
    updateTitle(newTitle) {
        const titleElement = this.element.querySelector('.progress-label span');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }
    
    /**
     * Update stats (if enabled)
     */
    updateStats(newStats) {
        if (!this.options.showStats) return;
        
        const statsContainer = this.element.querySelector('.progress-stats');
        if (statsContainer && newStats) {
            this.options.stats = newStats;
            statsContainer.innerHTML = newStats.map(stat => `
                <div class="stat-item ${stat.complete ? 'stat-complete' : ''}">
                    <div class="iconify" data-icon="${stat.icon}" data-inline="false"></div>
                    <span>${stat.label}</span>
                </div>
            `).join('');
        }
    }
    
    /**
     * Remove the progress bar from DOM
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    /**
     * Get the DOM element
     */
    getElement() {
        return this.element;
    }
}

// Export for use in other modules
window.ProgressBar = ProgressBar;