import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import React, { type CSSProperties, type ReactNode } from "react";
import Icon from "../../Atoms/Icon";

const StatusBarElement = styled(
	React.forwardRef(
		(
			{
				onClick,
				iconCode,
				iconStyle,
				iconStrokeWidth,
				children,
				tooltipText,
				iconClassName,
				disable = false,
				tooltipArrow = true,
				showTooltip,
				className,
			}: {
				onClick?: () => void;
				iconCode?: string;
				iconStyle?: CSSProperties;
				iconStrokeWidth?: string;
				children?: JSX.Element;
				tooltipText?: ReactNode;
				disable?: boolean;
				iconClassName?: string;
				tooltipArrow?: boolean;
				showTooltip?: boolean;
				reverse?: boolean;
				className?: string;
				changeBackgroundOnHover?: boolean;
			},
			ref: React.LegacyRef<HTMLDivElement>,
		) => {
			const statusBarElement = (
				<div className="status-bar-element" style={disable ? { pointerEvents: "none" } : null}>
					{iconCode && (
						<div className={cn("status-bar-icon", iconClassName)}>
							<Icon code={iconCode} strokeWidth={iconStrokeWidth} style={iconStyle} />
						</div>
					)}
					{children && (
						<div className="status-bar-text">
							<div className="content">{children}</div>
						</div>
					)}
				</div>
			);

			return (
				<div className={className} onClick={disable ? undefined : onClick} ref={ref}>
					<div style={{ height: "100%" }}>
						{tooltipText && (
							<Tooltip open={showTooltip}>
								<TooltipTrigger asChild>{statusBarElement}</TooltipTrigger>
								<TooltipContent side={tooltipArrow ? "bottom" : undefined}>
									{tooltipText}
								</TooltipContent>
							</Tooltip>
						)}
						{!tooltipText && statusBarElement}
					</div>
				</div>
			);
		},
	),
)`
	width: fit-content;
	height: 100%;

	&,
	.status-bar-text,
	.status-bar-text .content {
		overflow: hidden;
		max-width: 100%;
	}

	.status-bar-text .content {
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.status-bar-element {
		display: flex;
		${(p) => (p.reverse ? "flex-direction: row-reverse;" : "")}
		gap: 0.15rem;
		height: 100%;
		padding: 0 4px;
		cursor: pointer;

		font-weight: 300;
		color: white;
		font-size: 12px;

		a {
			color: white;
		}

		${(p) =>
			p.changeBackgroundOnHover !== false &&
			`:hover {
			background: rgba(255, 255, 255, 0.2);
		}`}
	}

	.status-bar-icon,
	.status-bar-text {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.status-bar-icon {
		font-size: 11px;
	}
`;

export default StatusBarElement;
