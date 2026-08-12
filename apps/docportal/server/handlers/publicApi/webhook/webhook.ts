import {
	handleWebhookPush,
	handleWebhookRefresh,
	type WebhookDeps,
	type WebhookResult,
} from "@ext/publicApi/webhook/handleWebhook";
import type { Workspace } from "@ext/workspace/Workspace";
import type DocportalApiRequest from "../../../logic/DocportalApiRequest";
import { headers } from "../headers";

const toResponse = (result: WebhookResult): Response => {
	if (result.body === undefined) return new Response(null, { status: result.status });
	return new Response(JSON.stringify(result.body), {
		status: result.status,
		headers: { ...headers.base, ...headers.json },
	});
};

export const webhook = async (
	req: DocportalApiRequest,
	workspace: Workspace,
	deps: WebhookDeps = {},
): Promise<Response> => {
	const rawBody = req.bunReq.body ? await req.bunReq.clone().text() : "";
	return toResponse(await handleWebhookPush({ headers: req.headers, rawBody, body: req.body }, workspace, deps));
};

export const webhookRefresh = async (
	req: DocportalApiRequest,
	workspace: Workspace,
	catalogName: string,
): Promise<Response> => {
	return toResponse(await handleWebhookRefresh(req.headers, workspace, catalogName));
};
