import { PluginConfig, PluginMetadata } from "@plugins/types";
import type { PlatformEnvironmentKey } from "@plugins/api/sdk/utilities";
import semver from "semver";

interface ValidationResult {
	valid: boolean;
	errors: string[];
	metadata?: PluginMetadata;
}
const PLUGIN_ARCHITECTURE_VERSION = "0.1.0";

export class PluginValidator {
	private _systemVersion: string = PLUGIN_ARCHITECTURE_VERSION;

	validateFiles(pluginConfig: PluginConfig | PluginMetadata): ValidationResult {
		const errors: string[] = [];
		const metadata = "metadata" in pluginConfig ? pluginConfig.metadata : pluginConfig;

		this.validateMetadataFields(metadata, errors);

		this.validateCompatibility(metadata, errors);

		return {
			valid: errors.length === 0,
			errors,
			metadata: errors.length === 0 ? metadata : undefined,
		};
	}

	private validateMetadataFields(metadata: PluginMetadata, errors: string[]): void {
		if (!metadata.id || typeof metadata.id !== "string") {
			errors.push("Metadata must have a valid 'id' field");
		}

		if (!metadata.name || typeof metadata.name !== "string") {
			errors.push("Metadata must have a valid 'name' field");
		}

		if (!metadata.version || typeof metadata.version !== "string") {
			errors.push("Metadata must have a valid 'version' field");
		}
	}

	private validateCompatibility(metadata: PluginMetadata, errors: string[]): void {
		const pluginVersion = metadata.version;

		// Skip compatibility check if version field is already invalid
		if (!pluginVersion) {
			return;
		}

		// 1. Check if plugin version is valid semver format
		if (!semver.valid(pluginVersion)) {
			errors.push(`Plugin version '${pluginVersion}' is not a valid semantic version`);
			return;
		}

		// 2. Check if system version is valid semver format
		if (!semver.valid(this._systemVersion)) {
			errors.push(`System version '${this._systemVersion}' is not a valid semantic version`);
			return;
		}

		const pluginMajor = semver.major(pluginVersion);
		const pluginMinor = semver.minor(pluginVersion);
		const systemMajor = semver.major(this._systemVersion);
		const systemMinor = semver.minor(this._systemVersion);

		// 3. Major version must match exactly
		if (pluginMajor !== systemMajor) {
			errors.push(`Plugin major version ${pluginMajor} is incompatible with system major version ${systemMajor}`);
			return;
		}

		// 4. Plugin cannot require a higher minor version than system provides
		if (pluginMinor > systemMinor) {
			errors.push(
				`Plugin requires minor version ${pluginMajor}.${pluginMinor}.x, but system is ${this._systemVersion}`,
			);
			return;
		}
	}

	validatePlatform(metadata: PluginMetadata, currentPlatform: PlatformEnvironmentKey): boolean {
		if (!metadata.platform || !Array.isArray(metadata.platform) || metadata.platform.length === 0) {
			return true;
		}
		return metadata.platform.includes(currentPlatform);
	}
}

export const pluginValidator = new PluginValidator();
