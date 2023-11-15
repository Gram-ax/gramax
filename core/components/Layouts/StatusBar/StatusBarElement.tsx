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
				className,
			}: {
				onClick?: () => void;
				iconCode?: string;
				children?: JSX.Element;
				tooltipText?: ReactNode;
				className?: string;
			},
			ref: React.LegacyRef<HTMLDivElement>,
		) => {
			return (
				<div ref={ref} className={className} onClick={onClick}>
					<Tooltip content={tooltipText}>
						<div className="status-bar-element">
							{iconCode && (
								<div className="status-bar-icon">
									<Icon code={iconCode} faFw />
								</div>
							)}
							{children && (
								<div className="status-bar-text">
									<div className="content">{children}</div>
								</div>
							)}
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
		gap: 7px;
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
