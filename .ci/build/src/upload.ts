import assert from "assert";
import { S3Client, semver } from "bun";
import fs from "fs/promises";
import path from "path";
import { artifactsDir, env, sizeOf } from "./util";

const allowedFiles = {
	"windows-x86_64": {
		nsis: ["gramax.windows-x86_64.exe", "gramax.windows-x86_64.setup.exe", "gramax.windows-x86_64.setup.exe.sig"],
	},
	"darwin-x86_64": {
		dmg: [
			"gramax.darwin-x86_64.dmg",
			"gramax.darwin-x86_64.update.tar.gz",
			"gramax.darwin-x86_64.update.tar.gz.sig",
		],
	},
	"darwin-aarch64": {
		dmg: [
			"gramax.darwin-aarch64.dmg",
			"gramax.darwin-aarch64.update.tar.gz",
			"gramax.darwin-aarch64.update.tar.gz.sig",
		],
	},
	"linux-x86_64": {
		appimage: ["gramax.linux-x86_64.appimage", "gramax.linux-x86_64.appimage.sig"],
		deb: ["gramax.linux-x86_64.deb", "gramax.linux-x86_64.deb.sig"],
		rpm: ["gramax.linux-x86_64.rpm", "gramax.linux-x86_64.rpm.sig"],
	},
	android: {
		apk: ["gramax.android.apk"],
	},
	ios: {
		ipa: ["gramax.ios.ipa"],
	},
} as const;

type UploadFn = (opts: {
	s3: S3Client;
	s3url: string;
	displayName: string;
	filepath: string;
	s3path: string;
	latest: string;
}) => Promise<boolean>;

export const upload = async (channel: string, version: string) => {
	const accessKeyId = env("S3_ACCESS_KEY");
	const secretAccessKey = env("S3_SECRET_KEY");
	const endpoint = env("S3_HOST");
	const bucket = env("S3_BASE_PATH");

	const [major, minor, patch] = version.split(".", 3);

	const v1 = `${major}.${minor}`;
	const v2 = patch;

	assert(v2 !== undefined, "invalid version");

	const s3 = new S3Client({
		accessKeyId,
		secretAccessKey,
		endpoint,
		bucket,
	});

	let uploadedCount = 0;

	for (const [platform, packages] of Object.entries(allowedFiles)) {
		console.log();

		for (const [pack, files] of Object.entries(packages)) {
			let missing = false;
			const latest = path.join(channel, "latest", `gramax.${platform}.${pack}.version`);
			const innerLatest = path.join(channel, v1, "latest", `gramax.${platform}.${pack}.version`);

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
				await s3.write(s3path, stream);

				uploadedCount++;
			}

			if (missing) {
				console.warn(`missing some of ${platform} (${pack}) artifacts, skipping uploading latest version`);
				continue;
			}

			const serverVersion = await s3
				.file(latest)
				.text()
				.catch((e) => {
					console.warn(`failed to get version from ${latest}: ${e}; using 0.0.0 instead`);
					return "0.0.0";
				});

			if (semver.order(serverVersion, version) < 0) {
				await s3.write(latest, version);
				await s3.write(innerLatest, version);
				console.log(`uploaded ${latest}: ${version}`);
			} else {
				const msg = `on-server version ${serverVersion} (${platform}, ${pack}) >= ${version}, skipping uploading new file`;
				console.log(msg);
			}
		}
	}

	console.log();
	uploadedCount > 0
		? console.log(`uploaded ${uploadedCount} artifacts in total`)
		: console.warn("no artifacts were uploaded");
};
