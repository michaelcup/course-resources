/**
 * Lesson UI Orchestrator for Thinkific Lessons
 * Brings together all UI components for easy setup
 * Version 1.0
 */

class LessonUI {
    constructor(options = {}) {
        this.options = {
            // Progress bar options
            progressBar: {
                title: options.title || 'Lesson Progress',
                showThemeToggle: options.showThemeToggle !== false,
                showStats: options.showStats || false,
                stats: options.stats || null,
                ...options.progressBar
            },
            
            // Bottom bar options
            bottomBar: {
                requirements: options.requirements || [
                    {
                        id: 'reading',
                        icon: 'feather-book-open',
                        label: 'Lesson Incomplete',
                        completeLabel: 'Lesson Complete'
                    },
                    {
                        id: 'quiz',
                        icon: 'feather-edit-3',
                        label: 'Quiz Incomplete',
                        completeLabel: 'Quiz Complete',
                        failedLabel: 'Quiz Failed - Try Again',
                        inProgressLabel: 'Quiz In Progress'
                    }
                ],
                showActions: options.showActions || false,
                actions: options.actions || null,
                ...options.bottomBar
            },
            
            // Auto-init options
            autoInit: options.autoInit !== false,
            
            // Integration options
            integrateLessonManager: options.integrateLessonManager !== false,
            
            ...options
        };
        
        this.progressBar = null;
        this.bottomBar = null;
        this.lessonManager = null;
        
        if (this.options.autoInit) {
            this.init();
        }
    }
    
    /**
     * Initialize all UI components
     */
    init() {
        // Initialize progress bar
        this.initProgressBar();
        
        // Initialize bottom bar
        this.initBottomBar();
        
        // Set up integrations
        this.setupIntegrations();
        
        // Set up body padding for fixed bars
        this.setupBodyPadding();
        
        return this;
    }
    
    /**
     * Initialize the progress bar
     */
    initProgressBar() {
        if (!window.ProgressBar) {
            console.warn('ProgressBar class not found. Make sure progress-bar.js is loaded.');
            return;
        }
        
        this.progressBar = new ProgressBar(this.options.progressBar);
        this.progressBar.init();
    }
    
    /**
     * Initialize the bottom bar
     */
    initBottomBar() {
        if (!window.BottomBar) {
            console.warn('BottomBar class not found. Make sure bottom-bar.js is loaded.');
            return;
        }
        
        this.bottomBar = new BottomBar(this.options.bottomBar);
        this.bottomBar.init();
    }
    
    /**
     * Set up integrations with other components
     */
    setupIntegrations() {
        if (this.options.integrateLessonManager) {
            this.setupLessonManagerIntegration();
        }
        
        this.setupCustomEventListeners();
    }
    
    /**
     * Integrate with LessonManager if available
     */
    setupLessonManagerIntegration() {
        // Wait for LessonManager to be available
        const checkForLessonManager = () => {
            if (window.lessonManager) {
                this.lessonManager = window.lessonManager;
                this.bindLessonManagerEvents();
            } else {
                setTimeout(checkForLessonManager, 100);
            }
        };
        
        checkForLessonManager();
        
        // Also listen for when LessonManager is created
        window.addEventListener('lessonManagerReady', (e) => {
            this.lessonManager = e.detail.lessonManager;
            this.bindLessonManagerEvents();
        });
    }
    
    /**
     * Bind events from LessonManager to update UI
     */
    bindLessonManagerEvents() {
        if (!this.lessonManager) return;
        
        // Override LessonManager's updateProgressDisplay method
        const originalUpdateProgressDisplay = this.lessonManager.updateProgressDisplay.bind(this.lessonManager);
        
        this.lessonManager.updateProgressDisplay = () => {
            // Call original method
            originalUpdateProgressDisplay();
            
            // Update our UI components
            this.updateFromLessonManager();
        };
        
        // Override trackContent method to ensure our progress bar updates
        const originalTrackContent = this.lessonManager.trackContent.bind(this.lessonManager);
        
        this.lessonManager.trackContent = () => {
            // Call original method
            originalTrackContent();
            
            // Update our progress bar immediately
            if (this.progressBar) {
                this.progressBar.updateProgress(this.lessonManager.requirements.contentProgress);
            }
        };
        
        // Initial update
        this.updateFromLessonManager();
    }
    
    /**
     * Update UI components based on LessonManager state
     */
    updateFromLessonManager() {
        if (!this.lessonManager) return;
        
        // Update progress bar
        if (this.progressBar) {
            const progress = this.lessonManager.requirements.contentProgress;
            this.progressBar.updateProgress(progress);
            
            // Debug logging
            if (this.options.debug) {
                console.log('Updating progress bar:', progress + '%');
            }
        }
        
        // Update bottom bar requirements
        if (this.bottomBar) {
            const updates = {};
            
            // Reading/content requirement
            if (this.lessonManager.requirements.contentProgress >= 90) {
                updates.reading = {
                    status: 'complete',
                    label: this.lessonManager.hasMedia ? 'Media Complete' : 'Reading Complete'
                };
            } else {
                updates.reading = {
                    status: 'incomplete',
                    label: this.lessonManager.hasMedia ? 'Media Incomplete' : 'Reading Incomplete'
                };
            }
            
            // Quiz requirement
            switch (this.lessonManager.quizState) {
                case 'not-started':
                    updates.quiz = { status: 'incomplete', label: 'Quiz Not Started' };
                    break;
                case 'in-progress':
                    updates.quiz = { status: 'in-progress', label: 'Quiz In Progress' };
                    break;
                case 'failed':
                    updates.quiz = { status: 'failed', label: 'Quiz Failed - Try Again' };
                    break;
                case 'passed':
                    updates.quiz = { status: 'complete', label: 'Quiz Passed' };
                    break;
            }
            
            this.bottomBar.updateRequirements(updates);
            
            // Debug logging
            if (this.options.debug) {
                console.log('Updating bottom bar requirements:', updates);
            }
        }
    }
    
    /**
     * Set up custom event listeners
     */
    setupCustomEventListeners() {
        // Listen for requirement updates
        window.addEventListener('requirementUpdated', (e) => {
            console.log('Requirement updated:', e.detail);
        });
        
        // Listen for theme changes
        window.addEventListener('themeChanged', (e) => {
            console.log('Theme changed:', e.detail.theme);
        });
    }
    
    /**
     * Set up body padding to account for fixed bars
     */
    setupBodyPadding() {
        // This should match your CSS values
        const topPadding = '60px';
        const bottomPadding = '100px';
        
        document.body.style.paddingTop = topPadding;
        document.body.style.paddingBottom = bottomPadding;
    }
    
    /**
     * Update progress percentage
     */
    updateProgress(percentage) {
        if (this.progressBar) {
            this.progressBar.updateProgress(percentage);
        }
    }
    
    /**
     * Update a requirement status
     */
    updateRequirement(id, status, label = null) {
        if (this.bottomBar) {
            this.bottomBar.updateRequirement(id, status, label);
        }
    }
    
    /**
     * Update multiple requirements
     */
    updateRequirements(updates) {
        if (this.bottomBar) {
            this.bottomBar.updateRequirements(updates);
        }
    }
    
    /**
     * Update the progress bar title
     */
    updateTitle(newTitle) {
        if (this.progressBar) {
            this.progressBar.updateTitle(newTitle);
        }
    }
    
    /**
     * Check if all requirements are complete
     */
    areAllRequirementsComplete() {
        return this.bottomBar ? this.bottomBar.areAllRequirementsComplete() : false;
    }
    
    /**
     * Get current requirement status
     */
    getRequirementStatus() {
        return this.bottomBar ? this.bottomBar.getRequirementStatus() : {};
    }
    
    /**
     * Add a new requirement
     */
    addRequirement(requirement) {
        if (this.bottomBar) {
            this.bottomBar.addRequirement(requirement);
        }
    }
    
    /**
     * Remove a requirement
     */
    removeRequirement(id) {
        if (this.bottomBar) {
            this.bottomBar.removeRequirement(id);
        }
    }
    
    /**
     * Destroy all UI components
     */
    destroy() {
        if (this.progressBar) {
            this.progressBar.destroy();
        }
        
        if (this.bottomBar) {
            this.bottomBar.destroy();
        }
        
        // Reset body padding
        document.body.style.paddingTop = '';
        document.body.style.paddingBottom = '';
    }
    
    /**
     * Get access to individual components
     */
    getComponents() {
        return {
            progressBar: this.progressBar,
            bottomBar: this.bottomBar
        };
    }
}

// Convenience function for simple setup
window.initLessonUI = function(options = {}) {
    return new LessonUI(options);
};

// Export for use in other modules
window.LessonUI = LessonUI;