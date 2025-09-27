/**
 * Lesson Builder for Thinkific Lessons
 * Renders lesson content from JSON configuration
 * Version 1.0
 */

class LessonBuilder {
    constructor(content) {
        this.content = content;
        this.contentRenderers = {
            'paragraph': this.renderParagraph,
            'header': this.renderHeader,
            'technique-card': this.renderTechniqueCard,
            'example-box': this.renderExampleBox,
            'numbered-list': this.renderNumberedList,
            'drill-steps': this.renderDrillSteps,
            'conversation': this.renderConversation,
            'pdf-viewer': this.renderPDFViewer,
            'custom-html': this.renderCustomHTML
        };
    }
    
    /**
     * Build the complete lesson from content configuration
     */
    build() {
        this.setPageTitle();
        this.setLessonTitle();
        this.setVideoSource();
        this.renderContent();
        this.renderQuiz();
    }
    
    /**
     * Set the page title and document title
     */
    setPageTitle() {
        const pageTitle = this.content.pageTitle || this.content.title;
        const titleElement = document.getElementById('pageTitle');
        
        if (titleElement) {
            titleElement.textContent = pageTitle;
        }
        document.title = pageTitle;
    }
    
    /**
     * Set the main lesson title
     */
    setLessonTitle() {
        const titleElement = document.getElementById('lessonTitle');
        if (titleElement) {
            titleElement.textContent = this.content.title;
        }
    }
    
    /**
     * Set the video source or hide video section
     */
    setVideoSource() {
        const videoSource = document.getElementById('videoSource');
        const videoSection = document.getElementById('videoSection');
        
        if (this.content.videoSrc && videoSource) {
            videoSource.src = this.content.videoSrc;
        } else if (videoSection) {
            videoSection.style.display = 'none';
        }
    }
    
    /**
     * Render all content sections
     */
    renderContent() {
        const container = document.getElementById('contentSection');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.content.content.forEach(item => {
            const renderer = this.contentRenderers[item.type];
            if (renderer) {
                const element = renderer.call(this, item);
                if (element) {
                    container.appendChild(element);
                }
            } else {
                console.warn(`Unknown content type: ${item.type}`);
            }
        });
    }
    
    /**
     * Render a paragraph element
     */
    renderParagraph(item) {
        const p = document.createElement('p');
        p.innerHTML = item.text;
        return p;
    }
    
    /**
     * Render a header element (h2, h3, etc.)
     */
    renderHeader(item) {
        const level = item.level || 2;
        const h = document.createElement(`h${level}`);
        h.innerHTML = item.text;
        return h;
    }
    
    /**
     * Render a technique card with optional title, text, and bullet points
     */
    renderTechniqueCard(item) {
        const card = document.createElement('div');
        card.className = 'technique-card';
        
        if (item.title) {
            const title = document.createElement('p');
            title.innerHTML = `<strong>${item.title}</strong>`;
            card.appendChild(title);
        }
        
        if (item.text && item.text.trim()) {
            const text = document.createElement('p');
            text.innerHTML = item.text;
            card.appendChild(text);
        }
        
        if (item.items) {
            const ul = document.createElement('ul');
            item.items.forEach(itemText => {
                const li = document.createElement('li');
                li.innerHTML = itemText;
                ul.appendChild(li);
            });
            card.appendChild(ul);
        }
        
        if (item.additional_text) {
            const additionalText = document.createElement('p');
            additionalText.innerHTML = item.additional_text;
            card.appendChild(additionalText);
        }
        
        return card;
    }
    
    /**
     * Render an example box with highlighted content
     */
    renderExampleBox(item) {
        const box = document.createElement('div');
        box.className = 'example-box';
        
        const content = document.createElement('div');
        content.className = 'example-text';
        content.innerHTML = item.text;
        box.appendChild(content);
        
        return box;
    }
    
    /**
     * Render a numbered list
     */
    renderNumberedList(item) {
        const ol = document.createElement('ol');
        ol.className = 'numbered-list';
        
        item.items.forEach(itemText => {
            const li = document.createElement('li');
            li.innerHTML = itemText;
            ol.appendChild(li);
        });
        
        return ol;
    }
    
    /**
     * Render drill steps with special formatting
     */
    renderDrillSteps(item) {
        const container = document.createElement('div');
        container.className = 'drill-steps';
        
        item.steps.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'drill-step';
            
            const header = document.createElement('div');
            header.className = 'step-header';
            
            const number = document.createElement('div');
            number.className = 'step-number';
            number.textContent = index + 1;
            
            const title = document.createElement('div');
            title.className = 'step-title';
            title.textContent = step.title;
            
            header.appendChild(number);
            header.appendChild(title);
            stepDiv.appendChild(header);
            
            const description = document.createElement('p');
            description.innerHTML = step.description;
            stepDiv.appendChild(description);
            
            container.appendChild(stepDiv);
        });
        
        return container;
    }
    
    /**
     * Render conversation/dialogue sections
     */
    renderConversation(item) {
        const section = document.createElement('div');
        section.className = 'conversation-section';
        
        const title = document.createElement('div');
        title.className = 'conversation-title';
        title.textContent = item.title;
        section.appendChild(title);
        
        item.exchanges.forEach(exchange => {
            const exchangeDiv = document.createElement('div');
            exchangeDiv.className = 'conversation-exchange';
            
            exchange.forEach(line => {
                const speaker = document.createElement('div');
                speaker.className = 'speaker';
                speaker.textContent = line.speaker + ':';
                
                const text = document.createElement('div');
                text.className = 'speaker-text';
                text.innerHTML = line.text;
                
                exchangeDiv.appendChild(speaker);
                exchangeDiv.appendChild(text);
            });
            
            section.appendChild(exchangeDiv);
        });
        
        return section;
    }
    
    /**
     * Render PDF viewer component
     */
    renderPDFViewer(item) {
        const container = document.createElement('div');
        container.id = item.containerId || 'pdfContainer';
        
        // PDF viewer will be initialized later if PDFViewer class is available
        setTimeout(() => {
            if (window.PDFViewer) {
                const pdfViewer = new PDFViewer({
                    title: item.title,
                    previewImage: item.previewImage,
                    pdfUrl: item.pdfUrl,
                    filename: item.filename,
                    containerId: container.id
                });
                pdfViewer.init();
            }
        }, 100);
        
        return container;
    }
    
    /**
     * Render custom HTML content
     */
    renderCustomHTML(item) {
        const div = document.createElement('div');
        div.innerHTML = item.html;
        return div;
    }
    
    /**
     * Render quiz questions from lessonQuiz global variable
     */
    renderQuiz() {
        const container = document.getElementById('quizQuestions');
        const quizContainer = document.getElementById('quizContainer');
        
        if (!container) {
            console.warn('Quiz container not found');
            return;
        }
        
        // Check if lessonQuiz is defined and is an array
        if (typeof lessonQuiz === 'undefined' || !Array.isArray(lessonQuiz)) {
            console.warn('lessonQuiz not defined or not an array');
            container.innerHTML = '<p>Quiz questions are loading...</p>';
            return;
        }
        
        // If quiz is empty, hide the entire quiz section
        if (lessonQuiz.length === 0) {
            console.log('No quiz questions - hiding quiz section');
            if (quizContainer) {
                quizContainer.style.display = 'none';
            }
            return;
        }
        
        // Show quiz container (in case it was previously hidden)
        if (quizContainer) {
            quizContainer.style.display = 'block';
        }
        
        container.innerHTML = '';
        
        lessonQuiz.forEach((question, index) => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
            questionBlock.setAttribute('data-correct', question.correct);
            
            const questionText = document.createElement('div');
            questionText.className = 'question-text';
            questionText.textContent = `${index + 1}. ${question.question}`;
            questionBlock.appendChild(questionText);
            
            const letters = ['a', 'b', 'c', 'd'];
            question.options.forEach((option, optionIndex) => {
                const answerOption = document.createElement('div');
                answerOption.className = 'answer-option';
                answerOption.setAttribute('data-answer', letters[optionIndex]);
                answerOption.textContent = option;
                questionBlock.appendChild(answerOption);
            });
            
            container.appendChild(questionBlock);
        });
    }
    
    /**
     * Add a new content renderer
     */
    addRenderer(type, rendererFunction) {
        this.contentRenderers[type] = rendererFunction;
    }
    
    /**
     * Get the current content configuration
     */
    getContent() {
        return this.content;
    }
    
    /**
     * Update content configuration and re-render
     */
    updateContent(newContent) {
        this.content = { ...this.content, ...newContent };
        this.renderContent();
    }
}

// Export for use in other modules
window.LessonBuilder = LessonBuilder;