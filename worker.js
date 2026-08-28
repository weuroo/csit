export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;

    return new HTMLRewriter()
      .on('body', {
        element(el) {
          el.append('<script src="/layout-fix.js" defer></script>', { html: true });
        }
      })
      .transform(response);
  }
};
