import validateEmail from "@core/utils/validateEmail";
import t from "@ext/localization/locale/translate";
import { Icon } from "@ui-kit/Icon";
import { TextOverflowTooltip, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";

type InvalidEmailCellProps = {
	value: string;
	maxWidthClassName?: string;
};

export const InvalidEmailCell = ({ value, maxWidthClassName = "max-w-[260px]" }: InvalidEmailCellProps) => {
	const trimmed = value.trim();
	const hasEdgeWhitespace = trimmed.length !== value.length;
	const isValidEmail = !!validateEmail(trimmed);
	const isInvalid = hasEdgeWhitespace || !isValidEmail;
	const errorText = hasEdgeWhitespace
		? t("enterprise-guest.validationErrors.edgeWhitespace")
		: t("enterprise-guest.validationErrors.emailInvalidFormat");

	if (!isInvalid) {
		return <TextOverflowTooltip className={maxWidthClassName}>{value}</TextOverflowTooltip>;
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-flex items-center gap-2 text-destructive">
						<TextOverflowTooltip className={maxWidthClassName}>{value}</TextOverflowTooltip>
						<Icon icon="alert-triangle" className="shrink-0 h-4 w-4" />
					</span>
				</TooltipTrigger>
				<TooltipContent>{errorText}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
