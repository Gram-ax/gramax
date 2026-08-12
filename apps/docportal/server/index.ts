import getApp from "@app/node/app";
import getCommands from "@app/node/commands";
import isProduction from "../../../scripts/isProduction.mjs";
import api from "./handlers/api";
import auth from "./handlers/auth";
import clientAssets from "./handlers/clientAssets";
import health from "./handlers/health";
import page from "./handlers/page";
import publicApi from "./handlers/publicApi";
import seo from "./handlers/seo";
import DocportalApiRequest from "./logic/DocportalApiRequest";
import DocportalApiResponse from "./logic/DocportalApiResponse";
import type ServerContext from "./types/ServerContext";
import { applyBasePath } from "./utils/basePath";
import parseRequestBody from "./utils/parseRequestBody";

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
		const url = new URL(req.url);
		const redirect = applyBasePath(url);
		if (redirect) return redirect;
		const ctx: ServerContext = {
			app,
			path: url,
			commands: getCommands(app),
			res: new DocportalApiResponse(new Response()),
			req: new DocportalApiRequest(req, await parseRequestBody(req)),
		};

		for (const handler of [seo, publicApi, auth, health, clientAssets, api, page]) {
			const response = await handler(ctx);
			if (response) return gzip(req, response);
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`Server started at http://localhost:${server.port}`);
