import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import type { CatalogLogo } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import { cn } from "@core-ui/utils/cn";
import { CardVisualBadge } from "@ui-kit/Card";
import { Icon } from "@ui-kit/Icon";
import type { HTMLAttributes } from "react";

interface CardLogoProps extends HTMLAttributes<HTMLDivElement> {
	logo: CatalogLogo;
}

const resolveCardLogoElement = (logo: CatalogLogo) => {
	if (!logo) return null;

	if ("iconCode" in logo && logo?.iconCode) {
		return (
			<Icon
				className="h-full w-full ml-0.5 mt-0.5"
				color={logo?.iconColor ? `var(--color-icon-${logo?.iconColor})` : undefined}
				icon={logo?.iconCode as IconCode}
			/>
		);
	}

	if ("emoji" in logo && logo?.emoji) {
		return (
			<span className="flex items-center justify-center h-full w-full text-5xl leading-none">{logo.emoji}</span>
		);
	}

	if ("src" in logo && logo?.src) {
		return (
			<div
				style={{
					backgroundImage: `url(${logo.src})`,
					height: "100%",
					width: "100%",
					backgroundSize: "contain",
					backgroundPosition: "center center",
					backgroundRepeat: "no-repeat",
					marginLeft: "2px",
					marginTop: "2px",
				}}
			/>
		);
	}

	return null;
};

export const CardLogo = ({ logo, className, ...props }: CardLogoProps) => {
	const logoElement = resolveCardLogoElement(logo);
	if (!logoElement) return null;
	return (
		<CardVisualBadge className={cn("-bottom-0.5 -right-0.5", className)} {...props}>
			{logoElement}
		</CardVisualBadge>
	);
};
