/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import { findCommand } from "@app/commands";
import { ResponseKind } from "@app/types/ResponseKind";
import type HashItem from "@core/Hash/HashItems/HashItem";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type ServerContext from "../types/ServerContext";
import withContext from "../utils/withContext";

const api = async ({ path, req, res, app, commands }: ServerContext) => {
	if (!path.pathname.startsWith("/api/")) return;

	const command = findCommand(commands, path.pathname.slice(`/api/`.length));
	if (!command) {
		console.error(`Command ${path} not found`);
		return new Response("Not Found", { status: 404 });
	}

	try {
		const signal = req.bunReq.signal;
		const ctx = await app.contextFactory.fromNode({ req, res });
		const query = Object.fromEntries(path.searchParams);

		const params = command.params(ctx, query, await parseBody(req.bunReq), signal);
		const result = await withContext(ctx, async () => await command.do(params));

		if (signal.aborted) {
			return new Response(null, { status: 499 });
		}

		const response = await respond(req.bunReq, command.kind, result);
		if (response) return res.mergeInto(response);

		return res.mergeInto(new Response("Not Found", { status: 404 }));
	} catch (error) {
		console.error(`API error ${path.pathname}:`, error);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

const parseBody = async (req: Request) => {
	if (!req.body) return;

	const contentType = req.headers.get("Content-Type") ?? "";

	if (contentType.includes("application/json")) {
		return await req.json();
	}

	if (contentType.includes("text/")) {
		const text = await req.text();
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	}

	if (contentType.includes("multipart/form-data")) {
		return await req.formData();
	}

	return await req.arrayBuffer();
};

const respond = async (req: Request, kind: ResponseKind, commandResult: any) => {
	if (kind === ResponseKind.none) {
		return new Response("OK", { status: 200 });
	}

	if (kind === ResponseKind.json) {
		return new Response(JSON.stringify(commandResult), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}
	if (kind === ResponseKind.plain)
		return new Response(commandResult, {
			status: 200,
			headers: { "Content-Type": "text/plain" },
		});

	if (kind === ResponseKind.blob) {
		if (!commandResult) return new Response("No Content", { status: 204 });

		const { mime, hashItem } = commandResult as {
			mime: MimeTypes;
			hashItem: HashItem;
		};
		let response = new Response();
		if (hashItem)
			response = new Response((await hashItem.getContentAsBinary()) as any, {
				status: 200,
			});
		if (mime) response.headers.set("Content-Type", mime);
		if (mime === MimeTypes.xml || mime === MimeTypes.xls || mime === MimeTypes.xlsx)
			response.headers.set(
				"Content-Disposition",
				`attachment; filename=${encodeURIComponent((req as any).query?.src as string)}`,
			);

		return response;
	}

	if (kind === ResponseKind.file) {
		return new Response(commandResult, { status: 200 });
	}

	if (kind === ResponseKind.redirect) {
		return new Response(commandResult, {
			status: 302,
			headers: { Location: commandResult },
		});
	}

	if (kind === ResponseKind.html) {
		return new Response(commandResult, {
			status: 200,
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	}

	if (kind === ResponseKind.stream) {
		const { mime, iterator } = commandResult;
		const sink = new Bun.ArrayBufferSink();
		for await (const item of iterator) sink.write(item);
		return new Response(sink.end(), {
			headers: {
				"Content-Type": mime ?? "application/octet-stream",
				"Cache-Control": "no-store",
			},
		});
	}

	throw new Error("Invalid ResponseKind");
};

export default api;
