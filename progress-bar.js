/**
 * Progress Bar Component for Thinkific Lessons
 * Provides reusable top progress bar with theme toggle and zoom controls
 * Version 1.0
 */

class ProgressBar {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'Lesson Progress',
            showThemeToggle: options.showThemeToggle !== false,
            showZoomControls: options.showZoomControls !== false,
            showStats: options.showStats !== false,
            containerId: options.containerId || null,
            ...options
        };
        
        this.element = null;
        this.progressBarFill = null;
        this.currentZoom = 100;
        this.minZoom = 75;
        this.maxZoom = 150;
        this.zoomStep = 10;
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
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            ${this.options.showZoomControls ? this.generateZoomControls() : ''}
                            ${this.options.showThemeToggle ? this.generateThemeToggle() : ''}
                        </div>
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
     * Generate zoom controls HTML
     */
    generateZoomControls() {
        return `
            <div class="progress-zoom-controls">
                <button class="zoom-button" id="zoomOut" title="Zoom Out (Ctrl + -)">-</button>
                <div class="zoom-display" id="zoomDisplay">100%</div>
                <button class="zoom-button" id="zoomIn" title="Zoom In (Ctrl + +)">+</button>
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
        // Reset any previous body scaling (in case old version was used)
        document.body.style.zoom = '';
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        
        // Create the element
        this.createElement();
        
        // Inject into DOM
        this.injectIntoDOM();
        
        // Get reference to progress bar fill
        this.progressBarFill = document.getElementById('progressBar');
        
        // Set up any additional event listeners
        this.setupEventListeners();
        
        // Load saved zoom level
        if (this.options.showZoomControls) {
            setTimeout(() => this.loadSavedZoom(), 100);
        }
        
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
        // Set up zoom controls
        if (this.options.showZoomControls) {
            this.setupZoomControls();
        }
    }
    
    /**
     * Set up zoom control functionality
     */
    setupZoomControls() {
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const zoomDisplay = document.getElementById('zoomDisplay');
        
        if (zoomInBtn && zoomOutBtn && zoomDisplay) {
            // Button click handlers
            zoomInBtn.addEventListener('click', () => this.zoomIn());
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === '=' || e.key === '+') {
                        e.preventDefault();
                        this.zoomIn();
                    } else if (e.key === '-') {
                        e.preventDefault();
                        this.zoomOut();
                    } else if (e.key === '0') {
                        e.preventDefault();
                        this.resetZoom();
                    }
                }
            });
            
            // Initialize zoom level
            this.updateZoomDisplay();
        }
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        if (this.currentZoom < this.maxZoom) {
            this.currentZoom += this.zoomStep;
            this.applyZoom();
        }
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        if (this.currentZoom > this.minZoom) {
            this.currentZoom -= this.zoomStep;
            this.applyZoom();
        }
    }
    
    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        this.currentZoom = 100;
        this.applyZoom();
    }
    
    /**
     * Apply zoom level to the page
     */
    applyZoom() {
        // Target the main content container instead of the entire body
        const contentContainer = document.querySelector('.lesson-container');
        if (contentContainer) {
            // Simply adjust the font-size - CSS em/rem units will scale accordingly
            const fontScale = this.currentZoom / 100;
            contentContainer.style.fontSize = fontScale + 'rem';
        }
        
        this.updateZoomDisplay();
        
        // Save zoom preference
        localStorage.setItem('lessonZoomLevel', this.currentZoom);
        
        // Dispatch zoom change event
        window.dispatchEvent(new CustomEvent('zoomChanged', {
            detail: { zoom: this.currentZoom }
        }));
    }
    
    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoomDisplay');
        if (zoomDisplay) {
            zoomDisplay.textContent = this.currentZoom + '%';
        }
        
        // Update button states
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        
        if (zoomInBtn) {
            zoomInBtn.disabled = this.currentZoom >= this.maxZoom;
        }
        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.currentZoom <= this.minZoom;
        }
    }
    
    /**
     * Load saved zoom level
     */
    loadSavedZoom() {
        const savedZoom = localStorage.getItem('lessonZoomLevel');
        if (savedZoom) {
            this.currentZoom = Math.min(this.maxZoom, Math.max(this.minZoom, parseInt(savedZoom)));
            this.applyZoom();
        }
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