import assert from "assert";
import { $, type PathLike } from "bun";
import fs from "fs/promises";
import { env } from "./util";

export const macos = async (dmg: PathLike) => {
	assert(await fs.exists(dmg), `${dmg} does not exist`);

	const appleId = env("APPLE_SIGNING_APPLE_ID", "required for notarytool");
	const teamId = env("APPLE_TEAM_ID", "required for notarytool");
	const password = env("APPLE_SIGNING_PASSWORD", "required for notarytool");

	await $`xcrun notarytool submit "${dmg}" --apple-id "${appleId}" --team-id "${teamId}" --password "${password}" --wait --timeout 10m`;
	await $`xcrun stapler staple "${dmg}"`;
};

macos.verify = async (dmg: PathLike) => {
	assert(await fs.exists(dmg), `${dmg} does not exist`);

	await $`xcrun codesign --verify --deep --strict --verbose=2 "${dmg}"`;
};

export const android = async (apk: PathLike, keystore: PathLike, buildToolsVersion = "34.0.0") => {
	assert(await fs.exists(apk), `apk: ${apk} does not exist`);
	assert(await fs.exists(keystore), `keystore: ${keystore} does not exist`);

	const password = env("TAURI_ANDROID_SIGNING_PASSWORD", "required for android signing");
	const home = env("ANDROID_HOME", "required for android signing");

	await $`echo "${password}" | "${home}"/build-tools/${buildToolsVersion}/apksigner sign --ks "${keystore}" --ks-key-alias com.ics.gramax --in "${apk}"`;

	await $`"${home}"/build-tools/${buildToolsVersion}/apksigner verify -v "${apk}"`;
};

export const win = async (exe: PathLike) => {
	assert(await fs.exists(exe), `${exe} does not exist`);

	const kmsAwsKeyId = env("KMS_AWS_KEY_ID", "required for win signing");
	const kmsAwsAccessKeyId = env("KMS_AWS_ACCESS_KEY_ID", "required for win signing");
	const kmsAwsSecretAccessKey = env("KMS_AWS_SECRET_ACCESS_KEY", "required for win signing");
	const codingSigningCert = env("CODE_SIGNING_CERT", "required for win signing");

	await $`jsign --alias "${kmsAwsKeyId}" --storepass "${kmsAwsAccessKeyId}|${kmsAwsSecretAccessKey}" --keystore eu-north-1 --storetype AWS --certfile "${codingSigningCert}" --tsaurl http://timestamp.digicert.com "${exe}"`;
};

win.verify = async (exe: PathLike) => {
	assert(await fs.exists(exe), `${exe} does not exist`);

	await $`jsign extract --format pem "${exe}"`.quiet();
	await fs.rm(`${exe}.sig.pem`);
};

export const containers = async (_filePath: PathLike) => {
	throw new Error("Not implemented");
};
