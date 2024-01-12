import styled from "@emotion/styled";
import React, { ReactNode } from "react";
import Icon from "../../Atoms/Icon";
import Tooltip from "../../Atoms/Tooltip";

const StatusBarElement = styled(
	React.forwardRef(
		(
			{
				onClick,
				iconCode,
				children,
				tooltipText,
				iconClassName,
				disable = false,
				className,
			}: {
				onClick?: () => void;
				iconCode?: string;
				children?: JSX.Element;
				tooltipText?: ReactNode;
				disable?: boolean;
				iconClassName?: string;
				className?: string;
			},
			ref: React.LegacyRef<HTMLDivElement>,
		) => {
			return (
				<div
					ref={ref}
					className={className}
					onClick={() => {
						if (!disable) onClick?.();
					}}
				>
					<Tooltip content={tooltipText}>
						<div style={{ height: "100%" }}>
							<div className="status-bar-element" style={disable ? { pointerEvents: "none" } : null}>
								{iconCode && (
									<div className={"status-bar-icon" + (iconClassName ? " " + iconClassName : "")}>
										<Icon code={iconCode} faFw />
									</div>
								)}
								{children && (
									<div className="status-bar-text">
										<div className="content">{children}</div>
									</div>
								)}
							</div>
						</div>
					</Tooltip>
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
	}

	.status-bar-text .content {
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.status-bar-element {
		display: flex;
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

		:hover {
			background: rgba(255, 255, 255, 0.2);
		}
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
