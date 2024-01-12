import styled from "@emotion/styled";
import { HTMLAttributes, MutableRefObject, ReactNode, forwardRef } from "react";
import { ButtonStyle } from "./ButtonStyle";
import BaseButton from "./Styles/Base";
import Blue from "./Styles/Blue";
import Orange from "./Styles/Orange";
import Purple from "./Styles/Purple";
import Transparent from "./Styles/Transparent";

const Buttons: {
	[buttonStyle in ButtonStyle]: (props: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) => ReactNode;
} = {
	blue: Blue,
	orange: Orange,
	purple: Purple,
	transparent: Transparent,
	default: (props) => <BaseButton {...props} useDefaultStyle />,
};

const Button = styled(
	forwardRef(
		(
			{
				buttonStyle = ButtonStyle.default,
				className,
				...props
			}: {
				children: ReactNode;
				buttonStyle?: ButtonStyle;
				disabled?: boolean;
				fullWidth?: boolean;
				className?: string;
			} & HTMLAttributes<HTMLDivElement>,
			ref?: MutableRefObject<HTMLDivElement>,
		) => {
			const ButtonElement = Buttons[buttonStyle];
			return (
				<div data-qa="qa-clickable" className={className} ref={ref}>
					<ButtonElement {...props} />
				</div>
			);
		},
	),
)`
	${(p) => (p.disabled ? `pointer-events: none; opacity: 0.4;` : ``)}
`;

export default Button;
