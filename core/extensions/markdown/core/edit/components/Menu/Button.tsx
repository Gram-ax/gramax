import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import HotKey from "@components/GetHotKey";
import { classNames } from "@components/libs/classNames";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { NodeValues } from "@core-ui/ContextServices/ButtonStateService/hooks/types";
import styled from "@emotion/styled";
import { ForwardedRef, HTMLAttributes, forwardRef, CSSProperties } from "react";

export interface ButtonProps extends HTMLAttributes<HTMLDivElement> {
	isActive?: boolean;
	tooltipText?: string;
	disabled?: boolean;
	hotKey?: string;
	title?: string;
	nodeValues?: NodeValues;
	icon?: string;
	iconStyle?: CSSProperties;
	iconStrokeWidth?: string;
	iconViewBox?: string;
	dataQa?: string;
	onMouseLeave?: () => void;
	useSvgDefaultWidth?: boolean;
	text?: string;
}

const Button = forwardRef((props: ButtonProps, ref: ForwardedRef<HTMLDivElement>) => {
	const { iconStyle = { fontWeight: 300 }, iconViewBox, iconStrokeWidth, icon, ...propsWithoutIcon } = props;

	const {
		isActive: propsIsActive = false,
		disabled: propsDisabled = false,
		onMouseLeave,
		onClick,
		tooltipText,
		nodeValues,
		dataQa,
		children,
		hotKey,
		text,
		...otherProps
	} = propsWithoutIcon;

	const { disabled, isActive } = nodeValues
		? ButtonStateService.useCurrentAction(nodeValues)
		: { disabled: propsDisabled, isActive: propsIsActive };

	const mods = {
		disabled: disabled,
		"is-active": isActive,
	};

	const ButtonContent = (
		<div onMouseLeave={onMouseLeave} onClick={disabled ? null : onClick} className={classNames("button", mods)}>
			{icon ? (
				<div className="iconFrame">
					<Icon viewBox={iconViewBox} code={icon} style={iconStyle} strokeWidth={iconStrokeWidth} />
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
		<div data-qa="qa-edit-menu-button">
			<StyledDiv ref={ref} data-qa={dataQa} {...otherProps}>
				{tooltipText ? ButtonWithTooltip : ButtonContent}
			</StyledDiv>
		</div>
	);
});

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
		border-radius: var(--radius-x-small);
		color: var(--color-article-text);
		background: var(--color-article-bg) !important;
	}
`;

const StyledDiv = styled.div<ButtonProps>`
	.iconFrame {
		display: flex;
		align-items: center;
		line-height: 100%;
		padding: 6.5px 7px;

		i {
			font-size: 12.5px;
		}
	}

	.button {
		cursor: pointer;
		font-size: 12px;
		border-radius: var(--radius-small);
	}

	.button:hover:not(.disabled),
	.button.is-active {
		background: var(--color-edit-menu-button-active-bg);
	}

	.button.disabled {
		cursor: default;
		opacity: 0.4 !important;
	}

	i.fa-fw {
		margin-left: 0 !important;
	}
`;

export default Button;
