import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import type ClientSyncResult from "@ext/git/core/model/ClientSyncResult";
import { PublishEmitter } from "./PublishEmitter";

// biome-ignore lint/style/useNamingConvention: Jest module mock shape
jest.mock("@core-ui/ApiServices/FetchService", () => ({ __esModule: true, default: { fetch: jest.fn() } }));
jest.mock("@ext/errorHandlers/client/ErrorConfirmService", () => ({
	// biome-ignore lint/style/useNamingConvention: Jest module mock shape
	__esModule: true,
	default: { notify: jest.fn() },
}));
jest.mock("@ext/git/actions/Sync/logic/SyncService", () => {
	const { createEventEmitter } = jest.requireActual("@core/Event/EventEmitter");
	// biome-ignore lint/style/useNamingConvention: Jest module mock shape
	return { __esModule: true, default: { events: createEventEmitter(), sync: jest.fn() } };
});

const fetchMock = FetchService.fetch as jest.Mock;
const apiUrlCreator = {
	getStoragePublishUrl: () => "publish-url",
	getStorageSyncUrl: () => "sync-url",
} as unknown as ApiUrlCreator;

type SyncOutcome = "ok" | "error" | "conflict";

const okResponse = () => ({ ok: true });
const errorResponse = (errorCode: string) => ({
	ok: false,
	error: { message: "publish failed", props: { errorCode } },
});
const jsonErrorResponse = (errorCode: string) => ({
	ok: false,
	json: async () => ({ message: "publish failed", props: { errorCode } }),
});

const syncData = (ok: boolean) =>
	({
		mergeData: ok ? { ok: true } : { ok: false, mergeFiles: [] },
		isVersionChanged: false,
		before: "before",
		after: "after",
	}) as ClientSyncResult;

const mockSync = (outcomes: SyncOutcome[]) =>
	(SyncService.sync as jest.Mock).mockImplementation(async () => {
		const outcome = outcomes.shift();
		if (outcome === "error") {
			await SyncService.events.emit("error", { error: new DefaultError("sync failed"), apiUrlCreator });
			return;
		}

		await SyncService.events.emit("finish", { syncData: syncData(outcome !== "conflict") });
	});

beforeEach(() => {
	jest.restoreAllMocks();
	fetchMock.mockReset();
	(ErrorConfirmService.notify as jest.Mock).mockReset();
	(SyncService.sync as jest.Mock).mockReset();
});

test("syncs and retries once when the first publish is rejected", async () => {
	const syncMock = mockSync(["ok", "ok"]);
	fetchMock.mockResolvedValueOnce(errorResponse(GitErrorCode.PushRejectedError)).mockResolvedValueOnce(okResponse());

	await expect(PublishEmitter.publish(apiUrlCreator, "message", ["article.md"])).resolves.toBe(true);

	expect(syncMock).toHaveBeenCalledTimes(2);
	expect(fetchMock).toHaveBeenCalledTimes(2);
	expect(fetchMock.mock.calls[0][4]).toBe(false);
	expect(fetchMock.mock.calls[1][4]).toBe(true);
});

test("retries when the first rejection is returned in the response body", async () => {
	const syncMock = mockSync(["ok", "ok"]);
	fetchMock
		.mockResolvedValueOnce(jsonErrorResponse(GitErrorCode.PushRejectedError))
		.mockResolvedValueOnce(okResponse());

	await expect(PublishEmitter.publish(apiUrlCreator, "message", ["article.md"])).resolves.toBe(true);

	expect(syncMock).toHaveBeenCalledTimes(2);
	expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("reports the second rejection without a third publish attempt", async () => {
	const syncMock = mockSync(["ok", "ok"]);
	const error = errorResponse(GitErrorCode.PushRejectedError);
	fetchMock.mockResolvedValueOnce(error).mockResolvedValueOnce(error);
	const onError = jest.fn();
	const errorToken = PublishEmitter.events.on("error", onError);

	await expect(PublishEmitter.publish(apiUrlCreator, "message", ["article.md"])).resolves.toBe(false);

	PublishEmitter.events.off(errorToken);
	expect(syncMock).toHaveBeenCalledTimes(2);
	expect(fetchMock).toHaveBeenCalledTimes(2);
	expect(onError).toHaveBeenCalledTimes(1);
});

test("does not retry another publish error", async () => {
	const syncMock = mockSync(["ok"]);
	const response = errorResponse(GitErrorCode.GitPushError);
	fetchMock.mockResolvedValueOnce(response);

	await expect(PublishEmitter.publish(apiUrlCreator, "message", ["article.md"])).resolves.toBe(false);

	expect(syncMock).toHaveBeenCalledTimes(1);
	expect(fetchMock).toHaveBeenCalledTimes(1);
	expect(fetchMock.mock.calls[0][4]).toBe(false);
	expect(ErrorConfirmService.notify).toHaveBeenCalledWith(response.error);
});

test.each<SyncOutcome>([
	"error",
	"conflict",
])("does not retry publish when the recovery sync ends with %s", async (outcome) => {
	const syncMock = mockSync(["ok", outcome]);
	fetchMock.mockResolvedValueOnce(errorResponse(GitErrorCode.PushRejectedError));

	await expect(PublishEmitter.publish(apiUrlCreator, "message", ["article.md"])).resolves.toBe(false);

	expect(syncMock).toHaveBeenCalledTimes(2);
	expect(fetchMock).toHaveBeenCalledTimes(1);
});
