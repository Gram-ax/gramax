import getApp from "@app/node/app";
import getCommands from "@app/node/commands";
import isProduction from "scripts/isProduction.mjs";
import api from "./handlers/api";
import clientAssets from "./handlers/clientAssets";
import page from "./handlers/page";
import publicApi from "./handlers/publicApi";
import seo from "./handlers/seo";
import DocportalApiRequest from "./logic/DocportalApiRequest";
import DocportalApiResponse from "./logic/DocportalApiResponse";
import type ServerContext from "./types/ServerContext";

const gzip = async (req: Request, res: Response): Promise<Response> => {
	if (!req.headers.get("Accept-Encoding")?.includes("gzip")) return res;
	const compressed = Bun.gzipSync(await res.arrayBuffer());
	const headers = new Headers(res.headers);
	headers.set("Content-Encoding", "gzip");
	headers.set("Content-Length", String(compressed.byteLength));
	return new Response(compressed, { status: res.status, headers });
};

const server = Bun.serve({
	port: Number(process.env.PORT ?? 3000),
	idleTimeout: 30,
	development: isProduction() ? undefined : { hmr: true },
	async fetch(req) {
		const app = await getApp();
		const ctx: ServerContext = {
			app,
			path: new URL(req.url),
			commands: getCommands(app),
			req: new DocportalApiRequest(req),
			res: new DocportalApiResponse(new Response()),
		};

		for (const handler of [seo, publicApi, clientAssets, api, page]) {
			const response = await handler(ctx);
			if (response) return gzip(req, response);
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`Server started at http://localhost:${server.port}`);
