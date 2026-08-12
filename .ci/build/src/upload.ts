import assert from "assert";
import { semver } from "bun";
import fs from "fs/promises";
import path from "path";
import { allowedFiles } from "./publishedVersions";
import { createS3Bucket, toS3Key } from "./s3";
import { artifactsDir, releaseOffset, sizeOf } from "./util";

export const upload = async (channel: string, version: string) => {
	const [major, minor, patch] = version.split(".", 3);

	const v1 = `${major}.${minor}`;
	const v2 = patch;

	assert(v2 !== undefined, "invalid version");

	const s3 = createS3Bucket();

	let uploadedCount = 0;

	const offset = releaseOffset();

	for (const [platform, packages] of Object.entries(allowedFiles)) {
		console.log();

		for (const [pack, files] of Object.entries(packages)) {
			let missing = false;
			const latest = path.join(channel, "latest", `gramax.${platform}.${pack}.version`);
			const innerLatest = path.join(channel, v1, "latest", `gramax.${platform}.${pack}.version`);

			const uploadLatest = async (latestPath: string) => {
				const serverVersion = await s3.client
					.file(toS3Key(s3.base, latestPath))
					.text()
					.catch((e) => {
						console.warn(`failed to get version from ${latestPath}: ${e}; using 0.0.0 instead`);
						return "0.0.0";
					});

				if (semver.order(serverVersion, version) < 0) {
					await s3.client.write(toS3Key(s3.base, latestPath), version);
					console.log(`uploaded latest ${latestPath}: ${version}`);
				} else {
					const msg = `on-server version ${serverVersion} (${platform}, ${pack}) >= ${version}, skipping uploading new file to ${latestPath}`;
					console.log(msg);
				}
			};

			for (const file of files) {
				if (!(await fs.exists(path.join(artifactsDir, platform, file)))) {
					missing = true;
					continue;
				}

				const s3path = path.join(channel, v1, v2, platform, file);
				const filepath = path.join(artifactsDir, platform, file);
				const displayName = path.join(platform, file);

				const size = await sizeOf(filepath);

				const stream = Bun.file(filepath);
				console.log(`uploading ${displayName} -> ${s3path} (${size})`);
				await s3.client.write(toS3Key(s3.base, s3path), stream);

				uploadedCount++;
			}

			if (missing) {
				console.warn(`missing some of ${platform} (${pack}) artifacts, skipping uploading latest version`);
				continue;
			}

			if (offset === null) {
				await uploadLatest(latest);
			}

			await uploadLatest(innerLatest);
		}
	}

	console.log();
	uploadedCount > 0
		? console.log(`uploaded ${uploadedCount} artifacts in total`)
		: console.warn("no artifacts were uploaded");
};
