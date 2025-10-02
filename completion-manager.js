/**
 * Completion Manager for Thinkific Lessons
 * Handles completion messages and celebration animations
 * Version 1.0
 */

class CompletionManager {
    constructor(config = {}) {
        this.config = {
            title: config.title || 'Lesson Complete!',
            message: config.message || 'Excellent! You\'ve completed this lesson.',
            celebrationMessages: this.getUniversalCelebrationMessages(),
            showCelebration: config.showCelebration !== false,
            ...config
        };
        
        this.init();
    }
    
    /**
     * Get universal celebration messages used across all lessons
     */
    getUniversalCelebrationMessages() {
        return [
            { icon: '🎉', title: 'Outstanding!', message: 'You\'ve completed this lesson!' },
            { icon: '⭐', title: 'Excellent Work!', message: 'Your knowledge is growing stronger!' },
            { icon: '🚀', title: 'Amazing Progress!', message: 'You\'re on fire today!' },
            { icon: '💎', title: 'Brilliant!', message: 'You\'ve earned your mastery!' },
            { icon: '🏆', title: 'Champion!', message: 'Another lesson conquered!' },
            { icon: '🔥', title: 'On Fire!', message: 'Your learning momentum is unstoppable!' },
            { icon: '💪', title: 'Powerhouse!', message: 'You\'re building incredible mental strength!' },
            { icon: '🌟', title: 'Superstar!', message: 'Your dedication is truly inspiring!' },
            { icon: '🎯', title: 'Bullseye!', message: 'You\'re hitting every learning target!' },
            { icon: '⚡', title: 'Electric!', message: 'Your progress is absolutely electrifying!' },
            { icon: '🏅', title: 'Gold Standard!', message: 'You\'re setting the bar high!' },
            { icon: '🦅', title: 'Soaring High!', message: 'Your potential knows no limits!' },
            { icon: '🔑', title: 'Key Master!', message: 'You\'re unlocking your true potential!' },
            { icon: '🌈', title: 'Breakthrough!', message: 'You\'re creating your own success story!' },
            { icon: '🎪', title: 'Show Stopper!', message: 'Your commitment is absolutely phenomenal!' }
        ];
    }
    
    /**
     * Initialize the completion manager
     */
    init() {
        this.setCompletionMessage();
        this.setupEventListeners();
    }
    
    /**
     * Set the completion message in the DOM
     */
    setCompletionMessage() {
        const titleElement = document.getElementById('completionTitle');
        const messageElement = document.getElementById('completionMessage');
        
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        if (messageElement) {
            messageElement.textContent = this.config.message;
        }
    }
    
    /**
     * Set up event listeners for lesson completion
     */
    setupEventListeners() {
        // Listen for lesson manager events if available
        window.addEventListener('lessonManagerReady', (e) => {
            this.integrateWithLessonManager(e.detail.lessonManager);
        });
        
        // If lesson manager is already available
        if (window.lessonManager) {
            this.integrateWithLessonManager(window.lessonManager);
        }
    }
    
    /**
     * Integrate with existing lesson manager
     */
    integrateWithLessonManager(lessonManager) {
        // Override the showCelebration method if it exists
        if (lessonManager.showCelebration && this.config.showCelebration) {
            const originalShowCelebration = lessonManager.showCelebration.bind(lessonManager);
            
            lessonManager.showCelebration = (score = 100) => {
                this.showCelebration(score);
            };
        }
    }
    
    /**
     * Show celebration animation when lesson/quiz is completed
     */
    showCelebration(score = 100) {
        // Create celebration overlay if it doesn't exist
        let overlay = document.getElementById('celebrationOverlay');
        if (!overlay) {
            overlay = this.createCelebrationOverlay(score);
            document.body.appendChild(overlay);
        }
        
        // Show the celebration
        overlay.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            overlay.classList.remove('show');
        }, 3000);
        
        console.log('Celebration shown for score:', score + '%');
    }
    
    /**
     * Create celebration overlay element
     */
    createCelebrationOverlay(score) {
        const overlay = document.createElement('div');
        overlay.id = 'celebrationOverlay';
        overlay.className = 'celebration-overlay';
        
        // Get random celebration message
        const randomMessage = this.config.celebrationMessages[
            Math.floor(Math.random() * this.config.celebrationMessages.length)
        ];
        
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">${randomMessage.icon}</div>
                <div class="celebration-title">${randomMessage.title}</div>
                <div class="celebration-message">${randomMessage.message}</div>
                <div class="celebration-score">Score: ${score}%</div>
            </div>
        `;
        
        // Add confetti
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'celebration-confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            overlay.appendChild(confetti);
        }
        
        return overlay;
    }
    
    /**
     * Update completion configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.setCompletionMessage();
    }
    
    /**
     * Manually trigger completion
     */
    triggerCompletion(score = 100) {
        // Show completion section
        const completionSection = document.getElementById('completionSection');
        if (completionSection) {
            completionSection.classList.add('show');
        }
        
        // Show celebration if enabled
        if (this.config.showCelebration) {
            this.showCelebration(score);
        }
    }
    
    /**
     * Add custom celebration message
     */
    addCelebrationMessage(message) {
        this.config.celebrationMessages.push(message);
    }
    
    /**
     * Get random celebration message
     */
    getRandomCelebrationMessage() {
        return this.config.celebrationMessages[
            Math.floor(Math.random() * this.config.celebrationMessages.length)
        ];
    }
}

// Export for use in other modules
window.CompletionManager = CompletionManager;