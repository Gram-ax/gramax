import customIcons, { CustomIcon } from "@components/Atoms/Icon/customIcons";
import * as Lucide from "lucide-react";

const toCamelCase = (str: string) => {
	const parts = str.split("-");
	const camelCaseParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));
	return camelCaseParts.join("");
};

const LucideIcon = <T = NonNullable<unknown>>(code: string): Lucide.LucideIcon | CustomIcon<T> => {
	if (!code || code === "icon") return null;
	if (customIcons[code]) return customIcons[code];
	return Lucide[toCamelCase(code)];
};

export default LucideIcon;
