// Cloudflare Pages Function: server-side proxy for the KAMCO(한국자산관리공사)
// Onbid 부동산 물건목록 조회서비스 (data.go.kr, service ID SVC-API-001).
//
// Confirmed from the official "OpenAPI 활용가이드" doc:
//   Base URL : https://apis.data.go.kr/B010003/OnbidRlstListSrvc2
//   Operation: getRlstCltrList2
//   Required params: serviceKey, pageNo, numOfRows, resultType, prptDivCd, pvctTrgtYn
//
// The service key must never be exposed to the browser, so all calls go
// through this proxy.
//
// Setup (already done once, repeat only if the key rotates):
//   wrangler pages secret put ONBID_SERVICE_KEY --project-name=auction-insight

const ENDPOINT = "https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2";

// 재산유형코드 전체 목록 — 사용자가 필터를 지정하지 않으면 전체를 조회한다 (prptDivCd는 필수 파라미터).
const ALL_PRPT_DIV_CD = "0007,0010,0005,0004,0002,0003,0006,0008,0011,0013";

export async function onRequestGet(context) {
  const { request, env } = context;
  const serviceKey = env.ONBID_SERVICE_KEY;

  if (!serviceKey) {
    return Response.json(
      { ready: false, message: "온비드 API가 아직 연결되지 않았습니다. ONBID_SERVICE_KEY 환경변수를 설정해주세요." },
      { status: 501 }
    );
  }

  const incoming = new URL(request.url);
  const upstream = new URL(ENDPOINT);
  upstream.searchParams.set("serviceKey", serviceKey);
  upstream.searchParams.set("pageNo", incoming.searchParams.get("pageNo") || "1");
  upstream.searchParams.set("numOfRows", incoming.searchParams.get("numOfRows") || "20");
  upstream.searchParams.set("resultType", "json");
  upstream.searchParams.set("prptDivCd", incoming.searchParams.get("prptDivCd") || ALL_PRPT_DIV_CD);
  upstream.searchParams.set("pvctTrgtYn", incoming.searchParams.get("pvctTrgtYn") || "N");

  // Optional filters, passed through only if provided by the client.
  for (const key of [
    "lctnSdnm", "lctnSggnm", "lctnEmdNm",
    "cltrUsgLclsCtgrId", "cltrUsgMclsCtgrId", "cltrUsgSclsCtgrId",
    "lowstBidPrcStart", "lowstBidPrcEnd",
    "landSqmsStart", "landSqmsEnd",
    "bldSqmsStart", "bldSqmsEnd",
    "bidPrdYmdStart", "bidPrdYmdEnd",
    "usbdNftStart", "usbdNftEnd",
    "apslEvlAmtStart", "apslEvlAmtEnd",
    "onbidCltrNm", "alcYn",
  ]) {
    const v = incoming.searchParams.get(key);
    if (v) upstream.searchParams.set(key, v);
  }

  try {
    const upstreamRes = await fetch(upstream.toString());
    const raw = await upstreamRes.json();

    if (raw?.result?.resultCode) {
      // Gateway-level error (missing/invalid params, bad key, etc.) — no header/body payload.
      return Response.json(
        { ready: true, error: true, message: raw.result.resultMsg || "온비드 API 오류", items: [] },
        { status: 200 }
      );
    }

    const resultCode = raw?.header?.resultCode;
    if (resultCode !== "00") {
      return Response.json(
        { ready: true, error: true, message: raw?.header?.resultMsg || "온비드 API 오류", items: [] },
        { status: 200 }
      );
    }

    const rawItems = raw?.body?.items?.item;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    return Response.json({
      ready: true,
      error: false,
      totalCount: raw?.body?.totalCount ?? items.length,
      pageNo: raw?.body?.pageNo ?? 1,
      items,
    });
  } catch (err) {
    return Response.json({ ready: true, error: true, message: "온비드 API 호출에 실패했습니다.", error_detail: String(err), items: [] }, { status: 200 });
  }
}
