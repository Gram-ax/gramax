import type { GesErrorCode } from "@ext/enterprise/errors/GesError";
import t from "@ext/localization/locale/translate";

export const getGesErrorTitle = (code: GesErrorCode): string => {
	switch (code) {
		case "offline":
		case "unavailable":
			return t("enterprise.admin.errors.causes.offline");
		default:
			return t("enterprise.admin.errors.causes.unknown");
	}
};

export const getGesErrorBadgeText = (code: GesErrorCode): string => {
	switch (code) {
		case "offline":
		case "unavailable":
			return t("enterprise.admin.errors.no-connection");
		default:
			return t("enterprise.admin.errors.causes.unknown");
	}
};

export const getGesErrorDescription = (code: GesErrorCode, url: string): string => {
	switch (code) {
		case "offline":
		case "unavailable":
			return t("enterprise.admin.errors.descriptions.offline").replace("{url}", url);
		default:
			return t("enterprise.admin.errors.descriptions.unknown");
	}
};

export const getTabErrorText = (code: GesErrorCode, url: string): string =>
	`${t("enterprise.admin.errors.loading-settings")}. ${getGesErrorDescription(code, url)}`;

export const getSaveErrorText = (code: GesErrorCode, url: string): string =>
	`${t("enterprise.admin.errors.save-error")}. ${getGesErrorDescription(code, url)}`;
