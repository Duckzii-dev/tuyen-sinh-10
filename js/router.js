/**
 * Router Module
 * Client-side path-based router using the History API.
 */

import { fetchStudents, getSubjects } from './data.js';
import { updateBreadcrumb, updateActiveNavItem, getSkeletonHtml, showToast } from './ui.js';

const pageInitializers = {};
const templateCache = new Map();
const BASE_PATH =
    window.location.hostname.endsWith('github.io')
        ? '/tuyen-sinh-10'
        : '';
function stripBasePath(path) {
    if (BASE_PATH && path.startsWith(BASE_PATH)) {
        path = path.slice(BASE_PATH.length);
    }

    return path || '/';
}

function withBasePath(path) {
    return `${BASE_PATH}${path === '/' ? '/' : path}`;
}
const ROUTE_MAP = {
    '/': 'dashboard',
    '/students': 'students',
    '/charts': 'charts',
    '/competition': 'competition',
    '/subjects': 'subjects',
};

export function registerPageInitializer(page, initFn) {
    pageInitializers[page] = initFn;
}

export function navigate(path) {
    const normalized = normalizePath(path);
    if (normalized === getCurrentPath()) {
        handleRoute();
        return;
    }
    window.history.pushState(
    { path: normalized },
    '',
    withBasePath(normalized)
);
    handleRoute();
}

export function getCurrentPath() {
    return normalizePath(
        stripBasePath(window.location.pathname)
    );
}

function normalizePath(path) {
    if (!path || path === '') return '/';
    let normalized = path.split('?')[0].split('#')[0];
    if (!normalized.startsWith('/')) normalized = `/${normalized}`;
    if (normalized !== '/' && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
}

function migrateLegacyHashRoute() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#/')) return false;

    const legacyPath = hash.replace('#', '') || '/';
   window.history.replaceState(
    { path: legacyPath },
    '',
    withBasePath(legacyPath)
);
    return true;
}

function parseRoute(path) {
    if (ROUTE_MAP[path]) {
        return { route: ROUTE_MAP[path], param: null, path };
    }

    const subjectMatch = path.match(/^\/subjects\/([^/]+)$/i);
    if (subjectMatch) {
        const code = subjectMatch[1].toUpperCase();
        if (getSubjects().includes(code)) {
            return { route: 'subject-detail', param: code, path: `/subjects/${code}` };
        }
    }

    // Legacy root-level subject codes: /AV, /T, etc.
    const legacyMatch = path.match(/^\/([^/]+)$/);
    if (legacyMatch) {
        const code = legacyMatch[1].toUpperCase();
        if (getSubjects().includes(code)) {
            return { route: 'subject-detail', param: code, path: `/subjects/${code}` };
        }
    }

    return null;
}

function setPageMeta(routeInfo) {
    const { route, param, path } = routeInfo;

    if (route === 'dashboard') {
        updateBreadcrumb([{ label: 'Tổng quan', link: '/' }]);
        updateActiveNavItem('/');
    } else if (route === 'students') {
        updateBreadcrumb([{ label: 'Danh sách thí sinh', link: '/students' }]);
        updateActiveNavItem('/students');
    } else if (route === 'charts') {
        updateBreadcrumb([{ label: 'Biểu đồ phân tích', link: '/charts' }]);
        updateActiveNavItem('/charts');
    } else if (route === 'competition') {
        updateBreadcrumb([{ label: 'Tỷ lệ chọi', link: '/competition' }]);
        updateActiveNavItem('/competition');
    } else if (route === 'subjects') {
        updateBreadcrumb([{ label: 'Danh sách môn', link: '/subjects' }]);
        updateActiveNavItem('/subjects');
    } else if (route === 'subject-detail') {
        updateBreadcrumb([
            { label: 'Danh sách môn', link: '/subjects' },
            { label: param, link: path },
        ]);
        updateActiveNavItem('/subjects');
    }
}

async function loadTemplate(templatePath) {
    if (templateCache.has(templatePath)) {
        return templateCache.get(templatePath);
    }

    const response = await fetch(
        `${BASE_PATH}${templatePath}`
    );

    if (!response.ok) {
        throw new Error(`Failed to load template ${templatePath}`);
    }

    const html = await response.text();

    templateCache.set(templatePath, html);

    return html;
}

function interceptLinkClicks() {
    document.addEventListener('click', (event) => {
        const anchor = event.target.closest('a[href]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        if (href.startsWith('#')) {
            event.preventDefault();
            navigate(href.replace('#', '') || '/');
            return;
        }

        if (href.startsWith('/')) {
            event.preventDefault();
            navigate(href);
        }
    });
}

export async function initRouter() {
    migrateLegacyHashRoute();
    interceptLinkClicks();

    window.addEventListener('popstate', handleRoute);
    await handleRoute();
}

async function handleRoute() {
    const contentContainer = document.getElementById('content');
    if (!contentContainer) return;

    contentContainer.innerHTML = getSkeletonHtml('table');
    contentContainer.classList.add('page-enter');

    try {
        await fetchStudents();
    } catch (e) {
        contentContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle empty-state-icon"></i>
                <h3 class="empty-state-title">Đã xảy ra lỗi</h3>
                <p class="empty-state-desc">Không thể nạp cơ sở dữ liệu thí sinh. Vui lòng kiểm tra lại.</p>
            </div>
        `;
        return;
    }

    const path = getCurrentPath();
    const routeInfo = parseRoute(path);

    if (!routeInfo) {
        window.history.replaceState(
            { path: '/' },
            '',
            withBasePath('/')
        );
        await handleRoute();
        return;
    }

    // Canonicalize legacy /CODE URLs to /subjects/CODE
    if (routeInfo.route === 'subject-detail' && path !== routeInfo.path) {
        window.history.replaceState(
            { path: routeInfo.path },
            '',
            withBasePath(routeInfo.path)
        );
    }

    setPageMeta(routeInfo);

    try {
        const { route, param } = routeInfo;

        if (route === 'students') {
            renderStudentsPage(contentContainer);
            pageInitializers.students?.(null);
            requestAnimationFrame(() => contentContainer.classList.remove('page-enter'));
            return;
        }

        let templatePath = '';
        if (route === 'dashboard') templatePath = '/dashboardd.html';
        else if (route === 'charts') templatePath = '/chartss.html';
        else if (route === 'competition') templatePath = '/competitionn.html';
        else if (route === 'subject-detail' || route === 'subjects') templatePath = '/subjectt.html';

        if (templatePath) {
            const html = await loadTemplate(templatePath);
            contentContainer.innerHTML = html;
            pageInitializers[route]?.(param);
        }

        requestAnimationFrame(() => contentContainer.classList.remove('page-enter'));
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi tải trang, vui lòng tải lại.', 'danger');
        contentContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle empty-state-icon"></i>
                <h3 class="empty-state-title">Lỗi tải trang</h3>
                <p class="empty-state-desc">${err.message}</p>
            </div>
        `;
    }
}

function renderStudentsPage(container) {
    container.innerHTML = `
        <div class="fade-in">
            <div class="page-header-row">
                <div>
                    <h1 class="page-title">Danh sách thí sinh</h1>
                    <p class="page-subtitle">Quản lý và tra cứu thông tin tất cả thí sinh tham gia kỳ thi.</p>
                </div>
                <div class="student-count-badge" id="student-count-badge">
                    <i class="fas fa-users"></i>
                    <span id="student-total-count">—</span> thí sinh
                </div>
            </div>

            <div class="data-panel">
                <div class="filter-bar">
                    <select id="filter-subject" class="filter-select">
                        <option value="">Lọc theo Môn</option>
                    </select>
                    <select id="filter-school" class="filter-select">
                        <option value="">Lọc theo Trường</option>
                    </select>
                    <select id="filter-room" class="filter-select">
                        <option value="">Lọc theo Phòng</option>
                    </select>
                    <button id="btn-reset-filters" class="btn-secondary" style="height: 38px;">
                        <i class="fas fa-redo"></i> Đặt lại Lọc
                    </button>
                </div>

                <div class="export-bar">
                    <button id="export-csv" class="btn-secondary"><i class="fas fa-file-csv text-success"></i> Xuất CSV</button>
                    <button id="export-excel" class="btn-secondary"><i class="fas fa-file-excel text-success"></i> Xuất Excel</button>
                    <button id="export-print" class="btn-secondary"><i class="fas fa-print text-primary"></i> In danh sách</button>
                </div>

                <div class="table-responsive">
                    <table id="students-table" class="table table-striped table-hover mt-3" style="width:100%">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Môn</th>
                                <th>SBD</th>
                                <th>Họ tên</th>
                                <th>Ngày sinh</th>
                                <th>Trường</th>
                                <th>Phòng</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
