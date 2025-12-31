import UiLanguage from "@ext/localization/core/model/Language";
import { PluginRegistry } from "./PluginRegistry";

export class PluginLocaleRegistry extends PluginRegistry<string, Record<string, Record<string, string>>> {
	registerLocale(pluginId: string, locale: Record<string, Record<string, string>>): void {
		this.data.set(pluginId, locale);
	}

	getTranslation(language: UiLanguage, key: string): string | null {
		for (const locale of this.data.values()) {
			if (locale[language]?.[key]) {
				return locale[language][key];
			}
		}
		return null;
	}

	getPluginLocale(pluginId: string): Record<string, Record<string, string>> | undefined {
		return this.data.get(pluginId);
	}
	remove(pluginId: string): void {
		this.data.delete(pluginId);
	}
}
