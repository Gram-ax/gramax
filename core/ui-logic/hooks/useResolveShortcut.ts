import IsMac from "@core-ui/ContextServices/IsMac";
import { useMemo } from "react";

const resolveKey = (key: string, isMac: boolean): string => {
	const keyComponents = {
		Mod: isMac ? "⌘" : "Ctrl",
		Alt: isMac ? "⌥" : "Alt",
		Shift: "⇧",
		ArrowUp: "↑",
		ArrowDown: "↓",
		Enter: "↵",
	};
	return keyComponents[key] ?? key;
};

export const useResolveShortcut = (keys: string) => {
	const isMac = IsMac.value;
	return useMemo(
		() =>
			keys
				.split("-")
				.map((key) => resolveKey(key, isMac))
				.join(isMac ? "" : "+"),
		[keys, isMac],
	);
};
