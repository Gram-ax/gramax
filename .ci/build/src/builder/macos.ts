import { $ } from "bun";
import path from "path";
import * as sign from "../sign";
import { Builder } from "./builder";

abstract class DarwinBuilder extends Builder {
	override get isSigningSupported(): boolean {
		return true;
	}

	override async build(): Promise<void> {
		const target = this.target;
		const config = this.createTauriConfig();
		const profile = this.profile;

		await $`cargo tauri build --ci --target ${target} -c ${config} -- --profile ${profile}`
			.cwd("apps/tauri")
			.throws(true);
	}

	override async package(): Promise<void> {
		const bundlesrc = path.join(this.targetDir, "bundle/macos");
		const dmgsrc = path.join(this.targetDir, "bundle/dmg");

		const ext = this.platform === "darwin-aarch64" ? "aarch64" : "x64";

		await this.artifact({
			name: `gramax.${this.platform}.app.tar.gz`,
			srcdir: bundlesrc,
			filename: `${this.opts.productName}.app`,
			tar: true,
		});

		await this.artifact({
			name: `gramax.${this.platform}.dmg`,
			srcdir: dmgsrc,
			filename: `${this.opts.productName}_${this.opts.version}_${ext}.dmg`,
		});

		await this.artifact({
			name: `gramax.${this.platform}.update.tar.gz`,
			srcdir: bundlesrc,
			filename: `${this.opts.productName}.app.tar.gz`,
		});

		await this.artifact({
			name: `gramax.${this.platform}.update.tar.gz.sig`,
			srcdir: bundlesrc,
			filename: `${this.opts.productName}.app.tar.gz.sig`,
		});
	}

	override async sign(): Promise<void> {
		await sign.macos(path.join(this.outdir, `gramax.${this.platform}.dmg`));
	}

	override async verify(): Promise<void> {
		await sign.macos.verify(path.join(this.outdir, `gramax.${this.platform}.dmg`));
	}
}

export class DarwinArm64Builder extends DarwinBuilder {
	override get platform(): string {
		return "darwin-aarch64";
	}

	override get humanPlatform(): string {
		return "mac-silicon";
	}

	override get target(): string {
		return "aarch64-apple-darwin";
	}
}

export class DarwinX64Builder extends DarwinBuilder {
	override get platform(): string {
		return "darwin-x86_64";
	}

	override get humanPlatform(): string {
		return "mac-intel";
	}

	override get target(): string {
		return "x86_64-apple-darwin";
	}
}
