import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { CommentBlock } from "@core-ui/CommentBlock";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import type { GramaxClipboardData } from "@ext/markdown/elements/copyArticles/handlers/copy";
import { PastedComments, restoreComment } from "@ext/markdown/elements/copyArticles/handlers/paste/processMarks";

// biome-ignore lint/style/useNamingConvention: expected
jest.mock("@core-ui/ApiServices/FetchService", () => ({ __esModule: true, default: { fetch: jest.fn() } }));
jest.mock("@core-ui/stores/EditorStore", () => ({ getEditorStore: jest.fn() }));

const fetchMock = FetchService.fetch as jest.Mock;
const getEditorStoreMock = getEditorStore as jest.Mock;

const ok = (body?: unknown) => ({ ok: true, json: async () => body, text: async () => body });
const fail = () => ({ ok: false, json: async () => null, text: async () => null });

const apiUrlCreator = {
	updateComment: (id: string) => `update:${id}`,
	getComment: (id: string, path: string) => `get:${id}:${path}`,
	getNewCommentId: () => "new-id-url",
} as unknown as ApiUrlCreator;

const comment: CommentBlock = {
	comment: { dateTime: "2026-01-01", content: [], user: { mail: "a@b.c", name: "A" } },
	answers: [],
};

/** A clipboard payload carrying the bodies of the comments its nodes point at. */
const clipboard = (comments: Record<string, CommentBlock> = { c1: comment }) =>
	({ copyPath: "source.md", comments }) as GramaxClipboardData;

let storedComments: Map<string, CommentBlock>;

type RestoreOverrides = Partial<Parameters<typeof restoreComment>[0]>;

const restore = (overrides: RestoreOverrides = {}) =>
	restoreComment({
		id: "c1",
		apiUrlCreator,
		copyData: clipboard(),
		comments: new PastedComments(),
		isStorageConnected: true,
		...overrides,
	});

/** Mints new1, new2, … so a test can tell one freshly minted id from the next. */
const mintingIds = () => {
	let next = 1;
	fetchMock.mockImplementation(async (url: string) => (url === "new-id-url" ? ok(`new${next++}`) : ok()));
};

beforeEach(() => {
	jest.clearAllMocks();
	storedComments = new Map();
	getEditorStoreMock.mockReturnValue({ editor: { storage: { comment: { comments: storedComments } } } });
});

describe("restoreComment", () => {
	test("recreates the clipboard's comment under a fresh id, never the one it was copied from", async () => {
		mintingIds();

		const id = await restore();

		expect(id).toBe("new1");
		expect(fetchMock).toHaveBeenCalledWith("update:new1", JSON.stringify(comment));
		// The source id is left alone — whatever still points at it keeps its own comment.
		expect(fetchMock).not.toHaveBeenCalledWith("update:c1", expect.anything());
		expect(storedComments.get("new1")).toEqual(comment);
		expect(storedComments.has("c1")).toBe(false);
	});

	test("drops the comment when neither the clipboard nor the source article has a body", async () => {
		fetchMock.mockResolvedValue(ok(null));

		await expect(restore({ copyData: clipboard({}) })).resolves.toBeNull();
	});

	test("drops the comment when minting an id fails", async () => {
		fetchMock.mockImplementation(async (url: string) => (url === "new-id-url" ? fail() : ok()));

		await expect(restore()).resolves.toBeNull();
	});

	test("drops the comment when saving it fails", async () => {
		fetchMock.mockImplementation(async (url: string) => (url === "new-id-url" ? ok("new1") : fail()));

		await expect(restore()).resolves.toBeNull();
		expect(storedComments.size).toBe(0);
	});

	test("drops the comment when the target article has no storage connected", async () => {
		const id = await restore({ isStorageConnected: false });

		expect(id).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe("restoreComment across nodes of one paste", () => {
	test("nodes sharing a comment land on one new comment, not one each", async () => {
		mintingIds();
		const comments = new PastedComments();

		const first = await restore({ comments });
		const second = await restore({ comments });

		expect(first).toBe("new1");
		expect(second).toBe("new1");
		// The second node joins the comment the first created instead of minting and saving another.
		expect(fetchMock.mock.calls.filter(([url]) => url === "new-id-url")).toHaveLength(1);
		expect(fetchMock.mock.calls.filter(([url]) => url === "update:new1")).toHaveLength(1);
	});

	test("distinct comments in one paste get an id each", async () => {
		mintingIds();
		const comments = new PastedComments();
		const copyData = clipboard({ c1: comment, c2: comment });

		const first = await restore({ comments, copyData });
		const second = await restore({ comments, copyData, id: "c2" });

		expect(first).toBe("new1");
		expect(second).toBe("new2");
	});
});
