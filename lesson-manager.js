/**
 * Thinkific Multimedia Lesson Manager v2.6
 * Enhanced with completion state detection
 */

class LessonManager {
    constructor(options = {}) {
        this.requirements = {
            contentProgress: 0,
            quizPassed: false
        };
        
        this.selectedAnswers = {};
        this.lessonId = options.lessonId || this.getLessonId();
        this.quizState = 'not-started';
        this.debug = options.debug || false;
        
        // Check if quiz exists
        this.hasQuiz = this.checkForQuiz();
        
        // Quiz configuration
        this.quizConfig = {
            passingScore: options.passingScore || 100,
            showCelebration: options.showCelebration !== false,
            ...options.quizConfig
        };
        
        // Simple scroll tracking
        this.highestScrollProgress = 0;
        
        this.init();
    }
    
    /**
     * Check if this lesson has a quiz
     */
    checkForQuiz() {
        // Check if lessonQuiz is defined and has questions
        if (typeof lessonQuiz === 'undefined' || !Array.isArray(lessonQuiz)) {
            return false;
        }
        
        return lessonQuiz.length > 0;
    }
    
    /**
     * Initialize the lesson manager
     */
    init() {
        this.log('Initializing lesson manager for:', this.lessonId);
        
        this.setupEventListeners();
        
        // Load progress BEFORE declaring requirements
        this.loadProgress();
        
        // Now declare requirements with completion state
        this.declareLessonRequirements();
        
        // Handle completion notification based on quiz presence
        if (this.hasQuiz) {
            // If quiz was already passed, notify parent immediately
            if (this.requirements.quizPassed) {
                setTimeout(() => {
                    this.notifyCompletion();
                    this.log('Previously completed quiz - notified parent');
                }, 500);
            }
        } else {
            // No quiz - lesson is always "complete" for button purposes
            this.log('No quiz detected - lesson does not require completion');
        }
        
        // Initial scroll check
        setTimeout(() => {
            this.trackScrollProgress();
        }, 100);
        
        this.log('Lesson manager initialized successfully');
    }
    
    /**
     * Track scroll progress - simple and reliable, stops at quiz
     */
    trackScrollProgress() {
        const contentEndElement = this.findContentEnd();
        
        let scrollableHeight;
        if (contentEndElement) {
            const contentEndTop = contentEndElement.offsetTop + contentEndElement.offsetHeight;
            const windowHeight = window.innerHeight;
            scrollableHeight = Math.max(0, contentEndTop - windowHeight);
            
            if (this.debug && scrollableHeight === 0) {
                this.log('Content fits in viewport, no scrolling needed for 100%');
            }
        } else {
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            scrollableHeight = documentHeight - windowHeight;
            
            if (this.debug) {
                this.log('No content end found, using full document height');
            }
        }
        
        const scrollTop = window.scrollY;
        let currentScrollProgress = 0;
        
        if (scrollableHeight > 0) {
            currentScrollProgress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
        } else {
            currentScrollProgress = scrollTop > 10 ? 100 : 0;
        }
        
        if (currentScrollProgress > this.highestScrollProgress) {
            this.highestScrollProgress = currentScrollProgress;
            this.requirements.contentProgress = this.highestScrollProgress;
            
            this.updateProgressDisplay();
            
            if (this.debug) {
                this.log(`Scroll progress updated: ${this.highestScrollProgress.toFixed(1)}%`);
            }
            
            this.saveProgress();
        }
    }
    
    /**
     * Find where the reading content ends
     */
    findContentEnd() {
        const selectors = [
            '.content-section',
            '.lesson-content',
            '#content',
            '.quiz-container',
            '#quizContainer',
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                if (selector.includes('quiz')) {
                    const prevElement = element.previousElementSibling;
                    if (prevElement) {
                        if (this.debug) {
                            this.log(`Content end found before ${selector}`);
                        }
                        return prevElement;
                    }
                } else {
                    if (this.debug) {
                        this.log(`Content end found at end of ${selector}`);
                    }
                    return element;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleAnswerClick(e));
        });
        
        this.setupScrollTracking();
        
        this.log('Event listeners setup complete');
    }
    
    /**
     * Set up scroll tracking
     */
    setupScrollTracking() {
        let scrollTimeout;
        
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackScrollProgress();
            }, 100);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.trackScrollProgress();
            }, 100);
        });
        
        this.log('Scroll tracking enabled');
    }
    
    /**
     * Update progress display
     */
    updateProgressDisplay() {
        const progressBar = document.getElementById('progressBar') || document.querySelector('.progress-bar-fill');
        if (progressBar) {
            progressBar.style.width = this.requirements.contentProgress + '%';
        }
        
        this.updateBottomBarStatus();
        
        window.dispatchEvent(new CustomEvent('lessonProgressUpdated', {
            detail: {
                contentProgress: this.requirements.contentProgress,
                quizState: this.quizState,
                lessonId: this.lessonId
            }
        }));
    }
    
    /**
     * Update bottom bar status
     */
    updateBottomBarStatus() {
        const readingIcon = document.getElementById('readingIcon');
        const readingText = readingIcon?.nextElementSibling;
        const quizIcon = document.getElementById('quizIcon');
        const quizText = quizIcon?.nextElementSibling;
        
        if (readingIcon && readingText) {
            if (this.requirements.contentProgress >= 90) {
                readingIcon.classList.remove('incomplete');
                readingIcon.classList.add('complete');
                readingText.textContent = 'Reading Complete';
            } else {
                readingIcon.classList.remove('complete');
                readingIcon.classList.add('incomplete');
                readingText.textContent = 'Reading Incomplete';
            }
        }
        
        if (quizIcon && quizText) {
            quizIcon.className = 'requirement-icon';
            
            switch (this.quizState) {
                case 'not-started':
                    quizIcon.classList.add('incomplete');
                    quizText.textContent = 'Quiz Not Started';
                    break;
                case 'in-progress':
                    quizIcon.classList.add('in-progress');
                    quizText.textContent = 'Quiz In Progress';
                    break;
                case 'failed':
                    quizIcon.classList.add('failed');
                    quizText.textContent = 'Quiz Failed - Try Again';
                    break;
                case 'passed':
                    quizIcon.classList.add('complete');
                    quizText.textContent = 'Quiz Passed';
                    break;
            }
        }
    }
    
    /**
     * Handle answer clicks
     */
    handleAnswerClick(event) {
        if (this.quizState === 'passed') return;
        
        if (this.quizState === 'not-started') {
            this.quizState = 'in-progress';
            this.updateProgressDisplay();
        }
        
        const option = event.target;
        const question = option.closest('.question-block');
        
        question.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        option.classList.add('selected');
        
        const questionIndex = Array.from(document.querySelectorAll('.question-block')).indexOf(question);
        this.selectedAnswers[questionIndex] = option.getAttribute('data-answer');
        
        this.log('Answer selected:', questionIndex, this.selectedAnswers[questionIndex]);
    }
    
    /**
     * Check quiz answers
     */
    checkAnswers() {
        const questions = document.querySelectorAll('.question-block');
        let correctCount = 0;
        
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
            
            const correctOption = question.querySelector(`[data-answer="${correctAnswer}"]`);
            if (correctOption && !correctOption.classList.contains('correct')) {
                correctOption.classList.add('correct');
            }
        });
        
        const feedback = document.getElementById('quizFeedback');
        const scorePercentage = Math.round((correctCount / questions.length) * 100);
        const passed = scorePercentage >= this.quizConfig.passingScore;
        
        if (passed) {
            this.quizState = 'passed';
            this.requirements.quizPassed = true;
            this.setQuizState('completed');
            this.notifyCompletion();
            
            if (feedback) {
                feedback.className = 'quiz-feedback success show';
                if (scorePercentage === 100) {
                    feedback.textContent = `🎉 Perfect! All ${correctCount} answers correct.`;
                } else {
                    feedback.textContent = `🎉 Great job! You scored ${scorePercentage}% (${correctCount}/${questions.length} correct).`;
                }
            }
            
            if (this.quizConfig.showCelebration) {
                this.showCelebration(scorePercentage);
            }
        } else {
            this.quizState = 'failed';
            this.requirements.quizPassed = false;
            this.setQuizState('review');
            this.notifyReset();
            
            if (feedback) {
                feedback.className = 'quiz-feedback error show';
                feedback.textContent = `You scored ${scorePercentage}% (${correctCount}/${questions.length} correct). You need ${this.quizConfig.passingScore}% to pass. Try again!`;
            }
        }
        
        this.updateProgressDisplay();
        this.saveProgress();
        
        this.log('Quiz checked:', { correctCount, total: questions.length, scorePercentage, passed });
    }
    
    /**
     * Reset quiz
     */
    resetQuiz() {
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
        });
        
        const feedback = document.getElementById('quizFeedback');
        if (feedback) feedback.classList.remove('show');
        
        const completionSection = document.getElementById('completionSection');
        if (completionSection) completionSection.classList.remove('show');
        
        this.selectedAnswers = {};
        this.requirements.quizPassed = false;
        this.quizState = 'not-started';
        this.setQuizState('active');
        
        this.updateProgressDisplay();
        this.saveProgress();
        this.notifyReset();
        
        this.log('Quiz reset');
    }
    
    // Utility methods
    
    getLessonId() {
        const urlParams = new URLSearchParams(window.location.search);
        const paramLessonId = urlParams.get('lesson_id');
        if (paramLessonId) return paramLessonId;
        
        const parentUrl = document.referrer;
        const match = parentUrl.match(/lessons\/(\d+)/);
        if (match) return match[1];
        
        const title = document.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return title || 'default-lesson';
    }
    
    declareLessonRequirements() {
        if (window.parent !== window) {
            // Determine if completion is required
            // No quiz = no completion requirement
            // Has quiz but already passed = already completed
            const requiresCompletion = this.hasQuiz;
            const alreadyCompleted = this.hasQuiz && this.requirements.quizPassed;
            
            window.parent.postMessage({
                type: 'lesson_requirements',
                lesson: this.lessonId,
                requires_completion: requiresCompletion,
                already_completed: alreadyCompleted,
                has_quiz: this.hasQuiz,
                requirements: { quiz: this.hasQuiz, content: true }
            }, '*');
            
            this.log('Declared lesson requirements to parent', {
                has_quiz: this.hasQuiz,
                requires_completion: requiresCompletion,
                already_completed: alreadyCompleted
            });
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem(`lesson_${this.lessonId}_progress`);
            if (saved) {
                const progress = JSON.parse(saved);
                this.requirements = { ...this.requirements, ...progress.requirements };
                this.quizState = progress.quizState || 'not-started';
                
                this.highestScrollProgress = progress.highestScrollProgress || this.requirements.contentProgress || 0;
                this.requirements.contentProgress = this.highestScrollProgress;
                
                this.updateProgressDisplay();
                
                if (this.requirements.quizPassed) {
                    this.setQuizState('completed');
                }
                
                this.log('Progress loaded:', this.requirements, 'Quiz passed:', this.requirements.quizPassed);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
    
    saveProgress() {
        try {
            const progress = {
                requirements: this.requirements,
                quizState: this.quizState,
                highestScrollProgress: this.highestScrollProgress,
                timestamp: new Date().toISOString(),
                selectedAnswers: this.selectedAnswers
            };
            localStorage.setItem(`lesson_${this.lessonId}_progress`, JSON.stringify(progress));
            this.log('Progress saved');
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    setQuizState(state) {
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
    
    log(...args) {
        if (this.debug || window.location.hostname === 'localhost') {
            console.log('[LessonManager]', ...args);
        }
    }
    
    showCelebration(score = 100) {
        let overlay = document.getElementById('celebrationOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'celebrationOverlay';
            overlay.className = 'celebration-overlay';
            
            const messages = [
                { icon: '🎉', title: 'Outstanding!', message: 'You\'ve completed this lesson!' },
                { icon: '⭐', title: 'Excellent Work!', message: 'Your knowledge is growing stronger!' },
                { icon: '🚀', title: 'Amazing Progress!', message: 'You\'re on fire today!' },
                { icon: '💎', title: 'Brilliant!', message: 'You\'ve earned your mastery!' },
                { icon: '🏆', title: 'Champion!', message: 'Another lesson conquered!' }
            ];
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            overlay.innerHTML = `
                <div class="celebration-content">
                    <div class="celebration-icon">${randomMessage.icon}</div>
                    <div class="celebration-title">${randomMessage.title}</div>
                    <div class="celebration-message">${randomMessage.message}</div>
                    <div class="celebration-score">Score: ${score}%</div>
                </div>
            `;
            
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'celebration-confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 2 + 's';
                overlay.appendChild(confetti);
            }
            
            document.body.appendChild(overlay);
        }
        
        overlay.classList.add('show');
        
        setTimeout(() => {
            overlay.classList.remove('show');
        }, 3000);
        
        this.log('Celebration shown for score:', score + '%');
    }
    
    getAnalytics() {
        return {
            lessonId: this.lessonId,
            contentProgress: this.requirements.contentProgress,
            highestScrollProgress: this.highestScrollProgress,
            quizPassed: this.requirements.quizPassed,
            quizState: this.quizState,
            quizConfig: this.quizConfig,
            timestamp: new Date().toISOString()
        };
    }
}

window.LessonManager = LessonManager;