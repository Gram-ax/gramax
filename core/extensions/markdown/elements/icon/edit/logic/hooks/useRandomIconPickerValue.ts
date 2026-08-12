import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { useBaseLucideIconList } from "@components/Atoms/Icon/lucideIconList";
import { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import type {
	IconPickerColor,
	IconPickerDisableOption,
	OnChangeCallback,
} from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { emojis } from "@ext/markdown/elements/icon/edit/data/buildEmojiData";
import { useCallback } from "react";

const COLOR_VALUES = Object.values(HIGHLIGHT_COLOR_NAMES) as IconPickerColor[];

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const useRandomIconPickerValue = (onChange: OnChangeCallback, disable?: IconPickerDisableOption) => {
	const iconList = useBaseLucideIconList();

	return useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();

			const canUseIcons = !disable?.includes("icons") && iconList.length > 0;
			const canUseEmoji = !disable?.includes("emoji") && emojis.length > 0;

			const useIcon = canUseIcons && (!canUseEmoji || Math.random() < 0.5);
			if (useIcon) {
				const icon = pickRandom(iconList);
				if (disable?.includes("color")) {
					onChange({ code: icon.value as IconCode });
				} else {
					const color = pickRandom(COLOR_VALUES);
					onChange({ code: icon.value as IconCode, color });
				}
			} else if (canUseEmoji) {
				const emoji = pickRandom(emojis);
				onChange({ emoji: emoji.emoji });
			}
		},
		[iconList, onChange, disable],
	);
};
