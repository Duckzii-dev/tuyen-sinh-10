/**
 * UI Module
 * Handles shared UI elements, dark mode, sidebar toggle, modal, toasts, counter animations, and skeletons.
 */

// ── Theme Management ──
export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
}

export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
    showToast(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`, 'info');

    // Dispatch custom event so ChartJS can change colors if loaded
    window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: newTheme } }));
}

function updateThemeToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (!icon) return;

    if (theme === 'light') {
        icon.className = 'fas fa-moon';
    } else {
        icon.className = 'fas fa-sun';
    }
}

// ── Sidebar Management ──
export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');

    // Create overlay for mobile
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Load collapsed state from storage
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed && window.innerWidth > 768) {
        sidebar.classList.add('collapsed');
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        });
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('show');
        });
    }

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('show');
    });

    // Close mobile nav when clicking a nav item on mobile
    const navItems = sidebar.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
                overlay.classList.remove('show');
            }
        });
    });
}

// ── Breadcrumb Management ──
export function updateBreadcrumb(items) {
    const container = document.getElementById('breadcrumb');
    if (!container) return;

    let html = `
        <a href="/" class="breadcrumb-link"><i class="fas fa-home"></i></a>
    `;

    items.forEach((item, idx) => {
        html += `<span class="separator">/</span>`;
        if (idx === items.length - 1) {
            html += `<span class="current">${item.label}</span>`;
        } else {
            html += `<a href="${item.link}" class="breadcrumb-link">${item.label}</a>`;
        }
    });

    container.innerHTML = html;
}

// ── Modal System ──
export function showModal(title, contentHtml) {
    let overlay = document.getElementById('global-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'global-modal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title-text">Chi tiết</h3>
                    <button class="modal-close" id="modal-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" id="modal-body-content"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Bind events
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        overlay.querySelector('#modal-close-btn').addEventListener('click', closeModal);
    }

    document.getElementById('modal-title-text').innerText = title;
    document.getElementById('modal-body-content').innerHTML = contentHtml;

    overlay.classList.add('show');
}

export function closeModal() {
    const overlay = document.getElementById('global-modal');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// ── Toast System ──
export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-info-circle text-info';
    if (type === 'success') iconClass = 'fa-check-circle text-success';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle text-warning';
    if (type === 'danger') iconClass = 'fa-times-circle text-danger';

    toast.innerHTML = `
        <i class="fas ${iconClass} toast-icon"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// ── Counter Animations ──
export function animateCounter(element, targetValue, duration = 1200) {
    if (!element) return;

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * targetValue);

        element.innerText = currentValue.toLocaleString('vi-VN');

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.innerText = targetValue.toLocaleString('vi-VN');
        }
    };
    window.requestAnimationFrame(step);
}

// ── Skeleton Renderers ──
export function getSkeletonHtml(type) {
    if (type === 'cards') {
        return `
            <div class="stats-grid">
                <div class="stat-card skeleton skeleton-card"></div>
                <div class="stat-card skeleton skeleton-card"></div>
                <div class="stat-card skeleton skeleton-card"></div>
                <div class="stat-card skeleton skeleton-card"></div>
            </div>
        `;
    }
    if (type === 'charts') {
        return `
            <div class="charts-grid">
                <div class="chart-card skeleton skeleton-chart"></div>
                <div class="chart-card skeleton skeleton-chart"></div>
            </div>
        `;
    }
    if (type === 'table') {
        return `
            <div class="data-panel">
                <div class="skeleton skeleton-text" style="width: 250px; height: 28px; margin-bottom: 20px;"></div>
                <div class="skeleton skeleton-text" style="height: 18px; margin-bottom: 10px;"></div>
                <div class="skeleton skeleton-text" style="height: 18px; margin-bottom: 10px; width: 95%;"></div>
                <div class="skeleton skeleton-text" style="height: 18px; margin-bottom: 10px; width: 90%;"></div>
                <div class="skeleton skeleton-text" style="height: 18px; margin-bottom: 10px; width: 85%;"></div>
            </div>
        `;
    }
    return `<div class="skeleton skeleton-card" style="width: 100%; height: 200px;"></div>`;
}

// Active Nav Item highlighting
export function updateActiveNavItem(path) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const normalized = path === '' ? '/' : path;
    let targetSelector = `.nav-item[href="${normalized}"]`;

    if (normalized.startsWith('/subjects/') && normalized !== '/subjects') {
        targetSelector = '.nav-item[href="/subjects"]';
    }

    const activeItem = sidebar.querySelector(targetSelector);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}
