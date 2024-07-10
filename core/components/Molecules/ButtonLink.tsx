import Button, { ButtonProps, TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { MutableRefObject, ReactNode, forwardRef } from "react";

export interface ButtonLinkProps extends Omit<ButtonProps, "children" | "style"> {
	iconCode?: string;
	text?: string;
	fullWidth?: boolean;
	maxLength?: number;
	iconViewBox?: string;
	rightActions?: ReactNode[];
}

const ButtonLink = forwardRef((props: ButtonLinkProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const {
		textSize = TextSize.XS,
		iconCode,
		fullWidth = false,
		onClick,
		iconViewBox,
		text,
		maxLength,
		rightActions,
		className,
		...otherProps
	} = props;

	return (
		<div ref={ref} onClick={onClick} className={classNames(className, { fullWidth })}>
			<Button buttonStyle={ButtonStyle.transparent} textSize={textSize} {...otherProps}>
				{iconCode && <Icon className="button_icon" code={iconCode} viewBox={iconViewBox} />}
				{text && (
					<span>
						{maxLength ? (text.length > maxLength ? text.slice(0, maxLength) + "..." : text) : text}
					</span>
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

	.button_icon {
		width: 1.25em;
		text-align: center;
	}

	.right-actions {
		flex: 1;
		display: flex;
		justify-content: flex-end;
		padding-left: var(--distance-i-span);
	}
`;
