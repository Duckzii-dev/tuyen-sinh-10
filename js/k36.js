/**
 * K36 Module
 * Handles the "Danh sách lớp K36" page: admission simulation, class split,
 * district breakdown and stats — built on top of the existing student dataset.
 */

import { getStudents, getSubjects } from './data.js';
import { getSubjectName, getSubjectQuota } from './stats.js';
import { renderPieChart, setupChartDownload, destroyAllCharts } from './charts.js';

// ── Helpers ──

function checkDisqualified(s) {
    return (
        s.van === null || s.van === undefined || s.van <= 1.0 ||
        s.toan === null || s.toan === undefined || s.toan <= 1.0 ||
        s.anh === null || s.anh === undefined || s.anh <= 1.0 ||
        s.chuyen === null || s.chuyen === undefined || s.chuyen <= 2.0
    );
}

function roundScore(n) {
    return Math.round((n ?? 0) * 100) / 100;
}

function sortBySubjectRank(a, b) {
    const td = roundScore(b.tong) - roundScore(a.tong);
    if (td !== 0) return td;
    const cd = roundScore(b.chuyen) - roundScore(a.chuyen);
    if (cd !== 0) return cd;
    return a.sbd.localeCompare(b.sbd);
}

function getAdmittedList(students, subjectCode) {
    const quota = getSubjectQuota(subjectCode);

    const grouped = students.filter(s => s.subject === subjectCode);
    grouped.sort(sortBySubjectRank);

    const qualified = grouped.filter(s => !checkDisqualified(s));
    const cutoffIdx = Math.min(quota, qualified.length) - 1;
    const cutoffScore = cutoffIdx >= 0 ? roundScore(qualified[cutoffIdx].tong) : null;
    const admitted = cutoffScore !== null
        ? qualified.filter(s => roundScore(s.tong) >= cutoffScore)
        : [];

    return { quota, admitted, cutoffScore, qualifiedCount: qualified.length };
}

function pctOf(n, total) {
    return total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—';
}

// ── Render sub-sections ──

function renderStats(admitted, quota, cutoffScore, qualifiedCount) {
    const total = admitted.length;
    const female = admitted.filter(s => s.gender === 'Nữ').length;
    const male = admitted.filter(s => s.gender === 'Nam').length;

    document.getElementById('k36-stat-total').textContent = total;
    document.getElementById('k36-stat-quota-sub').textContent = `Chỉ tiêu: ${quota} học sinh`;
    document.getElementById('k36-stat-female').textContent = female;
    document.getElementById('k36-stat-female-pct').textContent = `${pctOf(female, total)} tổng số`;
    document.getElementById('k36-stat-male').textContent = male;
    document.getElementById('k36-stat-male-pct').textContent = `${pctOf(male, total)} tổng số`;
    document.getElementById('k36-stat-cutoff').textContent = cutoffScore !== null ? cutoffScore.toFixed(2) : '—';
    document.getElementById('k36-stat-cutoff-sub').textContent = cutoffScore !== null
        ? `Người thứ ${Math.min(quota, qualifiedCount)} đậu`
        : 'Chưa xác định';

    return { total };
}

function renderDistrict(admitted, total) {
    const districtMap = {};
    admitted.forEach(s => {
        const d = s.district || 'Chưa rõ';
        if (!districtMap[d]) districtMap[d] = { count: 0, male: 0, female: 0 };
        districtMap[d].count++;
        if (s.gender === 'Nam') districtMap[d].male++;
        if (s.gender === 'Nữ') districtMap[d].female++;
    });

    const distEntries = Object.entries(districtMap).sort((a, b) => b[1].count - a[1].count);

    const distTbody = document.getElementById('k36-district-tbody');
    if (distTbody) {
        distTbody.innerHTML = distEntries.map(([d, v]) => `
            <tr>
                <td><strong>${d}</strong></td>
                <td>${v.count}</td>
                <td>${pctOf(v.count, total)}</td>
                <td>${v.male}</td>
                <td>${v.female}</td>
            </tr>
        `).join('');
    }

    renderPieChart('k36-district-pie', distEntries.map(([d]) => d), distEntries.map(([, v]) => v.count));
    setupChartDownload('k36-district-pie', 'k36-dist-dl', 'phan_bo_huyen_k36.png');
}

function buildFullRow(s, rank) {
    return `
        <tr>
            <td><strong>${rank}</strong></td>
            <td>${s.sbd}</td>
            <td>${s.name}</td>
            <td>${s.gender}</td>
            <td>${s.birthday}</td>
            <td>${s.district}</td>
            <td>${s.school}</td>
            <td>${s.room}</td>
            <td>${s.van ?? '—'}</td>
            <td>${s.toan ?? '—'}</td>
            <td>${s.anh ?? '—'}</td>
            <td>${s.chuyen ?? '—'}</td>
            <td><strong>${s.tong ?? '—'}</strong></td>
        </tr>`;
}

function buildShortRow(s, rank) {
    return `
        <tr>
            <td><strong>${rank}</strong></td>
            <td>${s.sbd}</td>
            <td>${s.name}</td>
            <td>${s.gender}</td>
            <td>${s.district}</td>
            <td>${s.school}</td>
            <td><strong>${s.tong ?? '—'}</strong></td>
        </tr>`;
}

function renderDoubleClass(admitted, subjectName) {
    const splitPanel = document.getElementById('k36-class-split-panel');
    const singlePanel = document.getElementById('k36-single-class-panel');
    if (splitPanel) splitPanel.style.display = '';
    if (singlePanel) singlePanel.style.display = 'none';

    const classA = admitted.slice(0, 35);
    const classB = admitted.slice(35);

    document.getElementById('k36-class-a-title').textContent = `Chuyên ${subjectName} 1 — K36`;
    document.getElementById('k36-class-a-sub').textContent = `${classA.length} học sinh • Hạng 1–35`;
    document.getElementById('k36-class-b-title').textContent = `Chuyên ${subjectName} 2 — K36`;
    document.getElementById('k36-class-b-sub').textContent = `${classB.length} học sinh • Hạng 36–70`;

    document.getElementById('k36-class-a-tbody').innerHTML = classA.map((s, i) => buildShortRow(s, i + 1)).join('');
    document.getElementById('k36-class-b-tbody').innerHTML = classB.map((s, i) => buildShortRow(s, i + 36)).join('');
}

function renderSingleClass(admitted, subjectName, total) {
    const splitPanel = document.getElementById('k36-class-split-panel');
    const singlePanel = document.getElementById('k36-single-class-panel');
    if (splitPanel) splitPanel.style.display = 'none';
    if (singlePanel) singlePanel.style.display = '';

    document.getElementById('k36-single-title').textContent = `Chuyên ${subjectName} — K36`;
    document.getElementById('k36-single-count').textContent = `${total} học sinh`;

    document.getElementById('k36-single-tbody').innerHTML = admitted.map((s, i) => buildFullRow(s, i + 1)).join('');
}

function renderClassPanels(admitted, quota, subjectName, total) {
    if (quota === 70) {
        renderDoubleClass(admitted, subjectName);
    } else {
        renderSingleClass(admitted, subjectName, total);
    }
}

// ── Main render orchestration ──

function renderSubject(students, subjectCode) {
    const subjectName = getSubjectName(subjectCode);
    const { quota, admitted, cutoffScore, qualifiedCount } = getAdmittedList(students, subjectCode);

    const { total } = renderStats(admitted, quota, cutoffScore, qualifiedCount);
    renderDistrict(admitted, total);
    renderClassPanels(admitted, quota, subjectName, total);
}

// ── Page Initializer ──

export function initK36Page() {
    destroyAllCharts();
    const students = getStudents();
    const subjects = getSubjects();

    const selectEl = document.getElementById('k36-subject-select');
    if (!selectEl) return;

    selectEl.innerHTML = subjects.map(s => `<option value="${s}">${getSubjectName(s)} (${s})</option>`).join('');

    const render = () => renderSubject(students, selectEl.value);

    render();
    selectEl.addEventListener('change', render);
}