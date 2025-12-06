export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 访问静态文件时直接返回
        const ext = url.pathname.split(".").pop();
        if (["js", "css", "html", "svg", "png", "ico", "json", "jpg", "txt"].includes(ext)) {
            return env.ASSETS.fetch(request);
        }

        // 其他路径回退到 index.html (SPA 必须)
        return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
    },
};
