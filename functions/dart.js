export async function onRequest(context) {
  try {
    const DART_KEY = "5dc27d8d420eaa1f4d21d013454d2850741fee9e"; 
    
    const url = new URL(context.request.url);
    const corpCode = url.searchParams.get("corp_code");

    const targetUrl = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${DART_KEY}&corp_code=${corpCode}&bsns_year=2023&reprt_code=11011`;
    
    const response = await fetch(targetUrl);
    const textData = await response.text(); 

    return new Response(textData, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "999", message: "요원 기절함: " + error.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
