/**
 * PDF Viewer Component for Thinkific Lessons
 * Displays PDF preview images with expandable view and download capability
 * Version 2.0
 */

class PDFViewer {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'Reference Document',
            previewImage: options.previewImage || '', // URL to preview image
            pdfUrl: options.pdfUrl || '', // URL to actual PDF file
            filename: options.filename || 'document.pdf',
            containerId: options.containerId || null,
            ...options
        };
        
        this.element = null;
        this.overlay = null;
        this.isExpanded = false;
    }
    
    /**
     * Generate the PDF viewer HTML
     */
    generateHTML() {
        return `
            <div class="pdf-viewer-container">
                <div class="iconify" data-icon="feather-file-text" data-inline="false" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem;"></div>
                <h3>${this.options.title}</h3>
                <p>Click the document preview below to expand and view full size, or download the PDF for reference.</p>
                
                <div class="pdf-preview-image" id="pdfPreview">
                    <div class="pdf-click-hint">Click to expand</div>
                    <img src="${this.options.previewImage}" alt="${this.options.title} Preview" />
                </div>
                
                <button class="pdf-download-button" id="pdfDownloadBtn">
                    <div class="iconify" data-icon="feather-download" data-inline="false"></div>
                    Download ${this.options.filename}
                </button>
            </div>
        `;
    }
    
    /**
     * Generate overlay HTML for expanded view
     */
    generateOverlayHTML() {
        return `
            <div class="pdf-overlay" id="pdfOverlay">
                <div class="pdf-overlay-content">
                    <div class="pdf-overlay-header">
                        <div class="pdf-overlay-title">${this.options.title}</div>
                        <div class="pdf-overlay-actions">
                            <button class="pdf-download-button" id="pdfOverlayDownloadBtn">
                                <div class="iconify" data-icon="feather-download" data-inline="false"></div>
                                Download PDF
                            </button>
                            <button class="pdf-close-button" id="pdfCloseBtn">
                                <div class="iconify" data-icon="feather-x" data-inline="false"></div>
                                Close
                            </button>
                        </div>
                    </div>
                    <div class="pdf-overlay-image">
                        <img src="${this.options.previewImage}" alt="${this.options.title} Full Size" />
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Initialize and inject the PDF viewer
     */
    init() {
        // Create the element
        this.createElement();
        
        // Inject into DOM
        this.injectIntoDOM();
        
        // Create overlay
        this.createOverlay();
        
        // Set up event listeners
        this.setupEventListeners();
        
        return this;
    }
    
    /**
     * Create the DOM element
     */
    createElement() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.generateHTML();
        this.element = wrapper.firstElementChild;
    }
    
    /**
     * Inject the PDF viewer into the DOM
     */
    injectIntoDOM() {
        if (this.options.containerId) {
            const container = document.getElementById(this.options.containerId);
            if (container) {
                container.appendChild(this.element);
                return;
            }
        }
        
        // Default: find a suitable container or append to body
        const lessonContainer = document.querySelector('.lesson-container .content-section');
        if (lessonContainer) {
            lessonContainer.appendChild(this.element);
        } else {
            document.body.appendChild(this.element);
        }
    }
    
    /**
     * Create overlay element
     */
    createOverlay() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.generateOverlayHTML();
        this.overlay = wrapper.firstElementChild;
        document.body.appendChild(this.overlay);
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Preview image click to expand
        const pdfPreview = document.getElementById('pdfPreview');
        if (pdfPreview) {
            pdfPreview.addEventListener('click', () => this.expandDocument());
        }
        
        // Download buttons
        const downloadBtns = [
            document.getElementById('pdfDownloadBtn'),
            document.getElementById('pdfOverlayDownloadBtn')
        ];
        
        downloadBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.downloadPDF();
                });
            }
        });
        
        // Close overlay
        const closeBtn = document.getElementById('pdfCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeOverlay());
        }
        
        // Close overlay on background click
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.closeOverlay();
                }
            });
        }
        
        // ESC key to close overlay
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isExpanded) {
                this.closeOverlay();
            }
        });
    }
    
    /**
     * Expand document in overlay
     */
    expandDocument() {
        if (this.overlay) {
            this.overlay.classList.add('show');
            this.isExpanded = true;
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Close overlay
     */
    closeOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
            this.isExpanded = false;
            document.body.style.overflow = '';
        }
    }
    
    /**
     * Download PDF file
     */
    downloadPDF() {
        if (this.options.pdfUrl) {
            // Create a temporary link element and trigger download
            const link = document.createElement('a');
            link.href = this.options.pdfUrl;
            link.download = this.options.filename;
            link.target = '_blank'; // Fallback for browsers that don't support download attribute
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.warn('No PDF URL provided for download');
            alert('PDF download is not available. Please contact support.');
        }
        
        // Track download
        console.log('PDF download initiated:', this.options.filename);
    }
    
    /**
     * Update PDF content
     */
    updateContent(newPreviewImage, newPdfUrl, newFilename) {
        this.options.previewImage = newPreviewImage || this.options.previewImage;
        this.options.pdfUrl = newPdfUrl || this.options.pdfUrl;
        this.options.filename = newFilename || this.options.filename;
        
        // Update main preview image
        const previewImg = this.element.querySelector('.pdf-preview-image img');
        if (previewImg) {
            previewImg.src = this.options.previewImage;
            previewImg.alt = this.options.title + ' Preview';
        }
        
        // Update overlay image
        const overlayImg = this.overlay.querySelector('.pdf-overlay-image img');
        if (overlayImg) {
            overlayImg.src = this.options.previewImage;
            overlayImg.alt = this.options.title + ' Full Size';
        }
        
        // Update download button text
        const downloadBtn = this.element.querySelector('#pdfDownloadBtn');
        if (downloadBtn) {
            const textNode = downloadBtn.childNodes[downloadBtn.childNodes.length - 1];
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                textNode.textContent = `Download ${this.options.filename}`;
            }
        }
    }
    
    /**
     * Remove the PDF viewer from DOM
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Reset body overflow
        document.body.style.overflow = '';
    }
    
    /**
     * Get the DOM element
     */
    getElement() {
        return this.element;
    }
}

// Convenience function for simple setup
window.createPDFViewer = function(options = {}) {
    return new PDFViewer(options);
};

// Export for use in other modules
window.PDFViewer = PDFViewer;