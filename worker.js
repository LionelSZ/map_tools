export default {
    async fetch(request, env, ctx) {
        try {
            return await env.ASSETS.fetch(request);
        } catch (err) {
            return await env.ASSETS.fetch("index.html");
        }
    }
}
