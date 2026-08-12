import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { svgToBase64 } from "@core/utils/CustomLogoDriver";
import { cn } from "@core-ui/utils/cn";
import { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import { Icon as UiKitIcon } from "@ui-kit/Icon";

interface IconProps {
	code: string;
	svg?: string;
	color?: string;
	className?: string;
}

const Icon = ({ code, svg, color, className }: IconProps) => {
	const newColor = color
		? HIGHLIGHT_COLOR_NAMES?.[color?.toUpperCase()]
			? `var(--color-icon-${color})`
			: color
		: undefined;
	if (!svg)
		return (
			<UiKitIcon
				className={cn("inline-block align-middle leading-none w-[1em] h-[1em]", className)}
				color={newColor}
				icon={code as IconCode}
			/>
		);

	return (
		<i className={cn("inline-block align-middle leading-none", className)} style={{ color: newColor }}>
			<svg className="w-[1em] h-[1em]">
				<image href={svgToBase64(svg)} style={{ width: "1em", height: "1em" }} />
			</svg>
		</i>
	);
};

export default Icon;
