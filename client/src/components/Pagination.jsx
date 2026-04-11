/**
 * Props:
 *   page        – current page (1-based)
 *   totalPages  – total number of pages
 *   total       – total number of items
 *   limit       – items per page
 *   onPage      – (page: number) => void
 */
const Pagination = ({ page, totalPages, total, limit, onPage }) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  // Build page numbers: always show first, last, current ±1, and ellipses
  const pages = [];
  const add = (n) => { if (!pages.includes(n) && n >= 1 && n <= totalPages) pages.push(n); };
  add(1);
  add(page - 1); add(page); add(page + 1);
  add(totalPages);
  pages.sort((a, b) => a - b);

  // Insert null gaps for ellipses
  const withGaps = [];
  for (let i = 0; i < pages.length; i++) {
    withGaps.push(pages[i]);
    if (i < pages.length - 1 && pages[i + 1] - pages[i] > 1) withGaps.push(null);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{start}–{end}</span> of <span className="font-medium text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        {withGaps.map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-1.5 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
