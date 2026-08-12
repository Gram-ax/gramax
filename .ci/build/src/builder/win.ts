import { $ } from "bun";
import path from "path";
import * as sign from "../sign";
import { Builder } from "./builder";

export class WindowsBuilder extends Builder {
	override get isSigningSupported(): boolean {
		return true;
	}

	override get platform(): string {
		return "windows-x86_64";
	}

	override get humanPlatform(): string {
		return "win";
	}

	override get target(): string {
		return "x86_64-pc-windows-msvc";
	}

	override async _build(): Promise<void> {
		const target = this.target;
		const config = this._createTauriConfig();
		const profile = this.profile;

		await $`cargo tauri build --ci --target ${target} -c ${config} -v --runner cargo-xwin -- --profile ${profile}`
			.cwd("apps/tauri")
			.throws(true);
	}

	override async _package(): Promise<void> {
		const bundlesrc = path.join(this.targetDir, "bundle/nsis");

		await this._artifact({
			name: `gramax.${this.platform}.exe`,
			srcdir: this.targetDir,
			filename: "gramax.exe",
		});

		await this._artifact({
			name: `gramax.${this.platform}.setup.exe`,
			srcdir: bundlesrc,
			filename: `${this.opts.productName}_${this.opts.version}_x64-setup.exe`,
		});

		await this._artifact({
			name: `gramax.${this.platform}.setup.exe.sig`,
			srcdir: bundlesrc,
			filename: `${this.opts.productName}_${this.opts.version}_x64-setup.exe.sig`,
		});
	}

	override async _sign(): Promise<void> {
		// gramax.windows-x86_64.exe & the app packaged in installer are already signed
	}

	override async _verify(): Promise<void> {
		await sign.win.verify(path.join(this.outdir, `gramax.${this.platform}.exe`));
	}
}
