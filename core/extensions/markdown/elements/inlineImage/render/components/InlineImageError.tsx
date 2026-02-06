import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { LfsPointerError, type ResourceError } from "@ext/markdown/elements/copyArticles/errors";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

export interface InlineImageErrorProps {
	width: string;
	height: string;
	resourceError?: ResourceError;
}

const Wrapper = styled.div<{
	width: string;
	height: string;
	color: string;
	borderColor: string;
	backgroundColor: string;
}>`
	display: flex;
	align-items: center;
	justify-content: center;

	cursor: default;

	border: 1px solid ${({ borderColor }) => borderColor};
	border-radius: var(--radius-small);
	background-color: ${({ backgroundColor }) => backgroundColor};

	width: ${({ width }) => width};
	height: ${({ height }) => height};

	svg {
		color: ${({ color }) => color};
		stroke-width: 1.25;
	}
`;

const getErrorData = (resourceError: ResourceError) => {
	if (resourceError instanceof LfsPointerError) {
		return {
			icon: "cloud-alert",
			tooltip: t("git.lfs.file-is-pointer"),

			color: "hsl(var(--secondary-fg))",
			borderColor: "hsl(var(--primary-border))",
			backgroundColor: "hsl(var(--primary-bg))",
		};
	}

	return {
		icon: "image-off",
		tooltip: t("alert.image.unavailable"),
		color: "hsl(var(--secondary-fg))",
		borderColor: "hsl(var(--status-error-border))",
		backgroundColor: "hsl(var(--status-error-bg))",
	};
};

const InlineImageError = ({ width, height, resourceError }: InlineImageErrorProps) => {
	const { icon, tooltip, color, borderColor, backgroundColor } = getErrorData(resourceError);

	return (
		<Tooltip>
			<TooltipTrigger>
				<Wrapper
					backgroundColor={backgroundColor}
					borderColor={borderColor}
					color={color}
					data-focusable="true"
					height={height}
					width={width}
				>
					<Icon icon={icon} size="lg" />
				</Wrapper>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
};

export default InlineImageError;
