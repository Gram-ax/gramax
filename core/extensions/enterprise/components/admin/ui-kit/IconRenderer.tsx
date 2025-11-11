import * as LucideIcons from "lucide-react";

interface IconRendererProps {
	iconName: string;
	className?: string;
	size?: number | string;
	color?: string;
}

export function IconRenderer({ iconName, className, size, color }: IconRendererProps) {
	const toPascalCase = (str: string): string => {
		return str
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join("");
	};

	const pascalCaseName = toPascalCase(iconName);

	const IconComponent = (LucideIcons as any)[pascalCaseName];

	if (!IconComponent) {
		return <div className={"w-5 h-5 "} />;
	}

	return <IconComponent className={className} size={size} color={color} />;
}
