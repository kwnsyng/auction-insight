// Calls the /api/onbid Cloudflare Pages Function (server-side proxy to the
// KAMCO Onbid public-auction Open API) and renders results. Until the
// ONBID_SERVICE_KEY / ONBID_API_BASE env vars are set on the Pages project,
// the function returns { ready: false } and this page shows a setup notice
// instead of fake data.

function gongmaeCardHtml(item) {
  return `
    <a href="${item.detailUrl || "#"}" class="card-shadow border border-gray-200 rounded-xl overflow-hidden block">
      <div class="h-36 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-3xl relative">
        🏛️
        <button class="bookmark-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-sm">♡</button>
      </div>
      <div class="p-4">
        <p class="text-xs text-gray-400 mb-1">${item.usage || ""} · ${item.cltrNo || ""}</p>
        <p class="font-semibold text-sm leading-snug mb-2">${item.address || ""}</p>
        <div class="text-xs space-y-0.5">
          <p class="text-gray-500">감정가 <span class="text-gray-700">${item.appraisal || "-"}</span></p>
          <p class="text-gray-500">최저입찰가 <span class="font-bold text-black">${item.minBid || "-"}</span></p>
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span>${item.bidDate || ""}</span>
        </div>
      </div>
    </a>`;
}

async function loadGongmaeListings() {
  const grid = document.getElementById("resultsGrid");
  const banner = document.getElementById("dataStatusBanner");
  if (!grid) return;

  const params = new URLSearchParams();
  const sido = document.getElementById("filterSido")?.value;
  const usageCode = document.getElementById("filterUsage")?.value;
  if (sido) params.set("sido", sido);
  if (usageCode) params.set("usageCode", usageCode);

  grid.innerHTML = `<p class="text-sm text-gray-400 col-span-full py-10 text-center">불러오는 중…</p>`;

  try {
    const res = await fetch(`/api/onbid?${params.toString()}`);
    const data = await res.json();

    if (!data.ready) {
      banner.className = "text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 my-4";
      banner.textContent = "⚙️ " + (data.message || "온비드 API 연동 준비 중입니다.");
      grid.innerHTML = `<p class="text-sm text-gray-400 col-span-full py-10 text-center">API 키가 설정되면 이 자리에 실시간 공매 물건이 표시됩니다.</p>`;
      return;
    }

    const items = data.items || [];
    banner.className = "text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 my-4";
    banner.textContent = `✅ 온비드 실시간 연동 중 · 총 ${items.length}건`;
    grid.innerHTML = items.length
      ? items.map(gongmaeCardHtml).join("")
      : `<p class="text-sm text-gray-400 col-span-full py-10 text-center">조건에 맞는 물건이 없습니다.</p>`;
  } catch (err) {
    banner.className = "text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 my-4";
    banner.textContent = "⚠️ 온비드 API 호출 중 오류가 발생했습니다.";
    grid.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadGongmaeListings();
  document.getElementById("searchBtn")?.addEventListener("click", loadGongmaeListings);
});
