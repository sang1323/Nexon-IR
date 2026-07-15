export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 내 대시보드에서 "/proxy" 라는 이름표를 달고 요청이 오면?
    if (url.pathname.startsWith('/proxy')) {
      const targetUrl = url.searchParams.get("url");
      
      // 회사 보안망을 대신 뚫고 목적지(DART 등)에서 데이터 가져오기
      const response = await fetch(targetUrl, request);
      
      // 웹사이트 에러(CORS)가 안 나게 안전하게 포장해서 돌려주기
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      return newResponse;
    }

    // 그 외의 요청(index.html 등)은 원래대로 정상적으로 띄워주기
    return env.ASSETS.fetch(request);
  }
};
