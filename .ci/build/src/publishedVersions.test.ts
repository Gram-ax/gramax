import { describe, expect, test } from "bun:test";

import {
	buildInnerVersionPath,
	buildReleasePrefix,
	buildVersionPrefix,
	formatPublishedVersionsList,
	groupPublishedVersions,
	listS3Objects,
	listS3Prefixes,
	parsePublishedVersion,
	planVersionRemoval,
	readVersionPointers,
	resolveSetTargets,
} from "./publishedVersions";

const listEntries = (keys: string[]) => keys.map((key) => ({ key }));

describe("published app version helpers", () => {
	test("parses published versions into release and patch path parts", () => {
		expect(parsePublishedVersion("2026.6.9-123")).toEqual({
			version: "2026.6.9-123",
			release: "2026.6",
			patch: "9-123",
		});

		expect(parsePublishedVersion("2026.6.9-ios.123")).toEqual({
			version: "2026.6.9-ios.123",
			release: "2026.6",
			patch: "9-ios.123",
		});
	});

	test("builds S3 prefixes and pointer paths", () => {
		expect(buildReleasePrefix("prod", "2026.6")).toBe("prod/2026.6/");
		expect(buildVersionPrefix("prod", "2026.6.9-123")).toBe("prod/2026.6/9-123/");
		expect(buildInnerVersionPath("prod", "2026.6", "darwin-aarch64", "dmg")).toBe(
			"prod/2026.6/latest/gramax.darwin-aarch64.dmg.version",
		);
	});

	test("groups published versions by release and includes latest pointer values", () => {
		const grouped = groupPublishedVersions(
			listEntries([
				"prod/latest/gramax.darwin-aarch64.dmg.version",
				"prod/2026.6/latest/gramax.darwin-aarch64.dmg.version",
				"prod/2026.6/9-123/darwin-aarch64/gramax.darwin-aarch64.dmg",
				"prod/2026.6/8-122/darwin-aarch64/gramax.darwin-aarch64.dmg",
				"prod/2026.5/31-121/darwin-aarch64/gramax.darwin-aarch64.dmg",
				"prod/2026.6/latest/gramax.windows-x86_64.nsis.version",
			]),
			[
				{ path: "prod/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.9-123" },
				{ path: "prod/2026.6/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.8-122" },
				{ path: "prod/2026.6/latest/gramax.windows-x86_64.nsis.version", version: "2026.6.9-123" },
			],
		);

		expect(grouped.map((release) => release.release)).toEqual(["2026.6", "2026.5"]);
		expect(grouped[0]).toEqual({
			release: "2026.6",
			versions: ["2026.6.9-123", "2026.6.8-122"],
			globalPointers: [{ path: "prod/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.9-123" }],
			innerPointers: [
				{ path: "prod/2026.6/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.8-122" },
				{ path: "prod/2026.6/latest/gramax.windows-x86_64.nsis.version", version: "2026.6.9-123" },
			],
		});
	});

	test("formats grouped versions with global and inner latest pointers", () => {
		const output = formatPublishedVersionsList("prod", [
			{
				release: "2026.6",
				versions: ["2026.6.9-123", "2026.6.8-122"],
				globalPointers: [{ path: "prod/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.9-123" }],
				innerPointers: [
					{ path: "prod/2026.6/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.8-122" },
				],
			},
		]);

		expect(output).toBe(`channel: prod

release 2026.6
  global latest:
    prod/latest/gramax.darwin-aarch64.dmg.version -> 2026.6.9-123
  inner latest:
    prod/2026.6/latest/gramax.darwin-aarch64.dmg.version -> 2026.6.8-122
  versions:
    2026.6.9-123
    2026.6.8-122`);
	});

	test("resolves set targets from flags", () => {
		expect(resolveSetTargets({ global: false, inner: false })).toEqual({ global: true, inner: true });
		expect(resolveSetTargets({ global: true, inner: false })).toEqual({ global: true, inner: false });
		expect(resolveSetTargets({ global: false, inner: true })).toEqual({ global: false, inner: true });
		expect(resolveSetTargets({ global: true, inner: true })).toEqual({ global: true, inner: true });
	});

	test("plans dry-run removal and refuses versions still referenced by pointers", () => {
		const safePlan = planVersionRemoval({
			channel: "prod",
			version: "2026.6.9-123",
			objects: listEntries([
				"prod/2026.6/9-123/darwin-aarch64/gramax.darwin-aarch64.dmg",
				"prod/2026.6/9-123/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz",
				"prod/2026.6/8-122/darwin-aarch64/gramax.darwin-aarch64.dmg",
			]),
			pointers: [
				{ path: "prod/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.8-122" },
				{ path: "prod/2026.6/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.8-122" },
			],
		});

		expect(safePlan.blockingPointers).toEqual([]);
		expect(safePlan.keys).toEqual([
			"prod/2026.6/9-123/darwin-aarch64/gramax.darwin-aarch64.dmg",
			"prod/2026.6/9-123/darwin-aarch64/gramax.darwin-aarch64.update.tar.gz",
		]);

		const blockedPlan = planVersionRemoval({
			channel: "prod",
			version: "2026.6.9-123",
			objects: listEntries(["prod/2026.6/9-123/darwin-aarch64/gramax.darwin-aarch64.dmg"]),
			pointers: [{ path: "prod/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.9-123" }],
		});

		expect(blockedPlan.blockingPointers).toEqual([
			{ path: "prod/latest/gramax.darwin-aarch64.dmg.version", version: "2026.6.9-123" },
		]);
	});

	test("lists all S3 pages using continuation tokens", async () => {
		const calls: unknown[] = [];
		const bucket = {
			base: { bucket: "gramax", prefix: "apps" },
			client: {
				async list(input: unknown) {
					calls.push(input);
					if (calls.length === 1) {
						expect(input).toEqual({ prefix: "apps/prod/" });
						return {
							isTruncated: true,
							nextContinuationToken: "page-2",
							contents: [{ key: "apps/prod/2026.6/8/a" }],
						};
					}

					expect(input).toEqual({ prefix: "apps/prod/", continuationToken: "page-2" });
					return {
						isTruncated: false,
						contents: [{ key: "apps/prod/2026.6/9/b" }],
					};
				},
			},
		};

		await expect(listS3Objects(bucket as never, { prefix: "prod/" })).resolves.toEqual([
			{ key: "prod/2026.6/8/a" },
			{ key: "prod/2026.6/9/b" },
		]);
	});

	test("lists S3 common prefixes using the configured base prefix", async () => {
		const bucket = {
			base: { bucket: "gramax", prefix: "apps" },
			client: {
				async list(input: unknown) {
					expect(input).toEqual({ prefix: "apps/prod/", delimiter: "/" });
					return {
						isTruncated: false,
						commonPrefixes: [{ prefix: "apps/prod/latest/" }, { prefix: "apps/prod/2026.6/" }],
					};
				},
			},
		};

		await expect(listS3Prefixes(bucket as never, { prefix: "prod/", delimiter: "/" })).resolves.toEqual([
			"prod/latest/",
			"prod/2026.6/",
		]);
	});

	test("reads version pointers concurrently", async () => {
		let active = 0;
		let maxActive = 0;
		const bucket = {
			base: { bucket: "gramax", prefix: "apps" },
			client: {
				file(path: string) {
					return {
						async text() {
							active++;
							maxActive = Math.max(maxActive, active);
							await new Promise((resolve) => setTimeout(resolve, 10));
							active--;
							return path.endsWith("a.version") ? "2026.6.9-123" : "2026.6.8-122";
						},
					};
				},
			},
		};

		await expect(
			readVersionPointers(bucket as never, [
				"prod/latest/gramax.darwin-aarch64.a.version",
				"prod/latest/gramax.darwin-aarch64.b.version",
			]),
		).resolves.toEqual([
			{ path: "prod/latest/gramax.darwin-aarch64.a.version", version: "2026.6.9-123" },
			{ path: "prod/latest/gramax.darwin-aarch64.b.version", version: "2026.6.8-122" },
		]);
		expect(maxActive).toBe(2);
	});
});
