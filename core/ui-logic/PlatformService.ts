import { type Environment, getExecutingEnvironment } from "@app/resolveModule/env";
import { PlatformEnvironments } from "@plugins/api/sdk";

const environmentToPlatformMap: Partial<Record<Environment, keyof typeof PlatformEnvironments>> = {
	browser: "Browser",
	tauri: "Desktop",
	next: "DocPortal",
	static: "Static",
	cli: "StaticCli",
};

class PlatformService {
	private _platform: Environment;

	constructor() {
		this._platform = getExecutingEnvironment();
	}

	get value(): Environment {
		return this._platform;
	}

	get isBrowser() {
		return this._platform === PlatformEnvironments.Browser;
	}

	get isDesktop() {
		return this._platform === PlatformEnvironments.Desktop;
	}

	get isDocPortal() {
		return this._platform === PlatformEnvironments.DocPortal;
	}

	get isStatic() {
		return this._platform === PlatformEnvironments.Static;
	}

	get isStaticCli() {
		return this._platform === PlatformEnvironments.StaticCli;
	}
	isPlatform = (platform: keyof typeof PlatformEnvironments): boolean => {
		return environmentToPlatformMap[this._platform] === platform;
	};

	getCurrentPlatform(): keyof typeof PlatformEnvironments {
		return environmentToPlatformMap[this._platform] || "Browser";
	}
}

export const PlatformServiceNew = new PlatformService();
