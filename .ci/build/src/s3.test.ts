import { describe, expect, test } from "bun:test";

import { fromS3Key, parseS3BasePath, toS3Key } from "./s3";

describe("S3 base path helpers", () => {
	test("splits bucket and key prefix from S3_BASE_PATH", () => {
		expect(parseS3BasePath("gramax/apps")).toEqual({ bucket: "gramax", prefix: "apps" });
		expect(parseS3BasePath("gramax")).toEqual({ bucket: "gramax", prefix: "" });
	});

	test("adds and removes the configured key prefix", () => {
		const base = parseS3BasePath("gramax/apps");

		expect(toS3Key(base, "prod/latest/gramax.darwin-aarch64.dmg.version")).toBe(
			"apps/prod/latest/gramax.darwin-aarch64.dmg.version",
		);
		expect(fromS3Key(base, "apps/prod/latest/gramax.darwin-aarch64.dmg.version")).toBe(
			"prod/latest/gramax.darwin-aarch64.dmg.version",
		);
	});
});
