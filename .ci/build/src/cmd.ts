import assert from "assert";
import { $ } from "bun";
import fs from "fs/promises";

import { join } from "path";
import { parseArgs } from "util";
import * as b from "./builder";
import {
	formatPublishedVersionsList,
	listPublishedVersions,
	parsePublishedVersion,
	removePublishedVersion,
	resolveSetTargets,
	setPublishedVersion,
} from "./publishedVersions";
import * as s from "./sign";
import * as u from "./upload";
import { channel, env, isCi, project, version, versionShort } from "./util";

export type MakeConfigOptions = {
	skipSign?: boolean;
};

export const makeConfig = (override: Partial<b.BuildOptions>, opts: MakeConfigOptions): b.BuildOptions => {
	const { skipSign } = opts;

	const validatedOverride = Object.fromEntries(Object.entries(override).filter(([, v]) => Boolean(v)));

	if (env.optional("IS_MERGE_REQUEST") === "true") {
		return {
			productName: "Gramax Test",
			productId: "gramax.dev",
			version: version(),
			updateChannel: channel(),

			useDevelopmentProfile: true,
			useSign: isCi && !skipSign,
			useSignVerify: isCi && !skipSign,
			...validatedOverride,
		};
	}

	if (env.optional("BRANCH") === "develop") {
		return {
			productName: "Gramax Dev",
			productId: "gramax.dev",
			version: version(),
			updateChannel: channel(),
			updateHost: env.optional("FORCE_HOST"),

			useDevelopmentProfile: true,
			useSign: isCi && !skipSign,
			useSignVerify: isCi && !skipSign,
			...validatedOverride,
		};
	}

	return {
		productName: "Gramax",
		productId: "gramax.app",
		version: version(),
		updateChannel: channel(),
		updateHost: env.optional("FORCE_HOST"),
		useDevelopmentProfile: false,
		useSign: isCi && !skipSign,
		useSignVerify: isCi && !skipSign,
		...validatedOverride,
	};
};

export const build = async () => {
	const help =
		"usage: build --web --darwin-aarch64 --darwin-x86_64 --windows-x86_64 --linux-x86_64 --android --ios --product-name <product-name>";

	const args = parseArgs({
		args: process.argv.slice(3),
		options: {
			web: {
				type: "boolean",
			},
			"darwin-aarch64": {
				type: "boolean",
			},
			"darwin-x86_64": {
				type: "boolean",
			},
			"windows-x86_64": {
				type: "boolean",
			},
			"linux-x86_64": {
				type: "boolean",
			},
			android: {
				type: "boolean",
			},
			ios: {
				type: "boolean",
			},
			"no-sign": {
				type: "boolean",
			},
			upload: {
				type: "boolean",
			},
			"product-name": {
				type: "string",
			},
		},
	});

	const config = makeConfig({ productName: args.values["product-name"] }, { skipSign: !!args.values["no-sign"] });

	if (!Object.values(args.values).some(Boolean)) {
		console.error(help);
		process.exit(1);
	}

	if (args.values.web) await b.web(config);
	if (args.values["darwin-aarch64"]) await b.macOsArm64(config);
	if (args.values["darwin-x86_64"]) await b.macOsIntel(config);
	if (args.values["windows-x86_64"]) await b.windows(config);
	if (args.values["linux-x86_64"]) await b.linux(config);
	if (args.values.android) await b.android(config);
	if (args.values.ios) await b.ios(config);

	if (args.values.upload) await u.upload(channel(), version());
};

export const signCiWindows = async () => {
	if (!isCi) return;

	const help = "usage: sign-ci-windows";

	const args = parseArgs({
		args: process.argv.slice(3),
		options: {
			profile: {
				type: "string",
			},
			target: {
				type: "string",
			},
		},
	});

	assert(args.values.target, `provide a target: ${help}`);
	assert(args.values.profile, `provide a profile: ${help}`);

	await s.win(join(project, "target", args.values.target, args.values.profile, "gramax.exe"));
};

export const sign = async () => {
	const help = `sign <path> --darwin-aarch64 --darwin-x86_64 --windows-x86_64 --android`;

	const args = parseArgs({
		args: process.argv.slice(3),
		allowPositionals: true,
		options: {
			"darwin-aarch64": {
				type: "boolean",
			},
			"darwin-x86_64": {
				type: "boolean",
			},
			"windows-x86_64": {
				type: "boolean",
			},
			android: {
				type: "boolean",
			},
		},
	});

	const path = join(project, ...args.positionals);

	assert(path, `provide a path of artifact to sign: ${help}`);
	assert(await fs.exists(path), `path: ${path} does not exist`);

	assert(
		args.values["darwin-aarch64"] ||
			args.values["darwin-x86_64"] ||
			args.values["windows-x86_64"] ||
			args.values.android,
		`provide what kind of artifact to sign: ${help}`,
	);

	if (args.values["darwin-aarch64"]) {
		console.log("signing darwin-aarch64");
		await s.macos(path);
		console.log("signed darwin-aarch64");
	}

	if (args.values["darwin-x86_64"]) {
		console.log("signing darwin-x86_64");
		await s.macos(path);
		console.log("signed darwin-x86_64");
	}

	if (args.values["windows-x86_64"]) {
		console.log("signing windows-x86_64");
		await s.win(path);
		console.log("signed windows-x86_64");
	}

	if (args.values.android) {
		console.log("signing android");
		await s.android(path, null!);
		console.log("signed android");
	}
};

export const upload = async () => {
	await u.upload(channel(), version());
};

export const makeIcons = async () => {
	const args = parseArgs({
		args: process.argv.slice(3),
		allowPositionals: true,
		options: {
			"no-badges": {
				type: "boolean",
			},
		},
	});

	const out = `${project}/apps/tauri/src-tauri/icons`;

	console.log(`create app icons at: ${out}`);

	await fs.mkdir(`${out}/badges`, { recursive: true });

	console.log("create tauri app icons");
	await $`cargo tauri icon ${out}/icon.png --output ${out} --ios-color "#121315"`;

	const magick = await $`command -v magick`.nothrow().quiet();
	if (magick.exitCode) {
		console.warn("magick not found, skipping app badges");
		return;
	}

	if (args.values["no-badges"]) {
		console.warn("skipping app badges");
		return;
	}
	console.log("(win) create app badges");
	for (let num = 1; num < 101; num++) {
		await $`magick -size 128x128 xc:none -fill "#FF0000" -draw "circle 64,64 64,20" \
        -gravity center -fill white -pointsize 58 -font Arial -annotate 0 "${num >= 100 ? "99+" : num}" \
        ${out}/badges/badge_${num}.png`;
	}

	const dotclean = await $`command -v dot_clean`.nothrow().quiet();
	if (dotclean.exitCode === 0) await $`dot_clean ${out}/badges`;
	const files = await $`basename $(find ${out}/badges -type f -name "badge_*.png")`.text();
	await $`COPYFILE_DISABLE=1 tar -Jcf ${out}/badges.tar.xz -C ${out}/badges ${files.split("\n")}`;
	console.log("(win) created app badges");
};

export const printVersion = async () => {
	const subcommand = process.argv[3];

	switch (subcommand) {
		case "list":
			await listVersions();
			return;
		case "remove":
			await removeVersion();
			return;
		case "set":
			await setVersion();
			return;
	}

	const args = parseArgs({
		args: process.argv.slice(3),
		allowPositionals: true,
		options: {
			short: { type: "boolean" },
		},
	});

	if (args.values?.short) {
		console.log(versionShort(args.positionals?.join("-").replaceAll(" ", "-").trim()));
		return;
	}

	const v = version(args.positionals?.join("-").replaceAll(" ", "-").trim());
	console.log(v);
};

const versionChannel = (value: string | boolean | undefined) => {
	assert(typeof value !== "boolean", "--channel requires a value");
	return value || channel();
};

const listVersions = async () => {
	const help = "usage: version list [--channel <channel>] [--release <release>]";

	const args = parseArgs({
		args: process.argv.slice(4),
		allowPositionals: true,
		options: {
			channel: { type: "string" },
			release: { type: "string" },
		},
	});

	assert(args.positionals.length === 0, help);

	const selectedChannel = versionChannel(args.values.channel);
	const releases = await listPublishedVersions({
		channel: selectedChannel,
		release: args.values.release,
	});

	console.log(formatPublishedVersionsList(selectedChannel, releases));
};

const removeVersion = async () => {
	const help = "usage: version remove <ver> [--channel <channel>] [--force]";

	const args = parseArgs({
		args: process.argv.slice(4),
		allowPositionals: true,
		options: {
			channel: { type: "string" },
			force: { type: "boolean" },
		},
	});

	assert(args.positionals.length === 1, help);

	const removableVersion = args.positionals[0];
	assert(removableVersion, help);
	parsePublishedVersion(removableVersion);

	const selectedChannel = versionChannel(args.values.channel);
	const plan = await removePublishedVersion({
		channel: selectedChannel,
		version: removableVersion,
		force: !!args.values.force,
	});

	if (plan.blockingPointers.length > 0) {
		console.error(`version ${removableVersion} is still referenced by latest pointers:`);
		for (const pointer of plan.blockingPointers) console.error(`  ${pointer.path} -> ${pointer.version}`);
		process.exit(1);
	}

	if (!args.values.force) {
		console.log(`dry-run: ${plan.keys.length} objects would be removed from ${selectedChannel}`);
		for (const key of plan.keys) console.log(`  ${key}`);
		console.log("rerun with --force to delete these objects");
		return;
	}

	console.log(`removed ${plan.keys.length} objects from ${selectedChannel}`);
	for (const key of plan.keys) console.log(`  ${key}`);
};

const setVersion = async () => {
	const help = "usage: version set <ver> [--channel <channel>] [--global] [--inner]";

	const args = parseArgs({
		args: process.argv.slice(4),
		allowPositionals: true,
		options: {
			channel: { type: "string" },
			global: { type: "boolean" },
			inner: { type: "boolean" },
		},
	});

	assert(args.positionals.length === 1, help);

	const nextVersion = args.positionals[0];
	assert(nextVersion, help);
	parsePublishedVersion(nextVersion);

	const selectedChannel = versionChannel(args.values.channel);
	const targets = resolveSetTargets({
		global: !!args.values.global,
		inner: !!args.values.inner,
	});
	const paths = await setPublishedVersion({
		channel: selectedChannel,
		version: nextVersion,
		targets,
	});

	console.log(`set ${paths.length} latest pointers to ${nextVersion} in ${selectedChannel}`);
	for (const pointerPath of paths) console.log(`  ${pointerPath}`);
};
