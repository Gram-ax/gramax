import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import HotKey from "@components/GetHotKey";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { NodeValues } from "@core-ui/ContextServices/ButtonStateService/hooks/types";
import styled from "@emotion/styled";
import { ButtonHTMLAttributes, CSSProperties } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	isActive?: boolean;
	dataQa?: string;
	tooltipText?: string;
	hotKey?: string;
	nodeValues?: NodeValues;
	icon?: string;
	iconStyle?: CSSProperties;
	onMouseLeave?: () => void;
	useSvgDefaultWidth?: boolean;
	onClick?: () => void;
	text?: string;
}

const Button = (props: ButtonProps) => {
	const {
		className,
		children,
		iconStyle = { fontWeight: 300 },
		onClick,
		onMouseLeave,
		dataQa,
		disabled: propsDisabled = false,
		icon,
		nodeValues,
		tooltipText,
		hotKey,
		text,
	} = props;

	const { disabled, isActive } = nodeValues
		? ButtonStateService.useCurrentAction(nodeValues)
		: { disabled: propsDisabled, isActive: false };

	const ButtonContent = (
		<div
			onMouseLeave={onMouseLeave}
			onClick={onClick}
			className={"button" + (disabled ? " disabled " : "") + (isActive ? " is-active" : "")}
		>
			{icon ? (
				<div className="iconFrame">
					<Icon faFw code={icon} prefix={icon == "markdown" ? "fab" : null} style={iconStyle} />
					{text && <span>{text}</span>}
				</div>
			) : (
				children
			)}
		</div>
	);

	const ButtonWithTooltip = (
		<Tooltip content={<ButtonTooltipContent tooltipText={tooltipText} hotKey={hotKey} />}>{ButtonContent}</Tooltip>
	);

	return (
		<div className={className} data-qa={`editor-button-${dataQa || icon}`}>
			{tooltipText ? ButtonWithTooltip : ButtonContent}
		</div>
	);
};

const ButtonTooltipContent = styled((props: { tooltipText?: string; hotKey?: string; className?: string }) => {
	const { tooltipText, hotKey, className } = props;

	return (
		<div className={className}>
			{tooltipText}
			{hotKey && <HotKey hotKey={hotKey} />}
		</div>
	);
})`
	gap: 8px;
	display: flex;
	align-items: center;

	span.cmd {
		border-radius: 2px;
		color: var(--color-article-text);
		background: var(--color-article-bg) !important;
	}
`;

export default styled(Button)`
	.iconFrame {
		padding: 5px 5.5px;
		line-height: 16px;
	}

	.button {
		cursor: pointer;
		font-size: 12px;
		border-radius: var(--radius-block);
	}

	.button:hover,
	.button.is-active {
		background: var(--color-edit-menu-button-active-bg);
		transition: background-color 100ms;
	}

	.button.disabled {
		pointer-events: none !important;
		opacity: 0.4 !important;
	}

	.button {
		svg {
			${(p) => (p.useSvgDefaultWidth === false ? "" : "width: 1.25em;")}
		}
	}

	i.fa-fw {
		margin-left: 0 !important;
	}
`;
