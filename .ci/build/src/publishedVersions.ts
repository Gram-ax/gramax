import assert from "assert";
import type { S3Client } from "bun";
import type { S3Bucket } from "./s3";
import { createS3Bucket, fromS3Key, toS3Key } from "./s3";

export const allowedFiles = {
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

export type PublishedVersion = {
	version: string;
	release: string;
	patch: string;
};

export type S3ObjectEntry = {
	key: string;
};

export type VersionPointer = {
	path: string;
	version: string;
};

export type ReleaseVersions = {
	release: string;
	versions: string[];
	globalPointers: VersionPointer[];
	innerPointers: VersionPointer[];
};

export type SetTargets = {
	global: boolean;
	inner: boolean;
};

export type RemovalPlan = {
	keys: string[];
	blockingPointers: VersionPointer[];
};

type S3ListInput = Parameters<S3Client["list"]>[0];

const s3path = (...parts: string[]) => parts.join("/");

const sortVersionsDesc = (left: string, right: string) => {
	return right.localeCompare(left, "en", { numeric: true });
};

const sortPointers = (left: VersionPointer, right: VersionPointer) => left.path.localeCompare(right.path);

const mapLimit = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) => {
	const results: R[] = [];

	for (let i = 0; i < items.length; i += limit) {
		results.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
	}

	return results;
};

export const parsePublishedVersion = (version: string): PublishedVersion => {
	const match = version.match(/^(\d{4})\.(\d{1,2})\.(.+)$/);
	assert(match, `invalid version: ${version}`);

	const year = match[1];
	const month = match[2];
	const patch = match[3];
	assert(year && month && patch, `invalid version: ${version}`);

	return {
		version,
		release: `${year}.${Number(month)}`,
		patch,
	};
};

export const buildReleasePrefix = (channel: string, release: string) => {
	return `${s3path(channel, release)}/`;
};

export const buildVersionPrefix = (channel: string, version: string) => {
	const parsed = parsePublishedVersion(version);
	return `${s3path(channel, parsed.release, parsed.patch)}/`;
};

export const buildGlobalVersionPath = (channel: string, platform: string, pack: string) => {
	return s3path(channel, "latest", `gramax.${platform}.${pack}.version`);
};

export const buildInnerVersionPath = (channel: string, release: string, platform: string, pack: string) => {
	return s3path(channel, release, "latest", `gramax.${platform}.${pack}.version`);
};

export const versionPointerPaths = (channel: string, release: string, targets: SetTargets) => {
	const paths: string[] = [];

	for (const [platform, packages] of Object.entries(allowedFiles)) {
		for (const pack of Object.keys(packages)) {
			if (targets.global) paths.push(buildGlobalVersionPath(channel, platform, pack));
			if (targets.inner) paths.push(buildInnerVersionPath(channel, release, platform, pack));
		}
	}

	return paths.sort();
};

export const resolveSetTargets = (flags: SetTargets): SetTargets => {
	if (!flags.global && !flags.inner) return { global: true, inner: true };
	return flags;
};

const versionFromObjectKey = (key: string) => {
	const match = key.match(/^[^/]+\/(\d{4}\.\d{1,2})\/([^/]+)\//);
	if (!match) return null;

	const [, release, patch] = match;
	if (patch === "latest") return null;

	return `${release}.${patch}`;
};

const innerReleaseFromPointerPath = (key: string) => {
	const match = key.match(/^[^/]+\/(\d{4}\.\d{1,2})\/latest\/gramax\.[^/]+\.version$/);
	return match?.[1] ?? null;
};

const isGlobalPointerPath = (key: string) => /^[^/]+\/latest\/gramax\.[^/]+\.version$/.test(key);

export const groupPublishedVersions = (objects: S3ObjectEntry[], pointers: VersionPointer[]): ReleaseVersions[] => {
	const versionsByRelease = new Map<string, Set<string>>();
	const releases = new Set<string>();

	for (const object of objects) {
		const version = versionFromObjectKey(object.key);
		if (!version) continue;

		const parsed = parsePublishedVersion(version);
		releases.add(parsed.release);
		const versions = versionsByRelease.get(parsed.release) ?? new Set<string>();
		versions.add(parsed.version);
		versionsByRelease.set(parsed.release, versions);
	}

	for (const pointer of pointers) {
		const innerRelease = innerReleaseFromPointerPath(pointer.path);
		if (innerRelease) releases.add(innerRelease);

		if (isGlobalPointerPath(pointer.path)) {
			releases.add(parsePublishedVersion(pointer.version).release);
		}
	}

	return [...releases].sort(sortVersionsDesc).map((release) => {
		const versions = [...(versionsByRelease.get(release) ?? [])].sort(sortVersionsDesc);
		const globalPointers: VersionPointer[] = [];
		const innerPointers: VersionPointer[] = [];

		for (const pointer of pointers) {
			if (isGlobalPointerPath(pointer.path) && parsePublishedVersion(pointer.version).release === release) {
				globalPointers.push(pointer);
				continue;
			}

			if (innerReleaseFromPointerPath(pointer.path) === release) {
				innerPointers.push(pointer);
			}
		}

		return {
			release,
			versions,
			globalPointers: globalPointers.sort(sortPointers),
			innerPointers: innerPointers.sort(sortPointers),
		};
	});
};

export const formatPublishedVersionsList = (channel: string, releases: ReleaseVersions[]) => {
	const lines = [`channel: ${channel}`];

	if (releases.length === 0) {
		lines.push("", "no versions found");
		return lines.join("\n");
	}

	for (const release of releases) {
		lines.push("", `release ${release.release}`);

		if (release.globalPointers.length > 0) {
			lines.push("  global latest:");
			for (const pointer of release.globalPointers) lines.push(`    ${pointer.path} -> ${pointer.version}`);
		}

		if (release.innerPointers.length > 0) {
			lines.push("  inner latest:");
			for (const pointer of release.innerPointers) lines.push(`    ${pointer.path} -> ${pointer.version}`);
		}

		if (release.versions.length > 0) {
			lines.push("  versions:");
			for (const version of release.versions) lines.push(`    ${version}`);
		}
	}

	return lines.join("\n");
};

export const planVersionRemoval = (opts: {
	channel: string;
	version: string;
	objects: S3ObjectEntry[];
	pointers: VersionPointer[];
}): RemovalPlan => {
	const prefix = buildVersionPrefix(opts.channel, opts.version);
	const blockingPointers = opts.pointers.filter((pointer) => pointer.version === opts.version).sort(sortPointers);
	const keys = opts.objects
		.map((object) => object.key)
		.filter((key) => key.startsWith(prefix))
		.sort();

	return { keys, blockingPointers };
};

export const listS3Objects = async (bucket: S3Bucket, input: S3ListInput): Promise<S3ObjectEntry[]> => {
	const objects: S3ObjectEntry[] = [];
	let continuationToken = input?.continuationToken;

	do {
		const listInput = {
			...input,
			prefix: input?.prefix ? toS3Key(bucket.base, input.prefix) : input?.prefix,
			...(continuationToken ? { continuationToken } : {}),
		};
		const res = await bucket.client.list(listInput);
		objects.push(...(res.contents ?? []).map(({ key }) => ({ key: fromS3Key(bucket.base, key) })));
		continuationToken = res.isTruncated ? res.nextContinuationToken : undefined;
		assert(!res.isTruncated || continuationToken, "S3 list response is truncated without continuation token");
	} while (continuationToken);

	return objects;
};

export const listS3Prefixes = async (bucket: S3Bucket, input: S3ListInput): Promise<string[]> => {
	const prefixes: string[] = [];
	let continuationToken = input?.continuationToken;

	do {
		const listInput = {
			...input,
			prefix: input?.prefix ? toS3Key(bucket.base, input.prefix) : input?.prefix,
			...(continuationToken ? { continuationToken } : {}),
		};
		const res = await bucket.client.list(listInput);
		prefixes.push(...(res.commonPrefixes ?? []).map(({ prefix }) => fromS3Key(bucket.base, prefix)));
		continuationToken = res.isTruncated ? res.nextContinuationToken : undefined;
		assert(!res.isTruncated || continuationToken, "S3 list response is truncated without continuation token");
	} while (continuationToken);

	return prefixes;
};

export const readVersionPointers = async (bucket: S3Bucket, paths: string[]) => {
	const pointers = await mapLimit(paths, 16, async (pointerPath): Promise<VersionPointer | null> => {
		const version = await bucket.client
			.file(toS3Key(bucket.base, pointerPath))
			.text()
			.then((text) => text.trim())
			.catch(() => null);

		return version ? { path: pointerPath, version } : null;
	});

	return pointers.filter((pointer) => pointer !== null).sort(sortPointers);
};

const releaseFromPrefix = (channel: string, prefix: string) => {
	const match = prefix.match(new RegExp(`^${channel}/(\\d{4}\\.\\d{1,2})/$`));
	return match?.[1] ?? null;
};

const versionObjectEntries = async (bucket: S3Bucket, channel: string, release: string) => {
	const prefixes = await listS3Prefixes(bucket, { prefix: buildReleasePrefix(channel, release), delimiter: "/" });

	return prefixes.filter((prefix) => !prefix.endsWith("/latest/")).map((prefix) => ({ key: prefix }));
};

export const listPublishedVersions = async (opts: { channel: string; release?: string }) => {
	const bucket = createS3Bucket();
	const globalPointerPaths = versionPointerPaths(opts.channel, "", { global: true, inner: false });
	const [globalPointers, releasePrefixes] = await Promise.all([
		readVersionPointers(bucket, globalPointerPaths),
		opts.release ? Promise.resolve([]) : listS3Prefixes(bucket, { prefix: `${opts.channel}/`, delimiter: "/" }),
	]);
	const releases = opts.release
		? [opts.release]
		: [
				...new Set([
					...releasePrefixes
						.map((prefix) => releaseFromPrefix(opts.channel, prefix))
						.filter((release) => release !== null),
					...globalPointers.map((pointer) => parsePublishedVersion(pointer.version).release),
				]),
			].sort(sortVersionsDesc);

	const pointerPaths = releases.flatMap((release) =>
		versionPointerPaths(opts.channel, release, { global: false, inner: true }),
	);
	const [objects, pointers] = await Promise.all([
		Promise.all(releases.map((release) => versionObjectEntries(bucket, opts.channel, release))).then((entries) =>
			entries.flat(),
		),
		readVersionPointers(bucket, pointerPaths),
	]);

	return groupPublishedVersions(objects, [...globalPointers, ...pointers]);
};

export const setPublishedVersion = async (opts: { channel: string; version: string; targets: SetTargets }) => {
	const bucket = createS3Bucket();
	const parsed = parsePublishedVersion(opts.version);
	const paths = versionPointerPaths(opts.channel, parsed.release, opts.targets);

	for (const pointerPath of paths) {
		await bucket.client.write(toS3Key(bucket.base, pointerPath), opts.version);
	}

	return paths;
};

export const removePublishedVersion = async (opts: { channel: string; version: string; force: boolean }) => {
	const bucket = createS3Bucket();
	const parsed = parsePublishedVersion(opts.version);
	const objects = await listS3Objects(bucket, { prefix: buildVersionPrefix(opts.channel, opts.version) });
	const pointerPaths = versionPointerPaths(opts.channel, parsed.release, { global: true, inner: true });
	const pointers = await readVersionPointers(bucket, pointerPaths);
	const plan = planVersionRemoval({ channel: opts.channel, version: opts.version, objects, pointers });

	if (plan.blockingPointers.length > 0 || !opts.force) return plan;

	for (const key of plan.keys) {
		await bucket.client.delete(toS3Key(bucket.base, key));
	}

	return plan;
};
