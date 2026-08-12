export type WebhookProvider = "github" | "gitlab";

export type PushEvent = {
	repoUrls: string[];
	branch: string | null;
};

type PushPayload = {
	ref?: unknown;
	repository?: { ssh_url?: unknown; clone_url?: unknown };
	project?: { git_ssh_url?: unknown; git_http_url?: unknown };
};

const branchFromRef = (ref: unknown): string | null => {
	if (typeof ref !== "string") return null;
	const prefix = "refs/heads/";
	return ref.startsWith(prefix) ? ref.slice(prefix.length) : null;
};

const parsePushEvent = (provider: WebhookProvider, body: unknown): PushEvent | null => {
	if (!body || typeof body !== "object") return null;
	const payload = body as PushPayload;

	const repoUrls =
		provider === "github"
			? [payload.repository?.ssh_url, payload.repository?.clone_url]
			: [payload.project?.git_ssh_url, payload.project?.git_http_url];

	const urls = repoUrls.filter((u): u is string => typeof u === "string" && u.length > 0);
	if (!urls.length) return null;

	return { repoUrls: urls, branch: branchFromRef(payload.ref) };
};

export default parsePushEvent;
