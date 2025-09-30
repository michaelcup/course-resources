class MobileEnhancements {
  constructor(config = {}) {
    this.config = {
      enableSwipeNavigation: config.enableSwipeNavigation !== false,
      enableVideoOptimizations: config.enableVideoOptimizations !== false,
      enableTouchOptimizations: config.enableTouchOptimizations !== false,
      debug: config.debug || false,
      ...config
    };
    
    this.isMobile = this.detectMobile();
    this.isTouch = 'ontouchstart' in window;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (this.isMobile || this.isTouch) {
      this.init();
    }
  }
  
  init() {
    if (this.config.debug) {
      console.log('[Mobile] Initializing enhancements', {
        isMobile: this.isMobile,
        isTouch: this.isTouch,
        isStandalone: this.isStandalone
      });
    }
    
    if (this.config.enableVideoOptimizations) {
      this.optimizeVideos();
    }
    
    if (this.config.enableTouchOptimizations) {
      this.improveTouchTargets();
    }
    
    if (this.config.enableSwipeNavigation) {
      this.enableSwipeNavigation();
    }
    
    this.handleOrientationChanges();
    this.optimizeNetworkUsage();
    this.preventUnwantedZoom();
    this.addMobileUtilities();
  }
  
  detectMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android', 'webos', 'iphone', 'ipad', 'ipod',
      'blackberry', 'windows phone', 'mobile'
    ];
    
    return mobileKeywords.some(keyword => userAgent.includes(keyword));
  }
  
  optimizeVideos() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach((video, index) => {
      // Disable autoplay on mobile
      video.autoplay = false;
      video.playsInline = true; // iOS requirement
      
      // Add unique ID if not present
      if (!video.id) {
        video.id = `video-${index}`;
      }
      
      // Save and restore playback position
      const savedPosition = localStorage.getItem(`video_${video.id}_position`);
      if (savedPosition) {
        video.currentTime = parseFloat(savedPosition);
        
        // Show notification
        this.showToast(`Resuming from ${this.formatTime(savedPosition)}`);
      }
      
      video.addEventListener('timeupdate', () => {
        // Save every 5 seconds
        if (Math.floor(video.currentTime) % 5 === 0) {
          localStorage.setItem(`video_${video.id}_position`, video.currentTime);
        }
      });
      
      // Track when video is completed
      video.addEventListener('ended', () => {
        localStorage.removeItem(`video_${video.id}_position`);
        if (window.lessonAnalytics) {
          window.lessonAnalytics.trackVideoEvent('ended', video.currentTime, video.duration);
        }
      });
      
      // Add play/pause tracking
      video.addEventListener('play', () => {
        if (window.lessonAnalytics) {
          window.lessonAnalytics.trackVideoEvent('play', video.currentTime, video.duration);
        }
      });
      
      video.addEventListener('pause', () => {
        if (window.lessonAnalytics) {
          window.lessonAnalytics.trackVideoEvent('pause', video.currentTime, video.duration);
        }
      });
      
      // Enable Picture-in-Picture if available
      if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
        this.addPiPButton(video);
      }
      
      // Optimize for slow connections
      if (this.isSlowConnection()) {
        video.preload = 'metadata';
      }
      
      if (this.config.debug) {
        console.log('[Mobile] Optimized video:', video.id);
      }
    });
  }
  
  addPiPButton(video) {
    // Check if button already exists
    if (video.parentElement.querySelector('.pip-button')) return;
    
    const button = document.createElement('button');
    button.className = 'pip-button';
    button.innerHTML = '📺';
    button.title = 'Picture in Picture';
    button.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      z-index: 10;
      font-size: 1.2rem;
    `;
    
    button.addEventListener('click', async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch (error) {
        console.warn('[Mobile] PiP not available:', error);
      }
    });
    
    // Position relative to video
    const container = video.parentElement;
    container.style.position = 'relative';
    container.appendChild(button);
  }
  
  improveTouchTargets() {
    // Enlarge answer options
    const answerOptions = document.querySelectorAll('.answer-option');
    answerOptions.forEach(option => {
      const currentPadding = window.getComputedStyle(option).padding;
      if (parseInt(currentPadding) < 16) {
        option.style.padding = '16px';
      }
      
      const currentMinHeight = window.getComputedStyle(option).minHeight;
      if (parseInt(currentMinHeight) < 48) {
        option.style.minHeight = '48px';
      }
    });
    
    // Enlarge buttons
    const buttons = document.querySelectorAll('button, .quiz-submit, .pdf-download-button');
    buttons.forEach(button => {
      const currentMinHeight = window.getComputedStyle(button).minHeight;
      if (parseInt(currentMinHeight) < 44) {
        button.style.minHeight = '44px';
      }
    });
    
    // Add visual feedback for taps
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('button, .answer-option, a');
      if (target) {
        target.classList.add('touch-active');
        setTimeout(() => target.classList.remove('touch-active'), 200);
      }
    }, { passive: true });
    
    // Add CSS for touch feedback
    if (!document.getElementById('mobile-touch-styles')) {
      const style = document.createElement('style');
      style.id = 'mobile-touch-styles';
      style.textContent = `
        .touch-active {
          opacity: 0.7;
          transform: scale(0.98);
        }
        
        @media (hover: none) and (pointer: coarse) {
          /* Mobile-specific hover styles */
          .answer-option:active {
            background: var(--bg-secondary);
          }
          
          button:active {
            transform: scale(0.98);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    if (this.config.debug) {
      console.log('[Mobile] Improved touch targets');
    }
  }
  
  enableSwipeNavigation() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    }, { passive: true });
    
    if (this.config.debug) {
      console.log('[Mobile] Swipe navigation enabled');
    }
  }
  
  handleSwipe() {
    const threshold = 100;
    const xDiff = touchEndX - touchStartX;
    const yDiff = Math.abs(touchEndY - touchStartY);
    
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(xDiff) > threshold && yDiff < 100) {
      if (xDiff > 0) {
        // Swipe right - go to previous lesson
        this.showToast('Swipe navigation: Use Thinkific\'s navigation');
      } else {
        // Swipe left - go to next lesson
        this.showToast('Swipe navigation: Use Thinkific\'s navigation');
      }
    }
  }
  
  handleOrientationChanges() {
    window.addEventListener('orientationchange', () => {
      // Recalculate layouts after orientation change
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        
        // Scroll to top of current section to prevent awkward positioning
        const currentScroll = window.scrollY;
        if (currentScroll > 100) {
          window.scrollTo({ top: currentScroll, behavior: 'instant' });
        }
        
        if (this.config.debug) {
          console.log('[Mobile] Orientation changed');
        }
      }, 100);
    });
  }
  
  optimizeNetworkUsage() {
    if (!('connection' in navigator)) return;
    
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    
    // Detect slow connections
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      document.body.classList.add('slow-connection');
      
      // Change all eager-loading images to lazy
      document.querySelectorAll('img[loading="eager"]').forEach(img => {
        img.loading = 'lazy';
      });
      
      this.showToast('Slow connection detected - optimizing content');
      
      if (this.config.debug) {
        console.log('[Mobile] Slow connection optimizations applied');
      }
    }
    
    // Monitor for connection changes
    connection.addEventListener('change', () => {
      const newType = connection.effectiveType;
      if (this.config.debug) {
        console.log('[Mobile] Connection changed to:', newType);
      }
    });
  }
  
  preventUnwantedZoom() {
    // Prevent zoom on input focus (iOS Safari)
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const fontSize = parseFloat(window.getComputedStyle(input).fontSize);
      if (fontSize < 16) {
        input.style.fontSize = '16px';
      }
    });
    
    // Prevent double-tap zoom on buttons
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
      }
      
      lastTap = currentTime;
    }, { passive: false });
    
    if (this.config.debug) {
      console.log('[Mobile] Prevented unwanted zoom');
    }
  }
  
  addMobileUtilities() {
    // Add class to body for mobile-specific styling
    document.body.classList.add('mobile-device');
    
    if (this.isStandalone) {
      document.body.classList.add('standalone-mode');
    }
    
    // Add viewport meta tag if missing
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
      document.head.appendChild(meta);
    }
    
    // Add touch-action for better scrolling
    if (!document.getElementById('mobile-scroll-styles')) {
      const style = document.createElement('style');
      style.id = 'mobile-scroll-styles';
      style.textContent = `
        @media (hover: none) and (pointer: coarse) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          .lesson-container {
            touch-action: pan-y;
          }
          
          .answer-option,
          button {
            touch-action: manipulation;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  isSlowConnection() {
    if (!('connection' in navigator)) return false;
    const connection = navigator.connection;
    return connection.saveData || 
           connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g';
  }
  
  showToast(message, duration = 3000) {
    // Remove existing toast
    const existing = document.querySelector('.mobile-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      max-width: 80%;
      text-align: center;
      animation: slideUp 0.3s ease-out;
    `;
    
    // Add animation
    if (!document.getElementById('toast-animation')) {
      const style = document.createElement('style');
      style.id = 'toast-animation';
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.mobileEnhancements = new MobileEnhancements({
        debug: window.location.hostname === 'localhost'
      });
    });
  } else {
    window.mobileEnhancements = new MobileEnhancements({
      debug: window.location.hostname === 'localhost'
    });
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileEnhancements;
}