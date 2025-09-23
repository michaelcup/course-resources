/**
 * Bottom Bar Component for Thinkific Lessons
 * Provides reusable bottom completion requirements bar
 * Version 1.0
 */

class BottomBar {
    constructor(options = {}) {
        this.options = {
            requirements: options.requirements || [
                {
                    id: 'reading',
                    icon: 'feather-book-open',
                    label: 'Lesson Incomplete',
                    completeLabel: 'Lesson Complete',
                    status: 'incomplete' // incomplete, complete, in-progress, failed
                },
                {
                    id: 'quiz',
                    icon: 'feather-edit-3', 
                    label: 'Quiz Incomplete',
                    completeLabel: 'Quiz Complete',
                    failedLabel: 'Quiz Failed - Try Again',
                    inProgressLabel: 'Quiz In Progress',
                    status: 'incomplete'
                }
            ],
            containerId: options.containerId || null,
            showActions: options.showActions !== false,
            ...options
        };
        
        this.element = null;
        this.requirementElements = {};
    }
    
    /**
     * Generate the bottom bar HTML
     */
    generateHTML() {
        return `
            <div class="fixed-bottom-bar">
                <div class="bottom-bar-content">
                    <div class="completion-requirements">
                        ${this.generateRequirements()}
                    </div>
                    ${this.options.showActions ? this.generateActions() : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Generate requirements HTML
     */
    generateRequirements() {
        return this.options.requirements.map(req => `
            <div class="requirement-item" data-requirement-id="${req.id}">
                <div class="requirement-icon ${req.status}" id="${req.id}Icon">
                    <div class="iconify" data-icon="${req.icon}" data-inline="false"></div>
                </div>
                <span class="requirement-label">${this.getRequirementLabel(req)}</span>
            </div>
        `).join('');
    }
    
    /**
     * Generate actions section (optional)
     */
    generateActions() {
        if (!this.options.actions) return '';
        
        return `
            <div class="bottom-bar-actions">
                ${this.options.actions.map(action => `
                    <button class="bottom-bar-action ${action.class || ''}" 
                            onclick="${action.onclick || ''}"
                            ${action.disabled ? 'disabled' : ''}>
                        ${action.icon ? `<div class="iconify" data-icon="${action.icon}" data-inline="false"></div>` : ''}
                        <span>${action.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Get the appropriate label for a requirement based on status
     */
    getRequirementLabel(req) {
        switch (req.status) {
            case 'complete':
                return req.completeLabel || req.label;
            case 'failed':
                return req.failedLabel || req.label;
            case 'in-progress':
                return req.inProgressLabel || req.label;
            default:
                return req.label;
        }
    }
    
    /**
     * Initialize and inject the bottom bar
     */
    init() {
        // Create the element
        this.createElement();
        
        // Inject into DOM
        this.injectIntoDOM();
        
        // Store references to requirement elements
        this.cacheRequirementElements();
        
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
     * Inject the bottom bar into the DOM
     */
    injectIntoDOM() {
        if (this.options.containerId) {
            const container = document.getElementById(this.options.containerId);
            if (container) {
                container.appendChild(this.element);
                return;
            }
        }
        
        // Default: append to body
        document.body.appendChild(this.element);
    }
    
    /**
     * Cache references to requirement elements for faster updates
     */
    cacheRequirementElements() {
        this.options.requirements.forEach(req => {
            const item = this.element.querySelector(`[data-requirement-id="${req.id}"]`);
            if (item) {
                this.requirementElements[req.id] = {
                    item: item,
                    icon: item.querySelector('.requirement-icon'),
                    label: item.querySelector('.requirement-label')
                };
            }
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add any custom event listeners here
        // Could listen for lesson manager events, etc.
    }
    
    /**
     * Update a specific requirement status
     */
    updateRequirement(id, status, customLabel = null) {
        const req = this.options.requirements.find(r => r.id === id);
        const elements = this.requirementElements[id];
        
        if (!req || !elements) return;
        
        // Update the requirement object
        req.status = status;
        
        // Update the icon classes
        elements.icon.className = `requirement-icon ${status}`;
        
        // Update the label
        const label = customLabel || this.getRequirementLabel(req);
        elements.label.textContent = label;
        
        // Dispatch custom event
        this.dispatchRequirementUpdate(id, status, label);
    }
    
    /**
     * Update multiple requirements at once
     */
    updateRequirements(updates) {
        Object.entries(updates).forEach(([id, data]) => {
            if (typeof data === 'string') {
                // Simple status update
                this.updateRequirement(id, data);
            } else {
                // Status + custom label
                this.updateRequirement(id, data.status, data.label);
            }
        });
    }
    
    /**
     * Get current status of all requirements
     */
    getRequirementStatus() {
        const status = {};
        this.options.requirements.forEach(req => {
            status[req.id] = req.status;
        });
        return status;
    }
    
    /**
     * Check if all requirements are complete
     */
    areAllRequirementsComplete() {
        return this.options.requirements.every(req => req.status === 'complete');
    }
    
    /**
     * Dispatch custom event for requirement updates
     */
    dispatchRequirementUpdate(id, status, label) {
        window.dispatchEvent(new CustomEvent('requirementUpdated', {
            detail: { id, status, label, allComplete: this.areAllRequirementsComplete() }
        }));
    }
    
    /**
     * Add a new requirement dynamically
     */
    addRequirement(requirement) {
        this.options.requirements.push(requirement);
        
        // Re-render the requirements section
        const container = this.element.querySelector('.completion-requirements');
        if (container) {
            container.innerHTML = this.generateRequirements();
            this.cacheRequirementElements();
        }
    }
    
    /**
     * Remove a requirement
     */
    removeRequirement(id) {
        this.options.requirements = this.options.requirements.filter(req => req.id !== id);
        
        // Re-render the requirements section
        const container = this.element.querySelector('.completion-requirements');
        if (container) {
            container.innerHTML = this.generateRequirements();
            this.cacheRequirementElements();
        }
    }
    
    /**
     * Update actions (if using actions)
     */
    updateActions(newActions) {
        if (!this.options.showActions) return;
        
        this.options.actions = newActions;
        const actionsContainer = this.element.querySelector('.bottom-bar-actions');
        if (actionsContainer) {
            actionsContainer.innerHTML = this.generateActions().replace('<div class="bottom-bar-actions">', '').replace('</div>', '');
        }
    }
    
    /**
     * Remove the bottom bar from DOM
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    /**
     * Get the DOM element
     */
    getElement() {
        return this.element;
    }
}

// Export for use in other modules
window.BottomBar = BottomBar;