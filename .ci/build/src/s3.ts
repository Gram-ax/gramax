import assert from "assert";
import { S3Client } from "bun";
import { env } from "./util";

export type S3BasePath = {
	bucket: string;
	prefix: string;
};

export type S3Bucket = {
	client: S3Client;
	base: S3BasePath;
};

export const parseS3BasePath = (basePath: string): S3BasePath => {
	const [bucket, ...prefixParts] = basePath.split("/").filter(Boolean);
	assert(bucket, "S3_BASE_PATH must include bucket name");

	return {
		bucket,
		prefix: prefixParts.join("/"),
	};
};

export const toS3Key = (base: S3BasePath, key: string) => {
	return base.prefix ? `${base.prefix}/${key}` : key;
};

export const fromS3Key = (base: S3BasePath, key: string) => {
	if (!base.prefix) return key;
	const prefix = `${base.prefix}/`;
	return key.startsWith(prefix) ? key.slice(prefix.length) : key;
};

export const createS3Bucket = (): S3Bucket => {
	const base = parseS3BasePath(env("S3_BASE_PATH"));

	return {
		base,
		client: new S3Client({
			accessKeyId: env("S3_ACCESS_KEY"),
			secretAccessKey: env("S3_SECRET_KEY"),
			endpoint: env("S3_HOST"),
			bucket: base.bucket,
		}),
	};
};
