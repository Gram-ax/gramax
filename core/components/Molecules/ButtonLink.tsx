import Button, { ButtonProps, TextKeys, TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { CSSProperties, forwardRef, MutableRefObject, ReactNode } from "react";
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
		onMouseEnter,
		onMouseLeave,
		...otherProps
	} = props;

	return (
		<div
			className={classNames(className, { fullWidth }, ["buttonLink"])}
			data-qa={dataQa}
			onClick={disabled ? null : onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			ref={ref}
		>
			<Button buttonStyle={ButtonStyle.transparent} disabled={disabled} textSize={textSize} {...otherProps}>
				{iconCode && (
					<Icon
						code={iconCode}
						fw={iconFw}
						isLoading={iconIsLoading}
						style={{ fontSize: unionFontSize ? TextKeys[textSize] + "rem" : undefined, ...iconStyle }}
						tooltipContent={iconContent}
						tooltipPlace={iconPlace}
						viewBox={iconViewBox}
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
