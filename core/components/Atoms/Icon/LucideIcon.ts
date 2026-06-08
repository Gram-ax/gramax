import customIcons, { type CustomIcon } from "@components/Atoms/Icon/customIcons";
import preloadedIcons from "@components/Atoms/Icon/preloadedIcons";
import lucideIcons, { useLucideModule } from "@dynamicImports/lucide-icons";
import type { LucideIcon as LucideIconType } from "lucide-react";

export type { LucideIconType };

type CamelToKebab<S extends string> = S extends `${infer T}${infer U}`
	? U extends Uncapitalize<U>
		? `${Lowercase<T>}${CamelToKebab<U>}`
		: `${Lowercase<T>}-${CamelToKebab<U>}`
	: S;

type LucideModule = Awaited<ReturnType<typeof lucideIcons>>;
type RemoveIconSuffix<T> = T extends `${string}Icon` ? never : T extends `Lucide${string}` ? never : T;
type CleanIcons<T> = {
	[K in keyof T]: T[K] extends LucideIconType ? RemoveIconSuffix<K> : never;
}[keyof T];

type IconNames = CleanIcons<LucideModule>;
type KebabIconNames = CamelToKebab<IconNames>;

export type IconCode = keyof typeof customIcons | KebabIconNames;

const toCamelCase = (str: string) => {
	const parts = str.split("-");
	const camelCaseParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));
	return camelCaseParts.join("");
};

const isValidIconCode = (code: string | IconCode): boolean => {
	return !(!code || code === "icon");
};

const getLoadedIcon = (code: IconCode): LucideIconType | CustomIcon => {
	if (customIcons[code]) return customIcons[code];
	if (preloadedIcons[code]) return preloadedIcons[code];
};

const LucideIconComponent = <T = NonNullable<unknown>>(code: IconCode | string): LucideIconType | CustomIcon<T> => {
	if (!isValidIconCode(code)) return null;
	const loadedIcon = getLoadedIcon(code as IconCode);
	if (loadedIcon) return loadedIcon;
	const icons = useLucideModule();
	return icons ? icons[toCamelCase(code as string)] : null;
};

export const LucideIcon = async (code: IconCode) => {
	if (!isValidIconCode(code)) return null;
	const loadedIcon = getLoadedIcon(code);
	if (loadedIcon) return loadedIcon;
	const icons = await lucideIcons();
	return icons[toCamelCase(code as string)];
};

export default LucideIconComponent;
