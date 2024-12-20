import Button, { ButtonProps, TextSize, TextKeys } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { CSSProperties, MutableRefObject, ReactNode, forwardRef } from "react";
import { Placement } from "tippy.js";

export interface ButtonLinkProps extends Omit<ButtonProps, "children"> {
	iconCode?: string;
	text?: ReactNode;
	fullWidth?: boolean;
	iconFw?: boolean;
	iconViewBox?: string;
	iconIsLoading?: boolean;
	rightActions?: ReactNode[];
	iconContent?: ReactNode;
	iconPlace?: Placement;
	unionFontSize?: boolean;
	dataQa?: string;
	iconStyle?: CSSProperties;
}

const ButtonLink = forwardRef((props: ButtonLinkProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const {
		textSize = TextSize.XS,
		iconCode,
		fullWidth = false,
		onClick,
		iconFw = true,
		iconViewBox,
		iconIsLoading,
		text,
		rightActions,
		className,
		unionFontSize,
		iconContent,
		iconPlace,
		disabled,
		dataQa,
		iconStyle,
		...otherProps
	} = props;

	return (
		<div
			data-qa={dataQa}
			ref={ref}
			onClick={disabled ? null : onClick}
			className={classNames(className, { fullWidth })}
		>
			<Button disabled={disabled} buttonStyle={ButtonStyle.transparent} textSize={textSize} {...otherProps}>
				{iconCode && (
					<Icon
						style={{ ...iconStyle, fontSize: unionFontSize ? TextKeys[textSize] + "rem" : undefined }}
						fw={iconFw}
						code={iconCode}
						viewBox={iconViewBox}
						isLoading={iconIsLoading}
						tooltipContent={iconContent}
						tooltipPlace={iconPlace}
					/>
				)}
				{text && (
					<span style={{ fontSize: unionFontSize ? TextKeys[textSize] + "rem" : undefined }}>{text}</span>
				)}
				{rightActions && <div className="right-actions">{rightActions}</div>}
			</Button>
		</div>
	);
});

export default styled(ButtonLink)`
	width: fit-content;

	&.fullWidth,
	&.fullWidth > div,
	&.fullWidth > div > div {
		width: 100%;
	}

	.right-actions {
		flex: 1;
		display: flex;
		justify-content: flex-end;
		padding-left: var(--distance-i-span);
	}
`;
