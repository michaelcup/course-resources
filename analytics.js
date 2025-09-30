/**
 * Google Analytics 4 Integration for Thinkific Lessons
 * Client-side analytics tracking with no server required
 * Version 1.0
 * 
 * Add to your CDN and include in master-template.html
 */

class LessonAnalytics {
  constructor(config = {}) {
    this.config = {
      measurementId: config.measurementId || 'G-EQFRQG4TEC', // Replace with your GA4 ID
      debug: config.debug || false,
      ...config
    };
    
    this.lessonId = this.getLessonId();
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.isCompleted = false;
    this.questionTimestamps = {};
    
    this.init();
  }
  
  init() {
    // Load GA4 script
    this.loadGA4Script();
    
    // Track session start
    this.trackLessonStart();
    
    // Set up automatic tracking
    this.setupAutoTracking();
    
    if (this.config.debug) {
      console.log('[Analytics] Initialized', {
        lessonId: this.lessonId,
        sessionId: this.sessionId
      });
    }
  }
  
  loadGA4Script() {
    // Check if already loaded
    if (window.gtag) {
      this.initializeGA4();
      return;
    }
    
    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;
    script.onload = () => this.initializeGA4();
    document.head.appendChild(script);
  }
  
  initializeGA4() {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', this.config.measurementId, {
      'custom_map': {
        'dimension1': 'lesson_id',
        'dimension2': 'session_id',
        'dimension3': 'lesson_version'
      },
      'send_page_view': false // We'll send manually
    });
    
    // Send initial page view
    this.trackPageView();
  }
  
  trackEvent(eventName, params = {}) {
    if (!window.gtag) {
      if (this.config.debug) {
        console.warn('[Analytics] gtag not ready, queuing event:', eventName);
      }
      return;
    }
    
    const eventData = {
      lesson_id: this.lessonId,
      session_id: this.sessionId,
      lesson_version: this.getScriptsVersion(),
      ...params
    };
    
    window.gtag('event', eventName, eventData);
    
    if (this.config.debug) {
      console.log('[Analytics] Event:', eventName, eventData);
    }
    
    // Also store locally for potential batch reporting
    this.storeEventLocally(eventName, eventData);
  }
  
  trackPageView() {
    this.trackEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
  }
  
  trackLessonStart() {
    this.trackEvent('lesson_start', {
      timestamp: this.startTime
    });
  }
  
  trackScrollProgress(percentage) {
    // Only track milestones
    const milestones = [25, 50, 75, 100];
    const milestone = milestones.find(m => 
      Math.abs(percentage - m) < 1 && 
      !this[`tracked_scroll_${m}`]
    );
    
    if (milestone) {
      this[`tracked_scroll_${milestone}`] = true;
      this.trackEvent('scroll_progress', {
        percentage: milestone,
        time_to_milestone: Date.now() - this.startTime
      });
    }
  }
  
  trackQuizStart() {
    this.quizStartTime = Date.now();
    this.trackEvent('quiz_start', {
      time_to_quiz: this.quizStartTime - this.startTime
    });
  }
  
  trackQuestionViewed(questionIndex) {
    if (!this.questionTimestamps[questionIndex]) {
      this.questionTimestamps[questionIndex] = Date.now();
    }
  }
  
  trackQuizAnswer(questionIndex, selectedAnswer, correct) {
    const questionStartTime = this.questionTimestamps[questionIndex];
    const timeSpent = questionStartTime ? Date.now() - questionStartTime : 0;
    
    this.trackEvent('quiz_answer', {
      question_number: questionIndex + 1,
      correct: correct,
      time_spent_ms: timeSpent,
      selected_answer: selectedAnswer
    });
  }
  
  trackQuizComplete(score, totalQuestions, attempts = 1) {
    const timeToComplete = Date.now() - (this.quizStartTime || this.startTime);
    
    this.trackEvent('quiz_complete', {
      score_percentage: score,
      total_questions: totalQuestions,
      correct_answers: Math.round((score / 100) * totalQuestions),
      attempts: attempts,
      time_to_complete_ms: timeToComplete,
      passed: score >= 80
    });
  }
  
  trackLessonComplete(score) {
    this.isCompleted = true;
    const totalTime = Date.now() - this.startTime;
    
    this.trackEvent('lesson_complete', {
      score_percentage: score,
      total_time_ms: totalTime,
      total_time_minutes: Math.round(totalTime / 60000)
    });
  }
  
  trackVideoEvent(action, currentTime, duration) {
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    this.trackEvent('video_interaction', {
      action: action, // 'play', 'pause', 'seek', 'ended'
      current_time_seconds: Math.round(currentTime),
      duration_seconds: Math.round(duration),
      progress_percentage: Math.round(progressPercentage)
    });
  }
  
  trackPDFDownload(filename) {
    this.trackEvent('pdf_download', {
      filename: filename
    });
  }
  
  trackThemeToggle(theme) {
    this.trackEvent('theme_change', {
      theme: theme
    });
  }
  
  trackZoomChange(zoomLevel) {
    this.trackEvent('zoom_change', {
      zoom_level: zoomLevel
    });
  }
  
  setupAutoTracking() {
    // Track page abandonment
    window.addEventListener('beforeunload', () => {
      if (!this.isCompleted) {
        this.trackEvent('lesson_abandoned', {
          time_spent_ms: Date.now() - this.startTime
        });
      }
    });
    
    // Track visibility changes (tab switching)
    let lastVisibilityChange = Date.now();
    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      const timeAway = now - lastVisibilityChange;
      
      if (document.hidden) {
        this.trackEvent('page_hidden', {
          time_spent_visible_ms: timeAway
        });
      } else {
        this.trackEvent('page_visible', {
          time_spent_hidden_ms: timeAway
        });
      }
      
      lastVisibilityChange = now;
    });
    
    // Track errors
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', {
        error_message: event.message,
        error_file: event.filename,
        error_line: event.lineno
      });
    });
  }
  
  getLessonId() {
    // Try to get from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('lesson_id');
    if (paramId) return paramId;
    
    // Try to get from referrer
    const referrer = document.referrer;
    const match = referrer.match(/lessons\/(\d+)/);
    if (match) return match[1];
    
    // Fallback to page title
    return document.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  getScriptsVersion() {
    if (typeof SCRIPTS_VERSION !== 'undefined') {
      return SCRIPTS_VERSION;
    }
    return 'unknown';
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  storeEventLocally(eventName, eventData) {
    try {
      const key = `analytics_${this.lessonId}`;
      let events = JSON.parse(localStorage.getItem(key) || '[]');
      
      events.push({
        event: eventName,
        timestamp: Date.now(),
        ...eventData
      });
      
      // Keep last 100 events
      if (events.length > 100) {
        events = events.slice(-100);
      }
      
      localStorage.setItem(key, JSON.stringify(events));
    } catch (error) {
      // Silently fail if localStorage is not available
      if (this.config.debug) {
        console.warn('[Analytics] Could not store event locally:', error);
      }
    }
  }
  
  getStoredEvents() {
    try {
      const key = `analytics_${this.lessonId}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      return [];
    }
  }
  
  clearStoredEvents() {
    try {
      const key = `analytics_${this.lessonId}`;
      localStorage.removeItem(key);
    } catch (error) {
      // Silently fail
    }
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.lessonAnalytics = new LessonAnalytics({
        measurementId: 'G-XXXXXXXXXX', // TODO: Replace with your GA4 ID
        debug: window.location.hostname === 'localhost'
      });
    });
  } else {
    window.lessonAnalytics = new LessonAnalytics({
      measurementId: 'G-XXXXXXXXXX', // TODO: Replace with your GA4 ID
      debug: window.location.hostname === 'localhost'
    });
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LessonAnalytics;
}