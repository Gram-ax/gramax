import Icon from "@components/Atoms/Icon";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface VersionControlCommentCountProps {
	count: number;
	className?: string;
	tooltip?: boolean;
}

const VersionControlCommentCount = ({ count, className, tooltip = true }: VersionControlCommentCountProps) => {
	if (typeof count !== "number" || count <= 0) return null;

	const baseItem = (
		<div className={cn("relative inline-flex !w-auto justify-center ml-[var(--distance-i-span)]", className)}>
			<Icon
				code="message-square"
				style={{ color: "var(--color-text-accent)", fontSize: "1.2em" }}
				svgStyle={{ fill: "var(--color-text-accent)" }}
				viewBox="2 2 20 20"
			/>
			<div className="absolute text-[8px] font-bold leading-[13.5px] text-[var(--color-text-count)]">{count}</div>
		</div>
	);

	if (!tooltip) return baseItem;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{baseItem}</TooltipTrigger>
			<TooltipContent>
				<span>{t("numbero-of-unsolved-comments")}</span>
			</TooltipContent>
		</Tooltip>
	);
};

export default VersionControlCommentCount;
