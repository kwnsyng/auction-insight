// Renders the 경매검색 result cards from data/auction-listings.json so the
// listing set can be refreshed by editing that file (e.g. from screenshots/CSV)
// without touching page markup.

function auctionCardHtml(item) {
  const addressLine = item.addressDetail ? `${item.address}<br>${item.addressDetail}` : item.address;
  return `
    <a href="#" class="card-shadow border border-gray-200 rounded-xl overflow-hidden block">
      <div class="h-36 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-3xl relative">
        ${item.emoji || "🏠"}
        <button class="bookmark-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-sm">♡</button>
      </div>
      <div class="p-4">
        <p class="text-xs text-gray-400 mb-1">${item.type} · ${item.caseNumber}</p>
        <p class="font-semibold text-sm leading-snug mb-2">${addressLine}</p>
        <p class="text-xs text-gray-400 mb-2">토지 ${item.landArea} · 건물 ${item.buildingArea}</p>
        <div class="text-xs space-y-0.5">
          <p class="text-gray-500">감정가 <span class="text-gray-700">${item.appraisal}</span></p>
          <p class="text-gray-500">최저가 <span class="font-bold text-black">${item.minBid}</span> <span class="text-[var(--accent)] font-semibold">${item.discountPct}%↓</span></p>
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span class="bg-gray-100 rounded px-2 py-0.5">유찰 ${item.failCount}회</span>
          <span>📅 ${item.saleDate}</span>
        </div>
        <p class="text-[11px] text-gray-300 mt-1">조회 ${item.views.toLocaleString("ko-KR")}</p>
      </div>
    </a>`;
}

async function loadAuctionListings() {
  const grid = document.getElementById("resultsGrid");
  if (!grid) return;
  try {
    const res = await fetch("data/auction-listings.json");
    const data = await res.json();
    grid.innerHTML = data.items.map(auctionCardHtml).join("");

    const banner = document.getElementById("dataStatusBanner");
    if (banner && data.source === "demo") {
      banner.textContent = `🧪 예시 데이터 표시 중 (${data.updatedAt} 기준) — 법원경매 공식 실시간 API가 없어 스크린샷/CSV 기반으로 순차 반영 예정입니다.`;
    }
  } catch (err) {
    grid.innerHTML = `<p class="text-sm text-red-400 col-span-full py-10 text-center">데이터를 불러오지 못했습니다.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadAuctionListings);
