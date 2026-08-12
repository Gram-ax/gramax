import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import type { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";

const ICON_PREFIX = "icon:";
const EMOJI_PREFIX = "emoji:";

export const isLogoIcon = (logo: string): boolean => Boolean(logo?.startsWith(ICON_PREFIX));

export const isLogoEmoji = (logo: string): boolean => Boolean(logo?.startsWith(EMOJI_PREFIX));

export const makeLogoIcon = (code: string, color?: string): string =>
	color ? `${ICON_PREFIX}${code}:${color}` : `${ICON_PREFIX}${code}`;

export const makeLogoEmoji = (emoji: string): string => `${EMOJI_PREFIX}${emoji}`;

export const getLogoEmoji = (logo: string): string => logo.slice(EMOJI_PREFIX.length);

export const parseLogoIcon = (logo: string): { code: IconCode; color?: HIGHLIGHT_COLOR_NAMES } => {
	const raw = logo.slice(ICON_PREFIX.length);
	const colonIdx = raw.indexOf(":");
	if (colonIdx === -1) return { code: raw as IconCode };
	return { code: raw.slice(0, colonIdx) as IconCode, color: raw.slice(colonIdx + 1) as HIGHLIGHT_COLOR_NAMES };
};

export const getLogoIconCode = (logo: string): string => parseLogoIcon(logo).code;

export const getLogoIconColor = (logo: string): string => parseLogoIcon(logo).color;
