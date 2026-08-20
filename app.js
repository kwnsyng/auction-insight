// Shared interactions for AuctionInsight prototype pages

document.addEventListener('DOMContentLoaded', () => {
  // Generic "single-select list" behavior: click an item inside [data-select-group] to mark it active
  document.querySelectorAll('[data-select-group]').forEach((group) => {
    group.addEventListener('click', (e) => {
      const item = e.target.closest('.filter-list-item');
      if (!item || !group.contains(item)) return;
      group.querySelectorAll('.filter-list-item').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Icon rail horizontal scroll via chevron button
  const rail = document.getElementById('iconRail');
  const railNext = document.getElementById('iconRailNext');
  if (rail && railNext) {
    railNext.addEventListener('click', () => {
      rail.scrollBy({ left: 220, behavior: 'smooth' });
    });
  }

  // Hero carousel dot cycling (visual only)
  const dots = document.querySelectorAll('#heroDots .dot');
  const slideLabel = document.getElementById('slideLabel');
  let current = 2; // 0-indexed, matches "03/05" default
  const total = dots.length;
  function renderDots() {
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    if (slideLabel) slideLabel.textContent = `${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  }
  document.getElementById('heroPrev')?.addEventListener('click', () => {
    current = (current - 1 + total) % total;
    renderDots();
  });
  document.getElementById('heroNext')?.addEventListener('click', () => {
    current = (current + 1) % total;
    renderDots();
  });
  dots.forEach((d, i) => d.addEventListener('click', () => { current = i; renderDots(); }));
  renderDots();

  // Filter action buttons on search page
  const resetBtn = document.getElementById('resetFilters');
  const clearBtn = document.getElementById('clearFilters');
  resetBtn?.addEventListener('click', () => {
    document.querySelectorAll('.filter-list-item').forEach((el, idx, arr) => {
      // reset each group back to its first ("전체") item
    });
    document.querySelectorAll('[data-select-group]').forEach((group) => {
      const items = group.querySelectorAll('.filter-list-item');
      items.forEach((el) => el.classList.remove('active'));
      items[0]?.classList.add('active');
    });
  });
  clearBtn?.addEventListener('click', () => resetBtn?.click());

  // My-filter save slots
  document.querySelectorAll('.my-filter-slot').forEach((slot) => {
    slot.addEventListener('click', () => {
      if (slot.dataset.filled) return;
      slot.textContent = '강남구 · 아파트 · 유찰1회↑';
      slot.dataset.filled = '1';
      slot.classList.add('text-[var(--ink)]', 'font-medium');
      slot.classList.remove('text-gray-400');
    });
  });

  // Grid/List view toggle on results
  const gridBtn = document.getElementById('viewGrid');
  const listBtn = document.getElementById('viewList');
  const results = document.getElementById('resultsGrid');
  gridBtn?.addEventListener('click', () => {
    results?.classList.remove('grid-cols-1');
    results?.classList.add('md:grid-cols-3');
    gridBtn.classList.add('bg-black', 'text-white');
    listBtn?.classList.remove('bg-black', 'text-white');
  });
  listBtn?.addEventListener('click', () => {
    results?.classList.remove('md:grid-cols-3');
    results?.classList.add('grid-cols-1');
    listBtn.classList.add('bg-black', 'text-white');
    gridBtn?.classList.remove('bg-black', 'text-white');
  });

  // Bookmark heart toggle
  document.querySelectorAll('.bookmark-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.classList.toggle('text-[var(--accent)]');
      btn.textContent = btn.classList.contains('text-[var(--accent)]') ? '♥' : '♡';
    });
  });
});
