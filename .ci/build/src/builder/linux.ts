import { $ } from "bun";
import path from "path";
import { Builder } from "./builder";

export class LinuxBuilder extends Builder {
	override get isSigningSupported(): boolean {
		return false;
	}

	override get platform(): string {
		return "linux-x86_64";
	}

	override get humanPlatform(): string {
		return "linux";
	}

	override get target(): string {
		return "x86_64-unknown-linux-gnu";
	}

	override async _build(): Promise<void> {
		const target = this.target;
		const config = this._createTauriConfig();
		const profile = this.profile;

		await $`cargo tauri build --ci --target ${target} -c ${config} -- --profile ${profile}`
			.cwd("apps/tauri")
			.throws(true);
	}

	override async _package(): Promise<void> {
		const appimage = path.join(this.targetDir, "bundle/appimage");
		const deb = path.join(this.targetDir, "bundle/deb");
		const rpm = path.join(this.targetDir, "bundle/rpm");

		await this._artifact({
			name: `gramax.${this.platform}.appimage`,
			srcdir: appimage,
			filename: `${this.opts.productName}_${this.opts.version}_amd64.AppImage`,
		});

		await this._artifact({
			name: `gramax.${this.platform}.appimage.sig`,
			srcdir: appimage,
			filename: `${this.opts.productName}_${this.opts.version}_amd64.AppImage.sig`,
		});

		await this._artifact({
			name: `gramax.${this.platform}.deb`,
			srcdir: deb,
			filename: `${this.opts.productName}_${this.opts.version}_amd64.deb`,
		});

		await this._artifact({
			name: `gramax.${this.platform}.deb.sig`,
			srcdir: deb,
			filename: `${this.opts.productName}_${this.opts.version}_amd64.deb.sig`,
		});

		await this._artifact({
			name: `gramax.${this.platform}.rpm`,
			srcdir: rpm,
			filename: `${this.opts.productName}-${this.opts.version}-1.x86_64.rpm`,
		});

		await this._artifact({
			name: `gramax.${this.platform}.rpm.sig`,
			srcdir: rpm,
			filename: `${this.opts.productName}-${this.opts.version}-1.x86_64.rpm.sig`,
		});
	}

	override async _sign(): Promise<void> {}

	override async _verify(): Promise<void> {}
}
