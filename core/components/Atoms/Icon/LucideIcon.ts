import customIcons, { type CustomIcon } from "@components/Atoms/Icon/customIcons";
import preloadedIcons from "@components/Atoms/Icon/preloadedIcons";
import lucideIcons, { useLucideModule } from "@dynamicImports/lucide-icons";
import type { LucideIcon as LucideIconType } from "lucide-react";

const toCamelCase = (str: string) => {
	const parts = str.split("-");
	const camelCaseParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));
	return camelCaseParts.join("");
};

const isValidIconCode = (code: string): boolean => {
	return !(!code || code === "icon");
};

const getLoadedIcon = (code: string): LucideIconType | CustomIcon => {
	if (customIcons[code]) return customIcons[code];
	if (preloadedIcons[code]) return preloadedIcons[code];
};

const LucideIconComponent = <T = NonNullable<unknown>>(code: string): LucideIconType | CustomIcon<T> => {
	if (!isValidIconCode(code)) return null;
	const loadedIcon = getLoadedIcon(code);
	if (loadedIcon) return loadedIcon;
	const icons = useLucideModule();
	return icons ? icons[toCamelCase(code)] : null;
};

export const LucideIcon = async (code: string) => {
	if (!isValidIconCode(code)) return null;
	const loadedIcon = getLoadedIcon(code);
	if (loadedIcon) return loadedIcon;
	const icons = await lucideIcons();
	return icons[toCamelCase(code)];
};

export default LucideIconComponent;
