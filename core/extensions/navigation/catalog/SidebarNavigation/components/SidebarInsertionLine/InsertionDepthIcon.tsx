import { cn } from "@core-ui/utils/cn";
import { Icon } from "@ui-kit/Icon";

interface InsertionDepthIconProps {
	isHidden: boolean;
	isPlaceholder: boolean;
	isActive: boolean;
	style?: React.CSSProperties;
	onClick?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
}

export const InsertionDepthIcon = ({
	isHidden,
	isPlaceholder,
	isActive,
	style,
	onClick,
	onMouseEnter,
	onMouseLeave,
}: InsertionDepthIconProps) => {
	return (
		<div
			className="absolute top-1/2 h-3 w-3 -translate-y-1/2"
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			style={style}
		>
			<Icon
				className={cn(
					"absolute text-muted transition-opacity duration-[160ms]",
					isHidden || isActive ? "opacity-0" : "opacity-100",
					isPlaceholder && "text-primary-border",
				)}
				icon="circle-fading-plus"
				size="sm"
			/>
			<Icon
				className={cn(
					"absolute text-primary-fg transition-opacity duration-[160ms]",
					isActive ? "opacity-100" : "opacity-0",
				)}
				icon="circle-plus"
				size="sm"
			/>
		</div>
	);
};
