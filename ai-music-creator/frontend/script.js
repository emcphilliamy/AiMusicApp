// AI Music Creator - Start Page JavaScript
// Basic interactivity for the start page (no backend integration yet)

document.addEventListener('DOMContentLoaded', function() {
    initializeStartPage();
});

function initializeStartPage() {
    loadLikedSamplesProjects();
    setupNewProjectButton();
    setupTemplateCards();
    setupSettingsButton();
    addHoverEffects();
    // setupProjectCards is called after loading projects
}

// Load LikedSamples projects and populate the recent projects section
function loadLikedSamplesProjects() {
    console.log('Loading LikedSamples projects...');
    
    if (!window.LikedSamplesLoader) {
        console.warn('LikedSamplesLoader not available');
        return;
    }
    
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) {
        console.error('Projects grid not found');
        return;
    }
    
    // Get the project preview data
    const projects = window.LikedSamplesLoader.getProjectPreviewData();
    console.log('Found projects:', projects);
    
    // Clear existing content
    projectsGrid.innerHTML = '';
    
    // Create project cards
    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsGrid.appendChild(projectCard);
    });
    
    console.log(`Loaded ${projects.length} project cards`);
    
    // Set up event listeners for the dynamically created cards
    setupProjectCards();
}

// Create a project card element
function createProjectCard(project) {
    console.log('Creating card for project:', project.name);
    
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = project.id;
    
    // Choose icon based on genre/style
    const iconMap = {
        'POP': 'fas fa-music',
        'JAZZ': 'fas fa-piano',
        'LO-FI': 'fas fa-drum',
        'ELECTRONIC': 'fas fa-wave-square',
        'HOUSE': 'fas fa-compact-disc',
        'AMBIENT': 'fas fa-cloud'
    };
    
    const icon = iconMap[project.genre] || 'fas fa-music';
    
    card.innerHTML = `
        <div class="project-preview">
            <div class="waveform-placeholder">
                <i class="${icon}"></i>
            </div>
            <div class="play-button">
                <i class="fas fa-play"></i>
            </div>
        </div>
        <div class="project-info">
            <h4>${project.name}</h4>
            <p>${project.description}</p>
            <span class="project-date">${project.date} • ${project.duration}</span>
        </div>
        <div class="project-actions">
            <button class="action-btn">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>
    `;
    
    return card;
}

// New Project Button
function setupNewProjectButton() {
    const newProjectBtn = document.querySelector('.new-project-btn');
    
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function() {
            // Navigate to project editor
            window.location.href = 'project-editor.html';
        });
    }
}

// Project Cards Interaction
function setupProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        // Main card click - open project
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on action button
            if (!e.target.closest('.action-btn') && !e.target.closest('.play-button')) {
                const projectId = card.dataset.projectId;
                if (projectId) {
                    // Store the selected project ID for loading in the editor
                    localStorage.setItem('selectedProjectId', projectId);
                }
                // Navigate to project editor
                window.location.href = 'project-editor.html';
            }
        });
        
        // Play button click
        const playBtn = card.querySelector('.play-button');
        if (playBtn) {
            playBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                togglePlayButton(playBtn);
                // TODO: Implement audio preview
            });
        }
        
        // Action button click
        const actionBtn = card.querySelector('.action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                showProjectMenu(card);
            });
        }
    });
}

// Template Cards Interaction
function setupTemplateCards() {
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
        card.addEventListener('click', function() {
            const templateName = card.querySelector('h4').textContent;
            // Navigate to project editor with template
            window.location.href = 'project-editor.html';
        });
    });
}

// Settings Button
function setupSettingsButton() {
    const settingsBtn = document.querySelector('.header-actions .btn-secondary');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            // TODO: Implement settings panel
            showComingSoonModal('Settings Panel');
        });
    }
}

// View All Button
function setupViewAllButton() {
    const viewAllBtn = document.querySelector('.btn-text');
    
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            // TODO: Implement view all projects
            showComingSoonModal('View All Projects');
        });
    }
}

// Play Button Toggle
function togglePlayButton(playBtn) {
    const icon = playBtn.querySelector('i');
    const isPlaying = icon.classList.contains('fa-pause');
    
    if (isPlaying) {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        playBtn.style.background = 'rgba(74, 158, 255, 0.9)';
    } else {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        playBtn.style.background = 'rgba(255, 59, 59, 0.9)';
        
        // Auto-reset after 3 seconds (simulating audio end)
        setTimeout(() => {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            playBtn.style.background = 'rgba(74, 158, 255, 0.9)';
        }, 3000);
    }
}

// Project Context Menu
function showProjectMenu(card) {
    const projectName = card.querySelector('h4').textContent;
    
    // Remove existing menus
    removeExistingMenus();
    
    // Create menu
    const menu = document.createElement('div');
    menu.className = 'project-menu';
    menu.innerHTML = `
        <div class="menu-item" data-action="open">
            <i class="fas fa-folder-open"></i>
            Open Project
        </div>
        <div class="menu-item" data-action="duplicate">
            <i class="fas fa-copy"></i>
            Duplicate
        </div>
        <div class="menu-item" data-action="rename">
            <i class="fas fa-edit"></i>
            Rename
        </div>
        <div class="menu-item" data-action="export">
            <i class="fas fa-download"></i>
            Export
        </div>
        <div class="menu-separator"></div>
        <div class="menu-item danger" data-action="delete">
            <i class="fas fa-trash"></i>
            Delete
        </div>
    `;
    
    // Position menu
    const rect = card.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = rect.top + 10 + 'px';
    menu.style.right = window.innerWidth - rect.right + 10 + 'px';
    menu.style.zIndex = '1000';
    
    // Add menu styles
    menu.style.background = 'rgba(30, 30, 30, 0.95)';
    menu.style.backdropFilter = 'blur(20px)';
    menu.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    menu.style.borderRadius = '8px';
    menu.style.padding = '0.5rem 0';
    menu.style.minWidth = '160px';
    menu.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
    
    // Style menu items
    const menuItems = menu.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.style.padding = '0.75rem 1rem';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '0.75rem';
        item.style.color = '#ffffff';
        item.style.fontSize = '0.875rem';
        item.style.cursor = 'pointer';
        item.style.transition = 'background-color 0.2s ease';
        
        if (item.classList.contains('danger')) {
            item.style.color = '#ff6b6b';
        }
        
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        
        item.addEventListener('click', function() {
            const action = this.dataset.action;
            handleProjectAction(action, projectName);
            removeExistingMenus();
        });
    });
    
    // Style separator
    const separator = menu.querySelector('.menu-separator');
    if (separator) {
        separator.style.height = '1px';
        separator.style.background = 'rgba(255, 255, 255, 0.1)';
        separator.style.margin = '0.5rem 0';
    }
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                removeExistingMenus();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 10);
}

// Handle Project Actions
function handleProjectAction(action, projectName) {
    switch (action) {
        case 'open':
            showComingSoonModal(`Opening "${projectName}"`);
            break;
        case 'duplicate':
            showComingSoonModal(`Duplicating "${projectName}"`);
            break;
        case 'rename':
            showComingSoonModal(`Renaming "${projectName}"`);
            break;
        case 'export':
            showComingSoonModal(`Exporting "${projectName}"`);
            break;
        case 'delete':
            showDeleteConfirmation(projectName);
            break;
    }
}

// Delete Confirmation
function showDeleteConfirmation(projectName) {
    showModal(
        'Delete Project',
        `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
        [
            {
                text: 'Cancel',
                style: 'secondary',
                action: () => closeModal()
            },
            {
                text: 'Delete',
                style: 'danger',
                action: () => {
                    // TODO: Implement project deletion
                    closeModal();
                    showNotification(`"${projectName}" has been deleted`);
                }
            }
        ]
    );
}

// Remove existing menus
function removeExistingMenus() {
    const existingMenus = document.querySelectorAll('.project-menu');
    existingMenus.forEach(menu => menu.remove());
}

// Coming Soon Modal
function showComingSoonModal(feature) {
    showModal(
        'Coming Soon',
        `${feature} functionality will be implemented in the next version.`,
        [
            {
                text: 'Got it',
                style: 'primary',
                action: () => closeModal()
            }
        ]
    );
}

// Generic Modal System
function showModal(title, message, buttons = []) {
    // Remove existing modal
    closeModal();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
            </div>
            <div class="modal-content">
                <p>${message}</p>
            </div>
            <div class="modal-actions">
                ${buttons.map(btn => 
                    `<button class="modal-btn ${btn.style}" data-action="${buttons.indexOf(btn)}">${btn.text}</button>`
                ).join('')}
            </div>
        </div>
    `;
    
    // Style modal
    Object.assign(modal.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '10000'
    });
    
    const modalContent = modal.querySelector('.modal');
    Object.assign(modalContent.style, {
        background: 'rgba(30, 30, 30, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        color: '#ffffff'
    });
    
    // Style modal buttons
    const modalButtons = modal.querySelectorAll('.modal-btn');
    modalButtons.forEach((btn, index) => {
        const buttonStyle = buttons[index].style;
        Object.assign(btn.style, {
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            marginLeft: index > 0 ? '0.75rem' : '0',
            transition: 'all 0.2s ease'
        });
        
        if (buttonStyle === 'primary') {
            Object.assign(btn.style, {
                background: 'linear-gradient(135deg, #4a9eff 0%, #00d4ff 100%)',
                color: '#ffffff'
            });
        } else if (buttonStyle === 'danger') {
            Object.assign(btn.style, {
                background: '#ff6b6b',
                color: '#ffffff'
            });
        } else {
            Object.assign(btn.style, {
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            });
        }
        
        btn.addEventListener('click', () => {
            buttons[index].action();
        });
    });
    
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        background: type === 'success' ? '#4CAF50' : type === 'error' ? '#ff6b6b' : '#4a9eff',
        color: '#ffffff',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '500',
        zIndex: '10001',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Add hover effects and animations
function addHoverEffects() {
    // Add subtle parallax effect to background
    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        
        document.body.style.backgroundPosition = `${moveX}px ${moveY}px`;
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.new-project-btn, .template-card, .project-card');
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });
}

function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');
    
    Object.assign(circle.style, {
        position: 'absolute',
        borderRadius: '50%',
        transform: 'scale(0)',
        animation: 'ripple 600ms linear',
        backgroundColor: 'rgba(255, 255, 255, 0.2)'
    });
    
    // Add CSS animation
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
        existingRipple.remove();
    }
    
    button.appendChild(circle);
    
    setTimeout(() => {
        circle.remove();
    }, 600);
}