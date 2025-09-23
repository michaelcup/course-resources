/**
 * Thinkific Multimedia Lesson Manager v2.4
 * Working version with both video and scroll tracking + linear progress
 */

class LessonManager {
    constructor(options = {}) {
        this.requirements = {
            contentProgress: 0,  // 0-100% based on reading/media consumption
            quizPassed: false
        };
        
        this.selectedAnswers = {};
        this.lessonId = options.lessonId || this.getLessonId();
        this.quizState = 'not-started'; // 'not-started', 'in-progress', 'failed', 'passed'
        this.debug = options.debug || false;
        
        // Media tracking
        this.mediaElement = null;
        this.mediaDuration = 0;
        this.mediaWatched = 0;
        this.hasMedia = false;
        
        // Content end detection cache
        this.contentEndElement = null;
        this.contentEndCalculated = false;
        
        this.init();
    }
    
    /**
     * Initialize the lesson manager
     */
    init() {
        this.log('Initializing lesson manager for:', this.lessonId);
        
        this.setupMediaTracking();
        this.setupEventListeners();
        this.loadProgress();
        this.declareLessonRequirements();
        
        // Initial content tracking after everything is set up
        setTimeout(() => {
            this.trackContent();
        }, 100);
        
        this.log('Lesson manager initialized successfully');
    }
    
    /**
     * Set up media tracking for video/audio elements
     */
    setupMediaTracking() {
        // Look for video or audio elements
        this.mediaElement = document.querySelector('video, audio');
        
        if (this.mediaElement) {
            this.hasMedia = true;
            this.log('Media element found:', this.mediaElement.tagName);
            
            this.mediaElement.addEventListener('loadedmetadata', () => {
                this.mediaDuration = this.mediaElement.duration;
                this.log('Media duration:', this.mediaDuration);
                this.trackContent(); // Update progress when duration is known
            });
            
            this.mediaElement.addEventListener('timeupdate', () => {
                if (this.mediaDuration > 0) {
                    this.mediaWatched = Math.max(this.mediaWatched, this.mediaElement.currentTime);
                    this.trackContent();
                }
            });
            
            this.mediaElement.addEventListener('ended', () => {
                this.mediaWatched = this.mediaDuration;
                this.trackContent();
            });
        } else {
            this.log('No media element found - using scroll tracking only');
        }
    }
    
    /**
     * Find where the reading content ends (cached for performance)
     */
    findContentEndElement() {
        if (this.contentEndCalculated) {
            return this.contentEndElement;
        }
        
        // Look for content end markers in order of preference
        const selectors = [
            '.content-section',
            '.lesson-content', 
            '#content',
            '.quiz-container',
            '#quizContainer',
            '.interactive-section'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                // If it's a quiz/interactive element, use the previous sibling
                if (selector.includes('quiz') || selector.includes('interactive')) {
                    const prevElement = element.previousElementSibling;
                    if (prevElement) {
                        this.contentEndElement = prevElement;
                        this.contentEndCalculated = true;
                        this.log('Content end found before', selector, ':', prevElement.tagName);
                        return this.contentEndElement;
                    }
                }
                
                // For content sections, use the element itself
                this.contentEndElement = element;
                this.contentEndCalculated = true;
                this.log('Content end found at', selector, ':', element.tagName);
                return this.contentEndElement;
            }
        }
        
        this.contentEndCalculated = true;
        this.log('No specific content end found, using full document');
        return null;
    }
    
    /**
     * Track content progress - linear progress based on media AND scroll
     */
    trackContent() {
        let mediaProgress = 0;
        let scrollProgress = 0;
        
        // Calculate media progress
        if (this.hasMedia && this.mediaDuration > 0) {
            mediaProgress = Math.min(100, (this.mediaWatched / this.mediaDuration) * 100);
        }
        
        // Calculate scroll progress
        const contentEnd = this.findContentEndElement();
        if (contentEnd) {
            // Calculate based on content end
            const contentEndRect = contentEnd.getBoundingClientRect();
            const contentEndTop = contentEnd.offsetTop + contentEnd.offsetHeight;
            const scrolled = window.scrollY;
            const windowHeight = window.innerHeight;
            
            // How much we need to scroll to see the end of content
            const scrollNeeded = Math.max(0, contentEndTop - windowHeight);
            
            if (scrollNeeded > 0) {
                scrollProgress = Math.min(100, (scrolled / scrollNeeded) * 100);
            } else {
                // Content fits in viewport, progress based on any scrolling
                scrollProgress = scrolled > 10 ? 100 : 0;
            }
        } else {
            // Fallback: use full document
            const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
            if (totalScrollable > 0) {
                scrollProgress = Math.min(100, (window.scrollY / totalScrollable) * 100);
            }
        }
        
        // Take maximum of both progresses for linear advancement
        const newProgress = Math.max(mediaProgress, scrollProgress);
        
        // Always update progress (linear), don't require it to increase
        if (Math.abs(newProgress - this.requirements.contentProgress) > 0.5) {
            this.requirements.contentProgress = newProgress;
            this.updateProgressDisplay();
            
            if (this.debug) {
                this.log(`Progress updated: ${newProgress.toFixed(1)}% (media: ${mediaProgress.toFixed(1)}%, scroll: ${scrollProgress.toFixed(1)}%)`);
            }
        }
        
        // Throttled save
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveProgress(), 1000);
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Quiz answer clicks
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleAnswerClick(e));
        });
        
        // Scroll tracking
        this.setupScrollTracking();
        
        this.log('Event listeners setup complete');
    }
    
    /**
     * Set up scroll tracking
     */
    setupScrollTracking() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.trackContent();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // Smooth scroll tracking using requestAnimationFrame
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Track on resize too
        window.addEventListener('resize', () => {
            // Reset content end calculation on resize
            this.contentEndCalculated = false;
            this.contentEndElement = null;
            
            setTimeout(() => {
                this.trackContent();
            }, 100);
        });
        
        this.log('Scroll tracking enabled');
    }
    
    /**
     * Update progress display
     */
    updateProgressDisplay() {
        // Update progress bar
        const progressBar = document.getElementById('progressBar') || document.querySelector('.progress-bar-fill');
        if (progressBar) {
            progressBar.style.width = this.requirements.contentProgress + '%';
        }
        
        // Update status indicators
        this.updateBottomBarStatus();
        
        // Dispatch event for modular UI
        window.dispatchEvent(new CustomEvent('lessonProgressUpdated', {
            detail: {
                contentProgress: this.requirements.contentProgress,
                quizState: this.quizState,
                hasMedia: this.hasMedia,
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
        
        // Update reading/content status
        if (readingIcon && readingText) {
            if (this.requirements.contentProgress >= 90) {
                readingIcon.classList.remove('incomplete');
                readingIcon.classList.add('complete');
                readingText.textContent = this.hasMedia ? 'Media Complete' : 'Reading Complete';
            } else {
                readingIcon.classList.remove('complete');
                readingIcon.classList.add('incomplete');
                readingText.textContent = this.hasMedia ? 'Media Incomplete' : 'Reading Incomplete';
            }
        }
        
        // Update quiz status
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
        const allCorrect = correctCount === questions.length;
        
        if (allCorrect) {
            this.quizState = 'passed';
            this.requirements.quizPassed = true;
            this.setQuizState('completed');
            this.notifyCompletion();
            
            if (feedback) {
                feedback.className = 'quiz-feedback success show';
                feedback.textContent = `🎉 Perfect! All ${correctCount} answers correct.`;
            }
        } else {
            this.quizState = 'failed';
            this.requirements.quizPassed = false;
            this.setQuizState('review');
            this.notifyReset();
            
            if (feedback) {
                feedback.className = 'quiz-feedback error show';
                feedback.textContent = `You got ${correctCount} out of ${questions.length} correct. Try again!`;
            }
        }
        
        this.updateProgressDisplay();
        this.saveProgress();
        
        this.log('Quiz checked:', { correctCount, total: questions.length, passed: allCorrect });
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
    
    // Utility methods (keeping these simple)
    
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
            window.parent.postMessage({
                type: 'lesson_requirements',
                lesson: this.lessonId,
                requires_completion: true,
                requirements: { quiz: true, content: true }
            }, '*');
            
            this.log('Declared lesson requirements to parent');
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem(`lesson_${this.lessonId}_progress`);
            if (saved) {
                const progress = JSON.parse(saved);
                this.requirements = { ...this.requirements, ...progress.requirements };
                this.quizState = progress.quizState || 'not-started';
                this.mediaWatched = progress.mediaWatched || 0;
                
                this.updateProgressDisplay();
                
                if (this.requirements.quizPassed) {
                    this.setQuizState('completed');
                }
                
                this.log('Progress loaded:', this.requirements);
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
                timestamp: new Date().toISOString(),
                selectedAnswers: this.selectedAnswers,
                mediaWatched: this.mediaWatched
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
    
    getAnalytics() {
        return {
            lessonId: this.lessonId,
            contentProgress: this.requirements.contentProgress,
            quizPassed: this.requirements.quizPassed,
            quizState: this.quizState,
            hasMedia: this.hasMedia,
            mediaWatched: this.mediaWatched,
            mediaDuration: this.mediaDuration,
            timestamp: new Date().toISOString()
        };
    }
}

// Export for use in other modules or global scope
window.LessonManager = LessonManager;