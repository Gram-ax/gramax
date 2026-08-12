import { type Environment, getExecutingEnvironment } from "@app/resolveModule/env";
import { PlatformEnvironments } from "@plugins/api/sdk";

const environmentToPlatformMap: Partial<Record<Environment, keyof typeof PlatformEnvironments>> = {
	web: "Web",
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

	get isWeb() {
		return this._platform === PlatformEnvironments.Web;
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

	get isHostedSsr() {
		return this.isDocPortal || this.isStatic;
	}

	isPlatform = (platform: keyof typeof PlatformEnvironments): boolean => {
		return environmentToPlatformMap[this._platform] === platform;
	};

	getCurrentPlatform(): keyof typeof PlatformEnvironments {
		return environmentToPlatformMap[this._platform] || "Web";
	}
}

export const PlatformServiceNew = new PlatformService();
