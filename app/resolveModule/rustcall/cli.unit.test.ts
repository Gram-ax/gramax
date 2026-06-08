import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cliCall } from "./cli";
import { parseCommand } from "./index";

const sandbox = join(tmpdir(), `cli-fs-test-${Date.now()}-${process.pid}`);
const scope = { kind: "disk" as const, root: sandbox };

beforeAll(async () => {
	await fs.rm(sandbox, { recursive: true, force: true });
	await fs.mkdir(sandbox, { recursive: true });
});

afterAll(async () => {
	await fs.rm(sandbox, { recursive: true, force: true });
});

const readUtf8 = async (path: string) => {
	const buf = await cliCall<Uint8Array>("fs.read_file", { scope, path });
	return Buffer.from(buf).toString("utf8");
};

describe("cliCall (cli fs handlers) resolves scope.root + path", () => {
	test("make_dir non-recursive + recursive", async () => {
		await cliCall("fs.make_dir", { scope, path: "a", recursive: false });
		await cliCall("fs.make_dir", { scope, path: "b/c/d", recursive: true });
		expect(await cliCall<boolean>("fs.exists", { scope, path: "a" })).toBe(true);
		expect(await cliCall<boolean>("fs.exists", { scope, path: "b/c/d" })).toBe(true);
	});

	test("write_file + read_file", async () => {
		await cliCall("fs.write_file", { scope, path: "a/file.txt", content: Buffer.from("hello") });
		expect(await readUtf8("a/file.txt")).toBe("hello");
	});

	test("write_file creates parent dirs", async () => {
		await cliCall("fs.write_file", { scope, path: "deep/nested/dir/x.txt", content: Buffer.from("x") });
		expect(await readUtf8("deep/nested/dir/x.txt")).toBe("x");
	});

	test("exists for existing and missing", async () => {
		expect(await cliCall<boolean>("fs.exists", { scope, path: "a/file.txt" })).toBe(true);
		expect(await cliCall<boolean>("fs.exists", { scope, path: "no-such-thing" })).toBe(false);
	});

	test("getstat file", async () => {
		const stat = (await cliCall("fs.getstat", { scope, path: "a/file.txt", followLink: false })) as {
			type: string;
			size: number;
		};
		expect(stat.type).toBe("file");
		expect(stat.size).toBe(5);
	});

	test("getstat dir", async () => {
		const stat = (await cliCall("fs.getstat", { scope, path: "a", followLink: false })) as { type: string };
		expect(stat.type).toBe("dir");
	});

	test("read_dir on relative path", async () => {
		const items = await cliCall<string[]>("fs.read_dir", { scope, path: "a" });
		expect(items).toContain("file.txt");
	});

	test("read_dir on empty path returns root entries", async () => {
		const items = await cliCall<string[]>("fs.read_dir", { scope, path: "" });
		expect(items).toEqual(expect.arrayContaining(["a", "b", "deep"]));
	});

	test("read_dir_stats", async () => {
		const items = (await cliCall("fs.read_dir_stats", { scope, path: "a" })) as Array<{
			name: string;
			type: string;
			size: number;
		}>;
		const file = items.find((i) => i.name === "file.txt");
		expect(file).toBeDefined();
		expect(file!.type).toBe("file");
		expect(file!.size).toBe(5);
	});

	test("copy file", async () => {
		await cliCall("fs.copy", { scope, from: "a/file.txt", to: "a/file-copy.txt" });
		expect(await readUtf8("a/file-copy.txt")).toBe("hello");
	});

	test("copy directory recursive", async () => {
		await cliCall("fs.make_dir", { scope, path: "src-dir/inner", recursive: true });
		await cliCall("fs.write_file", { scope, path: "src-dir/inner/y.txt", content: Buffer.from("y") });
		await cliCall("fs.copy", { scope, from: "src-dir", to: "dst-dir" });
		expect(await readUtf8("dst-dir/inner/y.txt")).toBe("y");
	});

	test("mv file", async () => {
		await cliCall("fs.mv", { scope, from: "a/file-copy.txt", to: "b/c/d/moved.txt" });
		expect(await cliCall<boolean>("fs.exists", { scope, path: "b/c/d/moved.txt" })).toBe(true);
		expect(await cliCall<boolean>("fs.exists", { scope, path: "a/file-copy.txt" })).toBe(false);
	});

	test("rmfile", async () => {
		await cliCall("fs.rmfile", { scope, path: "b/c/d/moved.txt" });
		expect(await cliCall<boolean>("fs.exists", { scope, path: "b/c/d/moved.txt" })).toBe(false);
	});

	test("hardlink (symlink) + read_link", async () => {
		await cliCall("fs.write_file", { scope, path: "a/source.txt", content: Buffer.from("link-target") });
		await cliCall("fs.hardlink", { scope, from: "a/source.txt", to: "a/link.txt" });
		expect(await readUtf8("a/link.txt")).toBe("link-target");
		const target = await cliCall<string>("fs.read_link", { scope, path: "a/link.txt" });
		expect(target).toContain("source.txt");
	});

	test("delete_empty_dirs", async () => {
		await cliCall("fs.make_dir", { scope, path: "empty1/empty2/empty3", recursive: true });
		await cliCall("fs.delete_empty_dirs", { scope, path: "empty1" });
		expect(await cliCall<boolean>("fs.exists", { scope, path: "empty1" })).toBe(false);
	});

	test("delete_empty_dirs preserves dirs with files", async () => {
		await cliCall("fs.make_dir", { scope, path: "keep/sub", recursive: true });
		await cliCall("fs.write_file", { scope, path: "keep/sub/file.txt", content: Buffer.from("x") });
		await cliCall("fs.delete_empty_dirs", { scope, path: "keep" });
		expect(await cliCall<boolean>("fs.exists", { scope, path: "keep/sub/file.txt" })).toBe(true);
	});

	test("remove_dir recursive", async () => {
		await cliCall("fs.make_dir", { scope, path: "rmtree/inner", recursive: true });
		await cliCall("fs.write_file", { scope, path: "rmtree/inner/x.txt", content: Buffer.from("x") });
		await cliCall("fs.remove_dir", { scope, path: "rmtree", recursive: true });
		expect(await cliCall<boolean>("fs.exists", { scope, path: "rmtree" })).toBe(false);
	});

	test("absolute path passes through unchanged", async () => {
		const items = await cliCall<string[]>("fs.read_dir", { scope, path: sandbox });
		expect(items).toEqual(expect.arrayContaining(["a", "b"]));
	});

	test("unknown fs command throws", async () => {
		await expect(cliCall("fs.nope", { scope })).rejects.toThrow(/unknown command/);
	});

	test("missing scope throws", async () => {
		await expect(cliCall("fs.read_dir", { path: "a" })).rejects.toThrow(/unsupported scope/);
	});

	test("git.is_init returns false in cli env", async () => {
		expect(await cliCall<boolean>("git.is_init", { repoPath: "/x" })).toBe(false);
	});

	test("git.<other> throws not-supported in cli env", async () => {
		await expect(cliCall("git.clone", {})).rejects.toThrow(/not supported in cli/);
	});
});

describe("parseCommand", () => {
	test("splits namespace and subcommand", () => {
		expect(parseCommand("fs.read_file")).toEqual(["fs", "read_file"]);
		expect(parseCommand("git.clone")).toEqual(["git", "clone"]);
	});

	test("subcommand may contain dots", () => {
		expect(parseCommand("fs.read.file")).toEqual(["fs", "read.file"]);
	});

	test("rejects unknown namespace", () => {
		expect(() => parseCommand("xyz.foo")).toThrow(/unknown namespace/);
	});

	test("rejects unnamespaced command", () => {
		expect(() => parseCommand("read_file")).toThrow(/must be namespaced/);
		expect(() => parseCommand(".read_file")).toThrow(/must be namespaced/);
	});

	test("rejects empty subcommand", () => {
		expect(() => parseCommand("fs.")).toThrow(/empty subcommand/);
	});
});
