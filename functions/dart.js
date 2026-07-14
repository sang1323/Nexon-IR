export async function onRequest(context) {
  // 1. 여기에 대표님의 API 키를 직접 적어주세요! (큰따옴표 유지)
  const DART_KEY = "5dc27d8d420eaa1f4d21d013454d2850741fee9e";
  
  // 2. 검색할 기업 고유번호 받기
  const url = new URL(context.request.url);
  const corpCode = url.searchParams.get("corp_code");

  // 3. 우회 없이 클라우드플레어가 DART 서버와 직접 통신합니다 (보안 안 막힘!)
  const targetUrl = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${DART_KEY}&corp_code=${corpCode}&bsns_year=2023&reprt_code=11011`;
  
  const response = await fetch(targetUrl);
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
