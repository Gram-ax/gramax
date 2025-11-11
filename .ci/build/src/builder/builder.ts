import assert from "assert";
import { $ } from "bun";
import fs from "fs/promises";
import path from "path";
import { project, sizeOf, version } from "../util";

const artifactsDir = path.join(project, "apps-build-artifacts");

export type BuildOptions = {
	productName: "Gramax" | "Gramax Dev" | "Gramax Test" | string;
	productId: "gramax.app" | "gramax.dev" | string;

	useDevelopmentProfile: boolean;

	version: string;
	updateChannel: "prod" | "dev" | string;

	useSign: boolean;
	useSignVerify: boolean;
};

export type CreateArtifactOptions =
	| CreateWholeDirArtifactOptions
	| CreateFileArtifactOptions
	| CreateTarArtifactOptions;

export type CreateFileArtifactOptions = { name: string; srcdir: string; filename: string };
export type CreateWholeDirArtifactOptions = { srcdir: string };
export type CreateTarArtifactOptions = CreateFileArtifactOptions & { tar: true };

export type BuildPlatform =
	| "darwin-aarch64"
	| "darwin-x86_64"
	| "windows-x86_64"
	| "linux-x86_64"
	| "android"
	| "ios"
	| "web"
	| string;

export type BuildPlatformTarget =
	| "aarch64-apple-darwin"
	| "x86_64-apple-darwin"
	| "x86_64-pc-windows-msvc"
	| "x86_64-unknown-linux-gnu"
	| "aarch64-linux-android"
	| "arm64-apple-ios"
	| string;

export abstract class Builder {
	private _artifacts: string[] = [];

	constructor(private _opts: BuildOptions) {
		this._opts.version = version(this.humanPlatform);
	}

	get opts(): BuildOptions {
		return this._opts;
	}

	get outdir(): string {
		return path.join(artifactsDir, this.platform);
	}

	get webdir(): string {
		return path.join(artifactsDir, "web");
	}

	get profile(): string {
		return this._opts.useDevelopmentProfile ? "development" : "release";
	}

	get humanPlatform(): string {
		return this.platform;
	}

	abstract get platform(): string;

	abstract get target(): string;

	get targetDir(): string {
		return path.join(project, "target", this.target, this.profile);
	}

	async process(): Promise<void> {
		assert(
			await this.isWebPresent(),
			"you have to build web first; didn't find web assets in apps-build-artifacts/web",
		);

		this.log("building");
		await this.build();

		this.log("collecting artifacts");
		await this.cleanArtifactsDir();
		await this.package();

		if (this.isSigningSupported && this.opts.useSign) {
			this.log("signing necessary built artifacts");
			await this.sign();
		} else {
			this.log("skipped signing any of artifacts");
		}

		if (this.isSigningSupported && this.opts.useSignVerify) {
			this.log("verifying necessary signed artifacts");
			await this.verify();
			this.log("verified necessary signed artifacts");
		} else {
			this.log("skipped verifying any of artifacts");
		}

		if (this._artifacts.length > 0) {
			console.log(`${this._artifacts.length} artifacts were created:`);
			for (const artifact of this._artifacts) console.log(`  - ${artifact}`);
		} else {
			console.warn("no artifacts were created");
		}
	}

	protected abstract get isSigningSupported(): boolean;

	protected abstract build(): Promise<void>;
	protected abstract package(): Promise<void>;
	protected abstract sign(): Promise<void>;
	protected abstract verify(): Promise<void>;

	protected createTauriConfig(): string {
		process.env.UPDATE_CHANNEL = this.opts.updateChannel; // used for legacy updater; remove if not needed anymore

		const updatehost = this.opts.updateChannel === "prod" ? "gram.ax" : "develop.gram.ax";

		const signCommand =
			this.platform === "windows-x86_64"
				? `${path.join(project, "gx")} sign-ci-windows --target ${this.target} --profile ${this.profile}`
				: "";

		return JSON.stringify({
			productName: this.opts.productName,
			identifier: this.opts.productId,
			version: this.opts.version,
			bundle: {
				resources: this.platform === "darwin-x86_64" ? ["./ru.lproj", "./en.lproj"] : [],
				windows: {
					signCommand,
				},
			},
			build: {
				beforeBuildCommand: "",
				frontendDist: this.webdir,
			},
			plugins: {
				updater: {
					endpoints: [
						`https://${updatehost}/apps/${this.platform}/updates?channel=${this.opts.updateChannel}`,
					],
				},
			},
		});
	}

	protected log(...params: any[]): void {
		console.info(`(${this.platform}):`, ...params);
	}

	protected async artifact(opts: CreateArtifactOptions): Promise<void> {
		if ("tar" in opts && opts.tar) return await this._tar(opts);

		const from = "filename" in opts && opts.filename ? path.join(opts.srcdir, opts.filename) : opts.srcdir;
		const to = "name" in opts && opts.name ? path.join(this.outdir, opts.name) : this.outdir;

		assert(await fs.exists(from), `failed to create artifact: source file or directory not found: ${from}`);
		await fs.cp(from, to, { recursive: true });

		const size = await sizeOf(to);
		this.log("artifact", "name" in opts ? opts.name : "(whole dir)", `created`, `size=${size}`, `src=${from}`);
		this._artifacts.push(to);
	}

	private async _tar(opts: CreateTarArtifactOptions): Promise<void> {
		assert(opts.name, "name is required for tar artifact");

		const from = opts.filename || "";
		const out = path.join(this.outdir, opts.name);
		await $`tar -czcf ${out} -C "${opts.srcdir}" "${from || "."}"`.quiet();

		const tarSize = await sizeOf(out);

		this.log("tar artifact", opts.name, `created`, `size=${tarSize}`, `src=${path.join(opts.srcdir, from)}`);
		this._artifacts.push(out);
	}

	protected async isWebPresent(): Promise<boolean> {
		if (this.platform === "web") return true;

		const webdir = this.webdir;
		if (!(await fs.exists(webdir))) return false;

		const readdir = await fs.readdir(webdir);
		if (!readdir.includes("index.html")) return false;

		this.log("found web assets in", webdir);
		return true;
	}

	async cleanArtifactsDir(): Promise<void> {
		const outdir = this.outdir;
		if (await fs.exists(outdir)) await fs.rm(outdir, { recursive: true });
		await fs.mkdir(outdir, { recursive: true });
	}
}
