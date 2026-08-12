/** @jest-environment node */
import notifyPeers from "./notifyPeers";

const SECRET = "test-secret";

describe("notifyPeers", () => {
	const OLD_ENV = process.env;
	let fetchMock: jest.Mock;

	beforeEach(() => {
		process.env = { ...OLD_ENV };
		fetchMock = jest.fn(async () => new Response(null, { status: 200 }));
		global.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		process.env = OLD_ENV;
	});

	it("does nothing when WEBHOOK_PEERS is unset", async () => {
		delete process.env.WEBHOOK_PEERS;
		await notifyPeers("docs", SECRET, "pull");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("does nothing when secret is empty", async () => {
		process.env.WEBHOOK_PEERS = "http://peer-a";
		await notifyPeers("docs", "", "pull");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("posts a refresh to every peer with the token, trimming trailing slashes", async () => {
		process.env.WEBHOOK_PEERS = "http://peer-a/ , http://peer-b//";
		await notifyPeers("my catalog", SECRET, "checkout");

		expect(fetchMock).toHaveBeenCalledTimes(2);
		const urls = fetchMock.mock.calls.map((c) => c[0]);
		expect(urls).toContain("http://peer-a/api/webhook/refresh/my%20catalog");
		expect(urls).toContain("http://peer-b/api/webhook/refresh/my%20catalog");
		expect(fetchMock.mock.calls[0][1]).toMatchObject({
			method: "POST",
			headers: { "X-Webhook-Token": SECRET },
		});
	});

	it("is best-effort: a failing peer does not throw", async () => {
		process.env.WEBHOOK_PEERS = "http://peer-a,http://peer-b";
		fetchMock.mockImplementationOnce(async () => {
			throw new Error("down");
		});
		await expect(notifyPeers("docs", SECRET, "pull")).resolves.toBeUndefined();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
