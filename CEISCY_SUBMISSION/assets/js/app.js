/**
 * HOSTEL HUB — Client-Side Scripts (PHP/MySQL Version)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Flash toast auto-dismiss
  const toasts = document.querySelectorAll('.flash-toast');
  toasts.forEach(toast => {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  });

  // Client-side quick filter on hostels page
  const searchInput = document.getElementById('hostelSearchInput');
  const locationSelect = document.getElementById('locationSelect');
  const priceRange = document.getElementById('priceRange');
  const priceDisplay = document.getElementById('priceDisplay');
  const hostelCards = document.querySelectorAll('.hostel-card-item');

  if (priceRange && priceDisplay) {
    priceRange.addEventListener('input', (e) => {
      priceDisplay.textContent = 'GH₵ ' + Number(e.target.value).toLocaleString();
      filterHostels();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterHostels);
  }

  if (locationSelect) {
    locationSelect.addEventListener('change', filterHostels);
  }

  function filterHostels() {
    if (!hostelCards.length) return;
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedLoc = (locationSelect ? locationSelect.value : '').toLowerCase().trim();
    const maxPrice = priceRange ? Number(priceRange.value) : 20000;

    let visibleCount = 0;
    hostelCards.forEach(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const loc = (card.dataset.location || '').toLowerCase();
      const price = Number(card.dataset.price || 0);

      const matchesQuery = !query || name.includes(query) || loc.includes(query);
      const matchesLoc   = !selectedLoc || loc.includes(selectedLoc);
      const matchesPrice = price <= maxPrice;

      if (matchesQuery && matchesLoc && matchesPrice) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    const noResults = document.getElementById('noResultsMessage');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  // Print Receipt Button Handler
  const printBtn = document.getElementById('printReceiptBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});
