import Button, { ButtonProps, TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { MutableRefObject, forwardRef } from "react";

export interface ButtonLinkProps extends Omit<ButtonProps, "children" | "style"> {
	iconCode?: string;
	text?: string;
	fullWidth?: boolean;
	iconViewBox?: string;
}

const ButtonLink = forwardRef((props: ButtonLinkProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const {
		textSize = TextSize.XS,
		iconCode,
		fullWidth = false,
		onClick,
		iconViewBox,
		text,
		className,
		disabled,
		...otherProps
	} = props;

	return (
		<div ref={ref} onClick={onClick} className={classNames(className, { fullWidth })}>
			<Button disabled={disabled} buttonStyle={ButtonStyle.transparent} textSize={textSize} {...otherProps}>
				{iconCode && <Icon className="button_icon" code={iconCode} viewBox={iconViewBox} />}
				{text && <span>{text}</span>}
			</Button>
		</div>
	);
});

export default styled(ButtonLink)`
	width: fit-content;

	&.fullWidth {
		width: 100%;
	}

	.button_icon {
		width: 1.25em;
		text-align: center;
	}
`;
