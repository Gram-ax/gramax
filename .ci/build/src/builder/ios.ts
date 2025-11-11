import { $ } from "bun";
import path from "path";
import { commitCount, project } from "../util";
import { Builder } from "./builder";

export class IosBuilder extends Builder {
  override get isSigningSupported(): boolean {
    return false;
  }
  
	override get platform(): string {
		return "ios";
	}

	override get target(): string {
		return "arm64-apple-ios";
	}

	override async build(): Promise<void> {
		const config = this.createTauriConfig();

		await $`cargo tauri ios build -c ${config} --build-number ${commitCount || "1"}`.cwd("apps/tauri").throws(true);
	}

	override async package(): Promise<void> {
		const srcdir = path.join(project, "apps", "tauri", "src-tauri", "gen", "apple", "build", "arm64");

		await this.artifact({
			name: `gramax.${this.platform}.ipa`,
			srcdir,
			filename: `${this.opts.productName}.ipa`,
		});
	}

	override async sign(): Promise<void> {}

	override async verify(): Promise<void> {}
}
