import { PendingSelfWrites } from "../PendingSelfWrites";

describe("PendingSelfWrites", () => {
	beforeEach(() => PendingSelfWrites.clearAll());

	test("mark then covers returns true until TTL, not consumed by reads", () => {
		PendingSelfWrites.mark("/a/b.md");
		expect(PendingSelfWrites.covers("/a/b.md")).toBe(true);
		expect(PendingSelfWrites.covers("/a/b.md")).toBe(true);
	});

	test("covers returns false for unmarked path", () => {
		expect(PendingSelfWrites.covers("/missing")).toBe(false);
	});

	test("expires after TTL", async () => {
		PendingSelfWrites.markWithTtl("/x.md", 30);
		await new Promise((r) => setTimeout(r, 80));
		expect(PendingSelfWrites.covers("/x.md")).toBe(false);
	});

	test("re-marking refreshes TTL", async () => {
		PendingSelfWrites.markWithTtl("/y.md", 30);
		await new Promise((r) => setTimeout(r, 20));
		PendingSelfWrites.markWithTtl("/y.md", 200);
		await new Promise((r) => setTimeout(r, 50));
		expect(PendingSelfWrites.covers("/y.md")).toBe(true);
	});

	test("clearAll drops all marks", () => {
		PendingSelfWrites.mark("/z.md");
		PendingSelfWrites.clearAll();
		expect(PendingSelfWrites.covers("/z.md")).toBe(false);
	});

	test("mark on a directory covers descendants (segment prefix)", () => {
		PendingSelfWrites.mark("/ws/notes/section");
		expect(PendingSelfWrites.covers("/ws/notes/section/inside.md")).toBe(true);
		expect(PendingSelfWrites.covers("/ws/notes/section/deep/a.md")).toBe(true);
	});

	test("prefix match is segment-wise, not substring", () => {
		PendingSelfWrites.mark("/ws/notes/sec");
		expect(PendingSelfWrites.covers("/ws/notes/section/inside.md")).toBe(false);
	});

	test("directory mark expires like a file mark", async () => {
		PendingSelfWrites.markWithTtl("/ws/dir", 30);
		await new Promise((r) => setTimeout(r, 80));
		expect(PendingSelfWrites.covers("/ws/dir/child.md")).toBe(false);
	});
});
