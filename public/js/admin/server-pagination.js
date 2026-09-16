window.adminFormatDate = function (value, includeTime = false) {
    if (!window.moment) return '-';
    const date = window.moment(value);
    if (!date.isValid()) return '-';
    return date.format(includeTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY');
};

window.AdminServerPagination = function ({ resource, tableBody, pagination, getFilters, renderRow, colspan, pageSize = 20, onRowsLoaded }) {
    let currentPage = 1;

    function skeletonRows() {
        return Array.from({ length: Math.min(6, pageSize) }, (_, index) => `<tr class="skeleton-row" aria-hidden="true">
            ${Array.from({ length: colspan }, (_, cellIndex) => `<td><span class="skeleton-line ${((index + cellIndex) % 4 === 0) ? 'short' : ''}"></span></td>`).join('')}
        </tr>`).join('');
    }

    function renderPagination(meta) {
        const wrapper = document.getElementById(pagination);
        if (!wrapper) return;
        if (!meta.total) {
            wrapper.innerHTML = '';
            return;
        }
        const buttons = [];
        const start = Math.max(1, meta.page - 2);
        const end = Math.min(meta.totalPages, meta.page + 2);
        buttons.push(`<button class="btn btn-outline-secondary btn-sm" ${meta.page <= 1 ? 'disabled' : ''} data-page="${meta.page - 1}">ก่อนหน้า</button>`);
        for (let page = start; page <= end; page += 1) {
            buttons.push(`<button class="btn btn-sm ${page === meta.page ? 'btn-primary' : 'btn-outline-primary'}" data-page="${page}">${page}</button>`);
        }
        buttons.push(`<button class="btn btn-outline-secondary btn-sm" ${meta.page >= meta.totalPages ? 'disabled' : ''} data-page="${meta.page + 1}">ถัดไป</button>`);
        wrapper.innerHTML = `<div class="d-flex justify-content-between align-items-center gap-2 flex-wrap"><span class="text-muted">ทั้งหมด ${meta.total} รายการ</span><div class="btn-group">${buttons.join('')}</div></div>`;
        wrapper.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => {
            const nextPage = Number(button.dataset.page);
            if (nextPage >= 1 && nextPage <= meta.totalPages && nextPage !== meta.page) load(nextPage);
        }));
    }

    async function load(page = 1) {
        const body = document.getElementById(tableBody);
        const filters = { ...(getFilters ? getFilters() : {}) };
        filters.page = page;
        filters.pageSize = pageSize;
        body.innerHTML = skeletonRows();
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== '')).toString();
        try {
            const response = await fetch(`/api/admin/page/${resource}?${query}`);
            const data = await response.json();
            if (!response.ok || data.status !== 'success') throw new Error(data.message || 'โหลดข้อมูลไม่สำเร็จ');
            currentPage = data.page;
            body.innerHTML = data.rows.length
                ? data.rows.map(renderRow).join('')
                : `<tr><td colspan="${colspan}" class="text-muted text-center">ไม่พบข้อมูล</td></tr>`;
            renderPagination(data);
            if (onRowsLoaded) onRowsLoaded(data.rows);
        } catch (error) {
            console.error(`Pagination error (${resource}):`, error);
            body.innerHTML = `<tr><td colspan="${colspan}" class="text-danger text-center">${error.message || 'ไม่สามารถโหลดข้อมูลได้'}</td></tr>`;
            renderPagination({ total: 0 });
        }
    }

    return { load };
};
