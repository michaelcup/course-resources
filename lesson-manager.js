/**
 * DEBUG VERSION - Thinkific Multimedia Lesson Manager v2.2
 * Enhanced with extensive debugging to identify scroll tracking issues
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
        this.debug = true; // FORCE DEBUG ON FOR TROUBLESHOOTING
        
        // Media tracking
        this.mediaElement = null;
        this.mediaDuration = 0;
        this.mediaWatched = 0;
        this.hasMedia = false;
        
        // Debug counters
        this.scrollEventCount = 0;
        this.trackContentCallCount = 0;
        this.progressUpdateCount = 0;
        
        this.init();
    }
    
    /**
     * Initialize the lesson manager
     */
    init() {
        console.log('🚀 [DEBUG] Initializing lesson manager for:', this.lessonId);
        
        this.setupEventListeners();
        this.setupMediaTracking();
        this.loadProgress();
        this.declareLessonRequirements();
        this.trackContent();
        
        console.log('✅ [DEBUG] Lesson manager initialized successfully');
        
        // Debug info about current state
        setTimeout(() => {
            console.log('📊 [DEBUG] Initial state check:');
            console.log('- Has media:', this.hasMedia);
            console.log('- Scroll height:', document.documentElement.scrollHeight);
            console.log('- Window height:', window.innerHeight);
            console.log('- Current scroll:', window.scrollY);
            console.log('- Content progress:', this.requirements.contentProgress);
        }, 1000);
    }
    
    /**
     * Set up media tracking for video/audio elements
     */
    setupMediaTracking() {
        // Look for video or audio elements
        this.mediaElement = document.querySelector('video, audio');
        
        if (this.mediaElement) {
            this.hasMedia = true;
            console.log('🎥 [DEBUG] Media element found:', this.mediaElement.tagName);
            
            this.mediaElement.addEventListener('loadedmetadata', () => {
                this.mediaDuration = this.mediaElement.duration;
                console.log('⏱️ [DEBUG] Media duration:', this.mediaDuration);
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
            console.log('📖 [DEBUG] No media element found - using scroll tracking');
        }
    }
    
    /**
     * Track content progress (reading + media)
     */
    trackContent() {
        this.trackContentCallCount++;
        
        let contentProgress = 0;
        
        if (this.hasMedia && this.mediaDuration > 0) {
            // If there's media, progress is based on media consumption
            contentProgress = Math.min(100, Math.round((this.mediaWatched / this.mediaDuration) * 100));
            console.log(`🎥 [DEBUG] Media progress: ${contentProgress}% (${this.mediaWatched}/${this.mediaDuration}s)`);
        } else {
            // No media, use scroll-based reading progress
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.scrollY;
            
            console.log(`📏 [DEBUG] Scroll calculation:
                - Document scroll height: ${document.documentElement.scrollHeight}
                - Window inner height: ${window.innerHeight}
                - Scrollable area: ${scrollHeight}
                - Current scroll: ${scrolled}`);
            
            if (scrollHeight > 0) {
                contentProgress = Math.min(100, Math.round((scrolled / scrollHeight) * 100));
                console.log(`📊 [DEBUG] Calculated scroll progress: ${contentProgress}%`);
            } else {
                console.log('⚠️ [DEBUG] No scrollable content (scrollHeight <= 0)');
                contentProgress = 0;
            }
        }
        
        // Only update if progress increased
        if (contentProgress > this.requirements.contentProgress) {
            console.log(`⬆️ [DEBUG] Progress increased from ${this.requirements.contentProgress}% to ${contentProgress}%`);
            this.requirements.contentProgress = contentProgress;
            this.updateProgressDisplay();
        } else if (contentProgress < this.requirements.contentProgress) {
            console.log(`⬇️ [DEBUG] Progress would decrease from ${this.requirements.contentProgress}% to ${contentProgress}% - not updating`);
        } else {
            console.log(`➡️ [DEBUG] Progress unchanged at ${contentProgress}%`);
        }
        
        console.log(`📈 [DEBUG] trackContent called ${this.trackContentCallCount} times`);
        
        // Throttled save to avoid excessive localStorage writes
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveProgress(), 1000);
    }
    
    /**
     * Set up event listeners for interactions
     */
    setupEventListeners() {
        // Answer option clicks
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleAnswerClick(e));
        });
        
        // Scroll tracking for lessons without media
        this.setupScrollTracking();
        
        console.log('🎯 [DEBUG] Event listeners setup complete');
    }
    
    /**
     * Set up scroll tracking with extensive debugging
     */
    setupScrollTracking() {
        console.log('🎯 [DEBUG] Setting up scroll tracking...');
        
        let scrollTimeout;
        let lastScrollY = window.scrollY;
        
        const handleScroll = () => {
            this.scrollEventCount++;
            const currentScrollY = window.scrollY;
            
            console.log(`📜 [DEBUG] Scroll event #${this.scrollEventCount}: ${lastScrollY} → ${currentScrollY}`);
            
            // Check if we should skip (media playing)
            if (this.hasMedia && this.mediaElement && !this.mediaElement.paused) {
                console.log('⏸️ [DEBUG] Skipping scroll tracking - media is playing');
                return;
            }
            
            // Only update if scroll position changed
            if (currentScrollY !== lastScrollY) {
                console.log(`🔄 [DEBUG] Scroll position changed, setting timeout to track content`);
                lastScrollY = currentScrollY;
                
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    console.log('⏰ [DEBUG] Scroll timeout triggered, calling trackContent()');
                    this.trackContent();
                }, 100);
            } else {
                console.log('➡️ [DEBUG] Scroll position unchanged');
            }
        };
        
        // Test if scroll event fires at all
        window.addEventListener('scroll', () => {
            console.log('🔥 [DEBUG] RAW scroll event fired');
        }, { passive: true, once: true });
        
        // Main scroll listener
        window.addEventListener('scroll', handleScroll, { passive: true });
        console.log('👂 [DEBUG] Scroll event listener attached');
        
        // Also track on resize
        window.addEventListener('resize', () => {
            console.log('📐 [DEBUG] Window resized, recalculating content');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackContent();
            }, 250);
        });
        
        // Test scroll manually
        setTimeout(() => {
            console.log('🧪 [DEBUG] Testing manual scroll tracking...');
            this.trackContent();
        }, 500);
        
        // Force a scroll event to test
        setTimeout(() => {
            console.log('🧪 [DEBUG] Forcing scroll event test...');
            const currentScroll = window.scrollY;
            window.scrollTo(0, currentScroll + 1);
            setTimeout(() => window.scrollTo(0, currentScroll), 100);
        }, 2000);
        
        console.log('✅ [DEBUG] Scroll tracking setup complete');
    }
    
    /**
     * Update all progress displays with enhanced debugging
     */
    updateProgressDisplay() {
        this.progressUpdateCount++;
        console.log(`🎨 [DEBUG] updateProgressDisplay called (${this.progressUpdateCount} times)`);
        
        // Update main progress bar (multiple possible selectors for compatibility)
        const progressSelectors = ['#progressBar', '.progress-bar-fill', '[data-progress-bar]'];
        let progressBarEl = null;
        
        console.log('🔍 [DEBUG] Looking for progress bar element...');
        for (const selector of progressSelectors) {
            progressBarEl = document.querySelector(selector);
            if (progressBarEl) {
                console.log(`✅ [DEBUG] Found progress bar with selector: ${selector}`);
                break;
            } else {
                console.log(`❌ [DEBUG] No element found for selector: ${selector}`);
            }
        }
        
        if (progressBarEl) {
            const newWidth = this.requirements.contentProgress + '%';
            const oldWidth = progressBarEl.style.width;
            progressBarEl.style.width = newWidth;
            console.log(`🎨 [DEBUG] Updated progress bar: ${oldWidth} → ${newWidth}`);
        } else {
            console.log('⚠️ [DEBUG] Progress bar element not found with any selector');
            console.log('📋 [DEBUG] Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => `#${el.id}`));
        }
        
        // Update bottom bar with dynamic status
        this.updateBottomBarStatus();
        
        // Dispatch custom event for modular UI integration
        window.dispatchEvent(new CustomEvent('lessonProgressUpdated', {
            detail: {
                contentProgress: this.requirements.contentProgress,
                quizState: this.quizState,
                hasMedia: this.hasMedia,
                lessonId: this.lessonId
            }
        }));
        
        console.log('📡 [DEBUG] Dispatched lessonProgressUpdated event');
    }
    
    /**
     * Update bottom bar with dynamic status indicators
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
        
        // Update quiz status with enhanced states
        if (quizIcon && quizText) {
            quizIcon.className = 'requirement-icon'; // Reset classes
            
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
     * Handle answer option clicks
     */
    handleAnswerClick(event) {
        if (this.quizState === 'passed') return; // Don't allow changes after passing
        
        // Set quiz to in-progress on first interaction
        if (this.quizState === 'not-started') {
            this.quizState = 'in-progress';
            this.updateProgressDisplay();
        }
        
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
        
        console.log('📝 [DEBUG] Answer selected:', questionIndex, this.selectedAnswers[questionIndex]);
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
        
        // Update quiz state and show feedback
        const feedback = document.getElementById('quizFeedback');
        const allCorrect = correctCount === questions.length;
        
        if (allCorrect) {
            this.quizState = 'passed';
            this.requirements.quizPassed = true;
            this.setQuizState('completed');
            this.notifyCompletion();
            
            if (feedback) {
                feedback.className = 'quiz-feedback success show';
                feedback.textContent = `🎉 Perfect! All ${correctCount} answers correct. Review your answers above or retake the quiz.`;
            }
        } else {
            this.quizState = 'failed';
            this.requirements.quizPassed = false;
            this.setQuizState('review');
            this.notifyReset();
            
            if (feedback) {
                feedback.className = 'quiz-feedback error show';
                feedback.textContent = `You got ${correctCount} out of ${questions.length} correct. Review the answers above and click "Reset Quiz" to try again.`;
            }
        }
        
        this.updateProgressDisplay();
        this.saveProgress();
        
        console.log('✅ [DEBUG] Quiz checked:', { correctCount, total: questions.length, passed: allCorrect });
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
        this.quizState = 'not-started';
        this.setQuizState('active');
        
        // Update display
        this.updateProgressDisplay();
        this.saveProgress();
        
        // Notify parent of reset
        this.notifyReset();
        
        console.log('🔄 [DEBUG] Quiz reset');
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
    
    declareLessonRequirements() {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'lesson_requirements',
                lesson: this.lessonId,
                requires_completion: true,
                requirements: {
                    quiz: true,
                    content: true
                }
            }, '*');
            
            console.log('📢 [DEBUG] Declared lesson requirements to parent');
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
                
                console.log('💾 [DEBUG] Progress loaded:', this.requirements);
            }
        } catch (error) {
            console.error('❌ [DEBUG] Error loading progress:', error);
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
            console.log('💾 [DEBUG] Progress saved');
        } catch (error) {
            console.error('❌ [DEBUG] Error saving progress:', error);
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
        
        console.log('🎯 [DEBUG] Quiz display state changed to:', state);
    }
    
    notifyCompletion() {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'lesson_complete',
                lesson: this.lessonId,
                score: 100,
                timestamp: new Date().toISOString()
            }, '*');
            
            console.log('📢 [DEBUG] Sent completion message to parent');
        }
    }
    
    notifyReset() {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'lesson_reset',
                lesson: this.lessonId,
                timestamp: new Date().toISOString()
            }, '*');
            
            console.log('📢 [DEBUG] Sent reset message to parent');
        }
    }
    
    log(...args) {
        console.log('[LessonManager]', ...args);
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