// Calls the /api/onbid Cloudflare Pages Function (server-side proxy to the
// KAMCO Onbid 부동산 물건목록 조회서비스, getRlstCltrList2) and renders results.
// Field names follow the official OpenAPI 활용가이드 response spec.

function formatWon(amount) {
  const n = Number(amount);
  if (!n || Number.isNaN(n)) return "-";
  const eok = Math.floor(n / 100000000);
  const man = Math.round((n % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억${man.toLocaleString("ko-KR")}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString("ko-KR")}만원`;
}

function formatBidDate(raw) {
  // format: yyyyMMddHHmm. Onbid uses a 2999... sentinel for "not yet fixed".
  if (!raw || raw.length < 8 || raw.startsWith("2999")) return "일정 미정";
  const y = raw.slice(0, 4), m = raw.slice(4, 6), d = raw.slice(6, 8);
  const hh = raw.slice(8, 10), mm = raw.slice(10, 12);
  return `${y}.${m}.${d}${hh ? ` ${hh}:${mm}` : ""}`;
}

function gongmaeCardHtml(item) {
  const usage = item.cltrUsgSclsCtgrNm || item.cltrUsgMclsCtgrNm || item.prptDivNm || "";
  const address = [item.lctnSdnm, item.lctnSggnm, item.lctnEmdNm].filter(Boolean).join(" ") || item.onbidCltrNm || "";
  const minBid = /^[0-9]+$/.test(item.lowstBidPrcIndctCont || "") ? formatWon(item.lowstBidPrcIndctCont) : (item.lowstBidPrcIndctCont || "-");
  return `
    <a href="https://www.onbid.co.kr" target="_blank" rel="noopener" class="card-shadow border border-gray-200 rounded-xl overflow-hidden block">
      <div class="h-36 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-3xl relative overflow-hidden">
        ${item.thnlImgUrlAdr ? `<img src="${item.thnlImgUrlAdr}" class="w-full h-full object-cover" onerror="this.remove()">` : "🏛️"}
        <button class="bookmark-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-sm">♡</button>
      </div>
      <div class="p-4">
        <p class="text-xs text-gray-400 mb-1">${usage} · ${item.cltrMngNo || ""}</p>
        <p class="font-semibold text-sm leading-snug mb-2">${item.onbidCltrNm || address}</p>
        <div class="text-xs space-y-0.5">
          <p class="text-gray-500">감정가 <span class="text-gray-700">${formatWon(item.apslEvlAmt)}</span></p>
          <p class="text-gray-500">최저입찰가 <span class="font-bold text-black">${minBid}</span></p>
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span class="bg-gray-100 rounded px-2 py-0.5">${item.pbctStatNm || ""}${item.usbdNft ? ` · 유찰 ${item.usbdNft}회` : ""}</span>
          <span>📅 ${formatBidDate(item.cltrBidBgngDt)}</span>
        </div>
      </div>
    </a>`;
}

const STATUS_CODE = { ongoing: "0002", upcoming: "0001" };

async function loadGongmaeListings() {
  const grid = document.getElementById("resultsGrid");
  const banner = document.getElementById("dataStatusBanner");
  if (!grid) return;

  const params = new URLSearchParams();
  const sido = document.getElementById("filterSido")?.value;
  const keyword = document.getElementById("filterKeyword")?.value?.trim();
  const status = document.getElementById("filterStatus")?.value;
  if (sido) params.set("lctnSdnm", sido);
  if (keyword) params.set("onbidCltrNm", keyword);
  params.set("numOfRows", "30");

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

    if (data.error) {
      banner.className = "text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 my-4";
      banner.textContent = "⚠️ " + (data.message || "온비드 API 오류가 발생했습니다.");
      grid.innerHTML = "";
      return;
    }

    let items = data.items || [];
    if (status && STATUS_CODE[status]) {
      items = items.filter((it) => it.pbctStatCd === STATUS_CODE[status]);
    }

    banner.className = "text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 my-4";
    banner.textContent = `✅ 온비드 실시간 연동 중 · 총 ${data.totalCount?.toLocaleString?.("ko-KR") ?? items.length}건 중 ${items.length}건 표시`;
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
