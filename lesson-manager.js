/*
Multimedia Lesson Manager v2.0
 */

class LessonManager {
    constructor(options = {}) {
        this.requirements = {
            reading: 0,
            quizPassed: false
        };
        
        this.selectedAnswers = {};
        this.lessonId = options.lessonId || this.getLessonId();
        this.quizState = 'active'; // 'active', 'review', 'completed'
        this.debug = options.debug || false;
        
        this.init();
    }
    
    /**
     * Get lesson ID from URL parameters or referrer
     */
    getLessonId() {
        const urlParams = new URLSearchParams(window.location.search);
        const paramLessonId = urlParams.get('lesson_id');
        if (paramLessonId) return paramLessonId;
        
        const parentUrl = document.referrer;
        const match = parentUrl.match(/lessons\/(\d+)/);
        if (match) return match[1];
        
        // Fallback to page title or default
        const title = document.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return title || 'default-lesson';
    }
    
    /**
     * Initialize the lesson manager
     */
    init() {
        this.log('Initializing lesson manager for:', this.lessonId);
        
        this.setupEventListeners();
        this.loadProgress();
        this.declareLessonRequirements();
        this.trackScroll();
        
        this.log('Lesson manager initialized successfully');
    }
    
    /**
     * Set up event listeners for interactions
     */
    setupEventListeners() {
        // Answer option clicks
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleAnswerClick(e));
        });
        
        // Scroll tracking
        window.addEventListener('scroll', () => this.trackScroll());
        
        // Visibility change (for pause/resume tracking)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.log('Page hidden - pausing tracking');
            } else {
                this.log('Page visible - resuming tracking');
            }
        });
        
        this.log('Event listeners setup complete');
    }
    
    /**
     * Declare lesson requirements to parent window (Thinkific)
     */
    declareLessonRequirements() {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'lesson_requirements',
                lesson: this.lessonId,
                requires_completion: true,
                requirements: {
                    quiz: true,
                    reading: false
                }
            }, '*');
            
            this.log('Declared lesson requirements to parent');
        }
    }
    
    /**
     * Load saved progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(`lesson_${this.lessonId}_progress`);
            if (saved) {
                const progress = JSON.parse(saved);
                this.requirements = { ...this.requirements, ...progress.requirements };
                
                // Update UI
                this.updateProgressDisplay();
                
                // Restore quiz state if completed
                if (this.requirements.quizPassed) {
                    this.setQuizState('completed');
                }
                
                this.log('Progress loaded:', this.requirements);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
    
    /**
     * Save progress to localStorage
     */
    saveProgress() {
        try {
            const progress = {
                requirements: this.requirements,
                timestamp: new Date().toISOString(),
                quizState: this.quizState,
                selectedAnswers: this.selectedAnswers
            };
            localStorage.setItem(`lesson_${this.lessonId}_progress`, JSON.stringify(progress));
            this.log('Progress saved');
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    /**
     * Track reading progress based on scroll position
     */
    trackScroll() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const percent = Math.min(100, Math.round((scrolled / scrollHeight) * 100));
        
        this.requirements.reading = Math.max(this.requirements.reading, percent);
        this.updateProgressDisplay();
        
        // Throttled save to avoid excessive localStorage writes
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveProgress(), 1000);
    }
    
    /**
     * Update all progress displays
     */
    updateProgressDisplay() {
        // Update reading status
        const readStatusEl = document.getElementById('readStatus');
        if (readStatusEl) {
            readStatusEl.textContent = this.requirements.reading + '%';
            if (this.requirements.reading >= 90) {
                readStatusEl.classList.add('stat-complete');
            }
        }
        
        // Update quiz status
        const quizStatusEl = document.getElementById('quizStatus');
        if (quizStatusEl) {
            if (this.requirements.quizPassed) {
                quizStatusEl.textContent = 'Passed';
                quizStatusEl.classList.add('stat-complete');
            } else if (this.quizState === 'review') {
                quizStatusEl.textContent = 'Reviewing';
            } else {
                quizStatusEl.textContent = 'Not Started';
            }
        }
        
        // Update progress bar
        let progress = 0;
        progress += (this.requirements.reading / 100) * 50; // Reading is 50%
        progress += this.requirements.quizPassed ? 50 : 0;  // Quiz is 50%
        
        const progressBarEl = document.getElementById('progressBar');
        if (progressBarEl) {
            progressBarEl.style.width = progress + '%';
        }
        
        // Update bottom bar icons
        this.updateBottomBarIcons();
    }
    
    /**
     * Update completion requirement icons in bottom bar
     */
    updateBottomBarIcons() {
        const readingIcon = document.getElementById('readingIcon');
        const quizIcon = document.getElementById('quizIcon');
        
        // Update reading icon
        if (readingIcon) {
            if (this.requirements.reading >= 90) {
                readingIcon.classList.remove('incomplete');
                readingIcon.classList.add('complete');
            } else {
                readingIcon.classList.remove('complete');
                readingIcon.classList.add('incomplete');
            }
        }
        
        // Update quiz icon
        if (quizIcon) {
            if (this.requirements.quizPassed) {
                quizIcon.classList.remove('incomplete');
                quizIcon.classList.add('complete');
            } else {
                quizIcon.classList.remove('complete');
                quizIcon.classList.add('incomplete');
            }
        }
    }
    
    /**
     * Handle answer option clicks
     */
    handleAnswerClick(event) {
        if (this.quizState !== 'active') return;
        
        const option = event.target;
        const question = option.closest('.question-block');
        
        // Remove previous selection
        question.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selection
        option.classList.add('selected');
        
        // Store answer
        const questionIndex = Array.from(document.querySelectorAll('.question-block')).indexOf(question);
        this.selectedAnswers[questionIndex] = option.getAttribute('data-answer');
        
        this.log('Answer selected:', questionIndex, this.selectedAnswers[questionIndex]);
    }
    
    /**
     * Set quiz state and update UI accordingly
     */
    setQuizState(state) {
        this.quizState = state;
        const container = document.getElementById('quizContainer');
        const resetBtn = document.getElementById('quizResetBtn');
        const reviewInstructions = document.getElementById('reviewInstructions');
        
        if (!container) return;
        
        switch (state) {
            case 'active':
                container.classList.remove('review-mode');
                if (resetBtn) resetBtn.classList.remove('show');
                if (reviewInstructions) reviewInstructions.classList.remove('show');
                break;
                
            case 'review':
                container.classList.add('review-mode');
                if (resetBtn) resetBtn.classList.add('show');
                if (reviewInstructions) reviewInstructions.classList.add('show');
                break;
                
            case 'completed':
                container.classList.add('review-mode');
                if (resetBtn) resetBtn.classList.add('show');
                if (reviewInstructions) reviewInstructions.classList.add('show');
                const completionSection = document.getElementById('completionSection');
                if (completionSection) completionSection.classList.add('show');
                break;
        }
        
        this.log('Quiz state changed to:', state);
    }
    
    /**
     * Check quiz answers and provide feedback
     */
    checkAnswers() {
        const questions = document.querySelectorAll('.question-block');
        let correctCount = 0;
        
        // Evaluate answers and show results
        questions.forEach((question, index) => {
            const correctAnswer = question.getAttribute('data-correct');
            const selectedAnswer = this.selectedAnswers[index];
            
            if (selectedAnswer) {
                const selectedOption = question.querySelector(`[data-answer="${selectedAnswer}"]`);
                if (selectedAnswer === correctAnswer) {
                    selectedOption.classList.add('correct');
                    correctCount++;
                } else {
                    selectedOption.classList.add('incorrect');
                }
            }
            
            // Always show the correct answer
            const correctOption = question.querySelector(`[data-answer="${correctAnswer}"]`);
            if (correctOption && !correctOption.classList.contains('correct')) {
                correctOption.classList.add('correct');
            }
        });
        
        // Show feedback and update state
        const feedback = document.getElementById('quizFeedback');
        const allCorrect = correctCount === questions.length;
        
        if (feedback) {
            if (allCorrect) {
                feedback.className = 'quiz-feedback success show';
                feedback.textContent = `🎉 Perfect! All ${correctCount} answers correct. Review your answers above or retake the quiz.`;
                this.requirements.quizPassed = true;
                this.setQuizState('completed');
                this.notifyCompletion();
            } else {
                feedback.className = 'quiz-feedback error show';
                feedback.textContent = `You got ${correctCount} out of ${questions.length} correct. Review the answers above and click "Reset Quiz" to try again.`;
                this.requirements.quizPassed = false;
                this.setQuizState('review');
                this.notifyReset();
            }
        }
        
        this.updateProgressDisplay();
        this.saveProgress();
        
        this.log('Quiz checked:', { correctCount, total: questions.length, passed: allCorrect });
    }
    
    /**
     * Reset quiz to initial state
     */
    resetQuiz() {
        // Clear all selections and feedback
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
        });
        
        const feedback = document.getElementById('quizFeedback');
        if (feedback) feedback.classList.remove('show');
        
        const completionSection = document.getElementById('completionSection');
        if (completionSection) completionSection.classList.remove('show');
        
        // Reset data
        this.selectedAnswers = {};
        this.requirements.quizPassed = false;
        this.setQuizState('active');
        
        // Update display
        this.updateProgressDisplay();
        this.saveProgress();
        
        // Notify parent of reset
        this.notifyReset();
        
        this.log('Quiz reset');
    }
    
    /**
     * Notify parent window of lesson completion
     */
    notifyCompletion() {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'lesson_complete',
                lesson: this.lessonId,
                score: 100,
                timestamp: new Date().toISOString()
            }, '*');
            
            this.log('Sent completion message to parent');
        }
    }
    
    /**
     * Notify parent window of quiz reset
     */
    notifyReset() {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'lesson_reset',
                lesson: this.lessonId,
                timestamp: new Date().toISOString()
            }, '*');
            
            this.log('Sent reset message to parent');
        }
    }
    
    /**
     * Debug logging
     */
    log(...args) {
        if (this.debug || window.location.hostname === 'localhost') {
            console.log('[LessonManager]', ...args);
        }
    }
    
    /**
     * Get lesson analytics data
     */
    getAnalytics() {
        return {
            lessonId: this.lessonId,
            readingProgress: this.requirements.reading,
            quizPassed: this.requirements.quizPassed,
            quizState: this.quizState,
            timestamp: new Date().toISOString()
        };
    }
}

// Export for use in other modules or global scope
window.LessonManager = LessonManager;