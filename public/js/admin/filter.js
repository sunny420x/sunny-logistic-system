(function () {
    const filterKey = `admin-filter:${window.location.pathname.replace(/\/+$/, '') || '/'}`;
    const currentQuery = window.location.search;
    const savedQuery = localStorage.getItem(filterKey);
    const isListPage = !/\/add(?:\/|$)|\/edit(?:\/|$)|\/view(?:\/|$)/.test(window.location.pathname);

    window.clearFilterState = function () {
        localStorage.removeItem(filterKey);
    };

    if (isListPage && !currentQuery && savedQuery) {
        window.location.replace(`${window.location.pathname}${savedQuery}`);
        return;
    }

    if (currentQuery) {
        localStorage.setItem(filterKey, currentQuery);
    }

    document.querySelectorAll('form[method="get"], form:not([method])').forEach((form) => {
        form.addEventListener('submit', () => {
            localStorage.removeItem(filterKey);
        });
    });
})();