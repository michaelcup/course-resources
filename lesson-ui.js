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
        
        // Don't set up separate scroll tracking - let LessonManager handle it
        // this.setupScrollTracking();
        
        this.setupCustomEventListeners();
    }
    
    /**
     * Set up scroll tracking for progress bar updates
     * NOTE: Currently disabled in favor of LessonManager's built-in tracking
     */
    setupScrollTracking() {
        if (!this.progressBar) return;
        
        console.log('Setting up independent scroll tracking (this may conflict with LessonManager)');
        
        let scrollTimeout;
        
        const updateScrollProgress = () => {
            // Clear existing timeout
            clearTimeout(scrollTimeout);
            
            // Throttle scroll updates
            scrollTimeout = setTimeout(() => {
                // Check if LessonManager exists and has media
                const hasMedia = this.lessonManager && this.lessonManager.hasMedia;
                
                if (!hasMedia) {
                    // Calculate scroll progress for text content
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrolled = window.scrollY;
                    const progress = scrollHeight > 0 ? Math.min(100, Math.round((scrolled / scrollHeight) * 100)) : 0;
                    
                    // Update progress bar
                    this.progressBar.updateProgress(progress);
                    
                    // Update LessonManager if available
                    if (this.lessonManager) {
                        this.lessonManager.requirements.contentProgress = Math.max(
                            this.lessonManager.requirements.contentProgress, 
                            progress
                        );
                        
                        // Trigger UI updates (saveProgress is handled by LessonManager's throttled mechanism)
                        this.updateFromLessonManager();
                    }
                    
                    if (this.options.debug) {
                        console.log('Independent scroll progress updated:', progress + '%');
                    }
                }
            }, 100); // Throttle to every 100ms
        };
        
        // Add scroll listener
        window.addEventListener('scroll', updateScrollProgress, { passive: true });
        
        // Initial calculation
        updateScrollProgress();
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
                this.fixLessonManagerScrollTracking();
            } else {
                setTimeout(checkForLessonManager, 100);
            }
        };
        
        checkForLessonManager();
        
        // Also listen for when LessonManager is created
        window.addEventListener('lessonManagerReady', (e) => {
            this.lessonManager = e.detail.lessonManager;
            this.bindLessonManagerEvents();
            this.fixLessonManagerScrollTracking();
        });
    }
    
    /**
     * Fix LessonManager's scroll tracking to work with our modular progress bar
     */
    fixLessonManagerScrollTracking() {
        if (!this.lessonManager) return;
        
        // Override LessonManager's updateProgressDisplay to work with our progress bar
        const originalUpdateProgressDisplay = this.lessonManager.updateProgressDisplay.bind(this.lessonManager);
        
        this.lessonManager.updateProgressDisplay = () => {
            // Update the original progress bar element (if it exists)
            const originalProgressBar = document.getElementById('progressBar');
            if (originalProgressBar) {
                originalProgressBar.style.width = this.lessonManager.requirements.contentProgress + '%';
            }
            
            // Update our modular progress bar
            if (this.progressBar) {
                this.progressBar.updateProgress(this.lessonManager.requirements.contentProgress);
            }
            
            // Call original method for other UI updates
            originalUpdateProgressDisplay();
            
            // Update our bottom bar
            this.updateFromLessonManager();
        };
        
        // Ensure scroll tracking is working
        this.ensureScrollTracking();
    }
    
    /**
     * Ensure scroll tracking is properly set up
     */
    ensureScrollTracking() {
        if (!this.lessonManager) return;
        
        // Force re-setup of scroll tracking
        const originalSetupEventListeners = this.lessonManager.setupEventListeners.bind(this.lessonManager);
        
        // Add additional scroll listener to ensure it works
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (!this.lessonManager.hasMedia) {
                    this.lessonManager.trackContent();
                    
                    if (this.options.debug) {
                        console.log('Manual scroll tracking triggered, progress:', this.lessonManager.requirements.contentProgress + '%');
                    }
                }
            }, 50);
        }, { passive: true });
        
        // Initial content tracking
        setTimeout(() => {
            this.lessonManager.trackContent();
        }, 500);
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