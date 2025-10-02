/**
 * Completion Manager for Thinkific Lessons
 * Handles completion messages and celebration animations
 * Version 2.0 - Updated with new confetti system
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
            { icon: '🥇', title: 'Gold Standard!', message: 'You\'re setting the bar high!' }
        ];
    }
    
    /**
     * Initialize the completion manager
     */
    init() {
        this.setCompletionMessage();
        this.setupEventListeners();
        this.ensureOverlayExists();
    }
    
    /**
     * Ensure the celebration overlay exists in the DOM
     */
    ensureOverlayExists() {
        let overlay = document.getElementById('celebrationOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'celebrationOverlay';
            overlay.className = 'celebration-overlay';
            document.body.appendChild(overlay);
            console.log('[CompletionManager] Created celebration overlay');
        }
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
        // Ensure overlay exists
        this.ensureOverlayExists();
        
        const overlay = document.getElementById('celebrationOverlay');
        
        if (!overlay) {
            console.error('[CompletionManager] Could not create celebration overlay');
            return;
        }
        
        // Clear previous content and remove hide class
        overlay.innerHTML = '';
        overlay.classList.remove('hide');
        
        // Create new content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'celebration-content';
        
        // Get random celebration message
        const randomMessage = this.config.celebrationMessages[
            Math.floor(Math.random() * this.config.celebrationMessages.length)
        ];
        
        contentDiv.innerHTML = `
            <div class="celebration-icon">${randomMessage.icon}</div>
            <div class="celebration-title">${randomMessage.title}</div>
            <div class="celebration-message">${randomMessage.message}</div>
            <div class="celebration-score">Score: ${score}%</div>
        `;
        
        overlay.appendChild(contentDiv);
        
        // Create confetti - shooting from bottom left and right only
        const colors = ['blue-1', 'blue-2', 'orange-1', 'orange-2'];
        const shapes = ['circle', 'square', 'rectangle'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'celebration-confetti';
            
            // Random color (blue or orange)
            const colorClass = colors[Math.floor(Math.random() * colors.length)];
            confetti.classList.add(colorClass);
            
            // Random shape
            const shapeClass = shapes[Math.floor(Math.random() * shapes.length)];
            confetti.classList.add(shapeClass);
            
            // Determine side (left or right)
            const fromLeft = i < 50; // First 50 from left, rest from right
            
            // Random end position (shooting upward and across)
            let xEnd, yEnd;
            if (fromLeft) {
                // From bottom left - shoot up and to the right
                xEnd = Math.random() * 800 + 200; // 200-1000px to the right
                yEnd = -(Math.random() * 600 + 400); // -400 to -1000px up
            } else {
                // From bottom right - shoot up and to the left
                xEnd = -(Math.random() * 800 + 200); // -200 to -1000px to the left
                yEnd = -(Math.random() * 600 + 400); // -400 to -1000px up
            }
            
            const rotation = Math.random() * 1080 + 360; // 360-1440 degrees
            
            // Set CSS variables for animation
            confetti.style.setProperty('--x-end', `${xEnd}px`);
            confetti.style.setProperty('--y-end', `${yEnd}px`);
            confetti.style.setProperty('--rotation', `${rotation}deg`);
            
            // Faster animation - 1-1.8s instead of 2-3.5s
            const duration = (Math.random() * 0.8 + 1) + 's'; // 1-1.8s
            const delay = Math.random() * 0.3 + 's'; // 0-0.3s
            
            const animationName = fromLeft ? 'confettiFromBottomLeft' : 'confettiFromBottomRight';
            confetti.style.animation = `${animationName} ${duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay} both`;
            
            // Slight size variation
            const size = 8 + Math.random() * 8;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            // Starting position
            if (fromLeft) {
                confetti.style.left = '0';
                confetti.style.bottom = '0';
            } else {
                confetti.style.right = '0';
                confetti.style.bottom = '0';
            }
            
            overlay.appendChild(confetti);
        }
        
        // Show the celebration
        overlay.classList.add('show');
        
        // Start fade out after 3 seconds
        setTimeout(() => {
            overlay.classList.add('hide');
            
            // Actually remove display after fade completes
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500); // Match the CSS transition duration
        }, 3000);
        
        console.log('[CompletionManager] Celebration shown for score:', score + '%');
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