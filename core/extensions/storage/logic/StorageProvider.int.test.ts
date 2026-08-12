/**
 * @jest-environment node
 */

import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructure from "@core/FileStructue/FileStructure";
import { XxHash } from "@core/Hash/Hasher";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import StorageProvider from "@ext/storage/logic/StorageProvider";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const EXISTING_REPO = "http://localhost:8174/remoteRep.git";
const MISSING_REPO = "http://localhost:8174/does-not-exist.git";

// more than StorageProvider's concurrency limit, so most of these have to wait in the queue
const CLONE_COUNT = 10;

const source = {
	sourceType: SourceType.gitHub,
	domain: "localhost:8174",
	protocol: "http",
	token: "",
	userEmail: "test@test.test",
	userName: "test",
} as never;

describe("StorageProvider.clone", () => {
	let root: string;

	beforeAll(async () => {
		await XxHash.init();
		root = mkdtempSync(join(tmpdir(), "gx-clone-queue-"));
	});

	afterAll(() => rmSync(root, { recursive: true, force: true }));

	test("a failing clone does not take the queued ones down with it", async () => {
		const fp = MountFileProvider.fromDefault(new Path(root));
		await fp.createRootPathIfNeed();
		const fs = new FileStructure(fp, false, []);
		const sp = new StorageProvider();

		const cloned: string[] = [];

		await Promise.all(
			Array.from({ length: CLONE_COUNT }, (_, i) => {
				const name = `rep-${i}`;
				const url = i === 0 ? MISSING_REPO : EXISTING_REPO;
				return sp.clone(fs, {
					out: new Path(name),
					branch: "master",
					data: { source, group: "", name, url } as never as GitStorageData,
					onFinish: () => {
						cloned.push(name);
						return false;
					},
				});
			}),
		);

		const states = Array.from(
			{ length: CLONE_COUNT },
			(_, i) => sp.getCloneProgress(new Path(root).join(new Path(`rep-${i}`)))?.type,
		);

		expect(cloned.sort()).toEqual(Array.from({ length: CLONE_COUNT - 1 }, (_, i) => `rep-${i + 1}`).sort());
		expect(states[0]).toBe("error");
		expect(states.slice(1)).toEqual(Array.from({ length: CLONE_COUNT - 1 }, () => "finish"));
	}, 120_000);
});
