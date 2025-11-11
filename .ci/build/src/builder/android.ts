import assert from "assert";
import { $ } from "bun";
import fs from "fs/promises";
import path from "path";
import * as sign from "../sign";
import { project } from "../util";
import { Builder } from "./builder";

export class AndroidBuilder extends Builder {
	override get isSigningSupported(): boolean {
		return false;
	}

	override get platform(): string {
		return "android";
	}

	override get humanPlatform(): string {
		return "android";
	}

	override get target(): string {
		return "aarch64-linux-android";
	}

	override async build(): Promise<void> {
		const config = this.createTauriConfig();

		await $`cargo tauri android build --apk --target aarch64 -c ${config}`.cwd("apps/tauri").throws(true);
	}

	override async package(): Promise<void> {
		const srcdir = path.join(
			project,
			"apps",
			"tauri",
			"src-tauri",
			"gen",
			"android",
			"app",
			"build",
			"outputs",
			"apk",
			"universal",
			"release",
		);

		const apkFiles = await fs.readdir(srcdir);
		const apkFile = apkFiles.find((file) => file.endsWith(".apk"));

		assert(apkFile, `no apk file found in ${srcdir}`);

		await this.artifact({
			name: `gramax.${this.platform}.apk`,
			srcdir,
			filename: apkFile,
		});
	}

	override async sign(): Promise<void> {
		const keystore = path.join(project, "apps", "tauri", "android.keystore");

		await sign.android(path.join(this.outdir, `gramax.${this.platform}.apk`), keystore);
	}

	override async verify(): Promise<void> {}
}
