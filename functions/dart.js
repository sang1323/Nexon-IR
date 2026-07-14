export async function onRequest(context) {
  try {
    // 1. 대표님 API 키 입력 (따옴표 유지!)
    const DART_KEY = "5dc27d8d420eaa1f4d21d013454d2850741fee9e"; 
    
    const url = new URL(context.request.url);
    const corpCode = url.searchParams.get("corp_code");

    const targetUrl = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${DART_KEY}&corp_code=${corpCode}&bsns_year=2023&reprt_code=11011`;
    
    // 2. DART에 통신 요청
    const response = await fetch(targetUrl);
    
    // 3. 기절 방지: 결과가 뭐든 일단 '글자'로 안전하게 받아서 그대로 전달!
    const textData = await response.text(); 

    return new Response(textData, {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    // 요원이 에러가 나도 기절하지 않고 우리에게 에러 이유를 말해줍니다.
    return new Response(JSON.stringify({ status: "999", message: "요원 기절함: " + error.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
