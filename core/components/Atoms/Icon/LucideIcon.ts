import * as Lucide from "lucide-react";

function toCamelCase(str: string) {
	const parts = str.split("-");
	const camelCaseParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));
	return camelCaseParts.join("");
}

export default (code: string): Lucide.LucideIcon => Lucide[toCamelCase(code)];
