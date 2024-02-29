import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon, { IconPrefixes } from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import { forwardRef, MutableRefObject } from "react";

export interface ButtonLinkProps {
	iconCode: string;
	iconPrefix?: IconPrefixes;
	onClick?: (event?: React.MouseEvent<HTMLElement>) => any;
	className?: string;
	textSize?: TextSize;
	text?: string;
}

const ButtonLink = forwardRef((props: ButtonLinkProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const { textSize = TextSize.XS, iconCode, iconPrefix, text, className, onClick } = props;

	return (
		<div ref={ref} className={className}>
			<Button buttonStyle={ButtonStyle.transparent} textSize={textSize} onClick={onClick}>
				<Icon className="button_icon" prefix={iconPrefix} code={iconCode} />
				{text && <span>{text}</span>}
			</Button>
		</div>
	);
});

export default styled(ButtonLink)`
	.button_icon {
		width: 1.25em;
		vertical-align: center;
		text-align: center;
	}
`;
