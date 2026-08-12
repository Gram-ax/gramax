/** @jest-environment node */
import type { PullOutcome } from "@core/AutoPull/AutoPull";
import { createHmac } from "crypto";
import DocportalApiRequest from "../../../logic/DocportalApiRequest";
import { webhook, webhookRefresh } from "./webhook";

const SECRET = "test-secret";

const makeCatalog = (name: string, remoteUrl: string, branch: string) => ({
	name,
	repo: {
		storage: { getUrl: async () => remoteUrl },
		gvc: { getCurrentBranchName: async () => branch },
	},
});

const makeWorkspace = (catalogs: ReturnType<typeof makeCatalog>[], reconcileResult = "refreshed") => ({
	getAllCatalogs: () => new Map(catalogs.map((c) => [c.name, c])),
	reconcileCatalogFromDisk: jest.fn(async () => reconcileResult),
});

const githubRequest = (body: object, secret = SECRET) => {
	const raw = JSON.stringify(body);
	const signature = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
	const bunReq = new Request("http://localhost/api/webhook", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"X-GitHub-Event": "push",
			"X-Hub-Signature-256": signature,
		},
		body: raw,
	});
	return new DocportalApiRequest(bunReq, body);
};

const githubPushBody = (cloneUrl: string, ref = "refs/heads/main") => ({
	ref,
	repository: { ssh_url: cloneUrl, clone_url: cloneUrl },
});

describe("webhook", () => {
	const OLD_ENV = process.env;
	beforeEach(() => {
		process.env = { ...OLD_ENV, WEBHOOK_SECRET: SECRET };
	});
	afterEach(() => {
		process.env = OLD_ENV;
	});

	it("returns 404 when WEBHOOK_SECRET is not set", async () => {
		delete process.env.WEBHOOK_SECRET;
		const req = githubRequest(githubPushBody("https://h/g/r.git"));
		const res = await webhook(req, makeWorkspace([]) as never, { pull: jest.fn() });
		expect(res.status).toBe(404);
	});

	it("returns 401 on invalid signature", async () => {
		const req = githubRequest(githubPushBody("https://h/g/r.git"), "wrong-secret");
		const res = await webhook(req, makeWorkspace([]) as never, { pull: jest.fn() });
		expect(res.status).toBe(401);
	});

	it("returns 200 and pulls the matched catalog in background", async () => {
		const catalog = makeCatalog("docs", "git@h:g/r.git", "main");
		const pull = jest.fn(async (_catalog: unknown): Promise<PullOutcome> => "pulled");
		const req = githubRequest(githubPushBody("https://h/g/r.git"));
		const res = await webhook(req, makeWorkspace([catalog]) as never, { pull });
		expect(res.status).toBe(200);
		await new Promise((r) => setTimeout(r, 0));
		expect(pull).toHaveBeenCalledTimes(1);
		expect(pull.mock.calls[0][0]).toBe(catalog);
	});

	it("returns 200 without pull when no catalog matches", async () => {
		const pull = jest.fn(async (): Promise<PullOutcome> => "pulled");
		const req = githubRequest(githubPushBody("https://h/other/repo.git"));
		const res = await webhook(req, makeWorkspace([makeCatalog("docs", "git@h:g/r.git", "main")]) as never, {
			pull,
		});
		expect(res.status).toBe(200);
		await new Promise((r) => setTimeout(r, 0));
		expect(pull).not.toHaveBeenCalled();
	});

	it("returns 200 without pull when pushed ref is another branch", async () => {
		const pull = jest.fn(async (): Promise<PullOutcome> => "pulled");
		const catalog = makeCatalog("docs", "git@h:g/r.git", "main");
		const req = githubRequest(githubPushBody("https://h/g/r.git", "refs/heads/feature"));
		const res = await webhook(req, makeWorkspace([catalog]) as never, { pull });
		expect(res.status).toBe(200);
		await new Promise((r) => setTimeout(r, 0));
		expect(pull).not.toHaveBeenCalled();
	});

	it("returns 400 when no provider header present", async () => {
		const bunReq = new Request("http://localhost/api/webhook", { method: "POST", body: "{}" });
		const req = new DocportalApiRequest(bunReq, {});
		const res = await webhook(req, makeWorkspace([]) as never, { pull: jest.fn() });
		expect(res.status).toBe(400);
	});
});

describe("webhookRefresh", () => {
	const OLD_ENV = process.env;
	beforeEach(() => {
		process.env = { ...OLD_ENV, WEBHOOK_SECRET: SECRET };
	});
	afterEach(() => {
		process.env = OLD_ENV;
	});

	const refreshRequest = (token?: string) => {
		const bunReq = new Request("http://localhost/api/webhook/refresh/docs", {
			method: "POST",
			headers: token ? { "X-Webhook-Token": token } : {},
		});
		return new DocportalApiRequest(bunReq, undefined);
	};

	it("returns 404 when WEBHOOK_SECRET is not set", async () => {
		delete process.env.WEBHOOK_SECRET;
		const res = await webhookRefresh(refreshRequest(SECRET), makeWorkspace([]) as never, "docs");
		expect(res.status).toBe(404);
	});

	it("returns 401 on invalid token", async () => {
		const res = await webhookRefresh(refreshRequest("wrong"), makeWorkspace([]) as never, "docs");
		expect(res.status).toBe(401);
	});

	it("returns 404 when the catalog is neither on disk nor in memory", async () => {
		const ws = makeWorkspace([], "not-found");
		const res = await webhookRefresh(refreshRequest(SECRET), ws as never, "docs");
		expect(res.status).toBe(404);
		expect(ws.reconcileCatalogFromDisk).toHaveBeenCalledWith("docs");
	});

	it("reconciles a known catalog and returns 200 with the reconcile result", async () => {
		const ws = makeWorkspace([makeCatalog("docs", "git@h:g/r.git", "main")], "refreshed");
		const res = await webhookRefresh(refreshRequest(SECRET), ws as never, "docs");
		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({ status: "refreshed", catalog: "docs" });
		expect(ws.reconcileCatalogFromDisk).toHaveBeenCalledWith("docs");
	});

	it("reports removal when a peer deleted the catalog from disk", async () => {
		const ws = makeWorkspace([], "removed");
		const res = await webhookRefresh(refreshRequest(SECRET), ws as never, "docs");
		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({ status: "removed", catalog: "docs" });
	});
});
