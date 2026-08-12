import { env } from "@app/resolveModule/env";
import type { CompressRule } from "@core/FileProvider/model/CompressOptions";
import { resolveDefaultLanguage } from "@ext/localization/core/model/Language";
import { Level as OtelLogLevel } from "@ext/loggers/opentelemetry/span";
import { UpdateCheckFrequency } from "@ext/settings/logic/updateCheckPolicy";
import { resolveDefaultTheme } from "@ext/Theme/Theme";
import { Level, setting, Target } from "../logic/settings";

const APP_OR_WORKSPACE = Level.app | Level.workspace;
const ALL_LEVELS = Level.app | Level.workspace | Level.catalog;

export const AppSettings = {
	general: {
		language: setting({
			target: Target.all,
			default: resolveDefaultLanguage(),
			availableAt: APP_OR_WORKSPACE,
			clientOverridable: true,
		}),
		theme: setting({
			target: Target.all,
			default: resolveDefaultTheme(),
			availableAt: APP_OR_WORKSPACE,
			clientOverridable: true,
		}),
	},
	services: {
		"git-proxy": {
			endpoint: setting({
				target: Target.web,
				default: "https://gram.ax/git-proxy/",
				availableAt: APP_OR_WORKSPACE,
			}),
		},
		auth: {
			endpoint: setting({
				target: Target.all,
				default: "https://gram.ax/auth/",
				availableAt: APP_OR_WORKSPACE,
			}),
		},
		"diagram-renderer": {
			endpoint: setting({
				target: Target.all,
				default: "https://gram.ax/diagram-renderer/",
				availableAt: APP_OR_WORKSPACE,
			}),
		},
		"web-editor": {
			endpoint: setting({
				target: Target.desktop,
				default: "https://app.gram.ax",
				availableAt: APP_OR_WORKSPACE,
			}),
		},
		// AI server is configured per workspace only — `availableAt` restricts
		// writes, so the app level still carries the docportal's env-provided
		// values (see SettingsResolver.envToSettings) as a read-only fallback.
		ai: {
			enabled: setting({
				target: Target.all,
				default: false,
				availableAt: Level.workspace,
			}),
			endpoint: setting<string>({
				target: Target.all,
				availableAt: Level.workspace,
			}),
			token: setting<string>({
				target: Target.all,
				availableAt: Level.workspace,
			}),
		},
	},
	enterprise: {
		endpoint: setting<string>({
			target: Target.all,
			availableAt: APP_OR_WORKSPACE,
		}),
		"refresh-interval": setting({
			target: Target.all,
			default: 1800,
			availableAt: APP_OR_WORKSPACE,
		}),
	},
	updates: {
		"check-frequency": setting<UpdateCheckFrequency>({
			target: Target.desktop,
			default: UpdateCheckFrequency.EveryLaunch,
			availableAt: Level.app,
		}),
	},
	"compress-images": {
		// The single user-facing switch. `rules` is the per-format detalization
		// behind the `compress-images` feature flag; without it the optimal
		// preset (everything to JPEG) applies.
		enabled: setting({
			target: Target.all,
			default: true,
			availableAt: ALL_LEVELS,
		}),
		rules: setting<CompressRule[]>({
			target: Target.all,
			default: [],
			availableAt: ALL_LEVELS,
		}),
	},
	logging: {
		level: setting<OtelLogLevel>({
			target: Target.web | Target.desktop,
			default: env("BRANCH") === "develop" ? OtelLogLevel.Internal : OtelLogLevel.Important,
			availableAt: Level.app,
		}),
		console: setting({
			target: Target.web | Target.desktop,
			default: false,
			availableAt: Level.app,
		}),
	},
	contentCompare: {
		sensitivity: setting<"word" | "character" | "hybrid">({
			target: Target.all,
			default: "word",
			availableAt: Level.app,
			clientOverridable: true,
		}),
		minSimilarity: setting<number>({
			target: Target.all,
			default: 0.3,
			availableAt: Level.app,
			clientOverridable: true,
		}),
		debounce: setting<number>({
			target: Target.all,
			default: 300,
			availableAt: Level.app,
			clientOverridable: true,
		}),
		minMatchLength: setting<number>({
			target: Target.all,
			default: 3,
			availableAt: Level.app,
			clientOverridable: true,
		}),
	},
};
