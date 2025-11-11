import { $ } from "bun";
import path from "path";
import { project } from "../util";
import { Builder } from "./builder";

export class WebBuilder extends Builder {

	override get isSigningSupported(): boolean {
		return false;
	}

	override get platform(): string {
		return "web";
	}

	override get target(): never {
		throw new Error("Web builder does not have a target");
	}

	override async build(): Promise<void> {
		await $`bun run build`.cwd("apps/tauri").throws(true);
	}

	override async package(): Promise<void> {
		return await this.artifact({
			srcdir: path.join(project, "apps", "tauri", "dist"),
		});
	}

	override async sign(): Promise<void> {}

	override async verify(): Promise<void> {}
}
