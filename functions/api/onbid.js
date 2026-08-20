// Cloudflare Pages Function: server-side proxy for the KAMCO(한국자산관리공사)
// Onbid public-auction real-estate listing Open API (data.go.kr).
//
// Why a proxy: the data.go.kr service key must never be exposed to the browser,
// and the upstream API does not send CORS headers for direct client calls.
//
// Setup (one-time, after the data.go.kr application is approved):
//   wrangler pages secret put ONBID_SERVICE_KEY --project-name=auction-insight
//   wrangler pages secret put ONBID_API_BASE --project-name=auction-insight
// ONBID_API_BASE is the exact "요청 URL(Endpoint)" shown on the data.go.kr
// activation page for the "부동산 공매물건 목록 조회" operation.

export async function onRequestGet(context) {
  const { request, env } = context;
  const serviceKey = env.ONBID_SERVICE_KEY;
  const apiBase = env.ONBID_API_BASE;

  if (!serviceKey || !apiBase) {
    return Response.json(
      {
        ready: false,
        message: "온비드 API가 아직 연결되지 않았습니다. ONBID_SERVICE_KEY / ONBID_API_BASE 환경변수를 설정해주세요.",
      },
      { status: 501 }
    );
  }

  const incoming = new URL(request.url);
  const upstream = new URL(apiBase);
  upstream.searchParams.set("serviceKey", serviceKey);
  upstream.searchParams.set("numOfRows", incoming.searchParams.get("numOfRows") || "20");
  upstream.searchParams.set("pageNo", incoming.searchParams.get("pageNo") || "1");
  upstream.searchParams.set("type", "json");

  // Pass through optional search filters if present (names TBD once the
  // real API spec is confirmed from the data.go.kr activation screenshot).
  for (const key of ["sido", "sgg", "usageCode", "cltrNo"]) {
    const v = incoming.searchParams.get(key);
    if (v) upstream.searchParams.set(key, v);
  }

  try {
    const upstreamRes = await fetch(upstream.toString());
    const body = await upstreamRes.text();
    return new Response(body, {
      status: upstreamRes.status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return Response.json({ ready: false, message: "온비드 API 호출에 실패했습니다.", error: String(err) }, { status: 502 });
  }
}
