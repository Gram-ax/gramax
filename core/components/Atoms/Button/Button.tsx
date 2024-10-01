import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { CSSProperties, MouseEvent, MutableRefObject, ReactNode, forwardRef } from "react";
import { ButtonStyle } from "./ButtonStyle";

export interface ButtonProps {
	buttonStyle?: ButtonStyle;
	style?: CSSProperties;
	onClick?: (event?: MouseEvent<HTMLElement>) => any;
	children?: ReactNode;
	disabled?: boolean;
	fullWidth?: boolean;
	textSize?: TextSize;
	className?: string;
	isEmUnits?: boolean;
	title?: string;
}

export enum TextSize {
	XXS = "text_xx_small",
	XS = "text_x_small",
	S = "text_small",
	M = "text_medium",
	L = "text_large",
	XL = "text_x_large",
}

const TextKeys = {
	text_xx_small: 0.6,
	text_x_small: 0.75,
	text_small: 0.875,
	text_medium: 1,
	text_large: 1.25,
	text_x_large: 1.5,
};

const Button = forwardRef((props: ButtonProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const {
		buttonStyle = ButtonStyle.default,
		textSize = TextSize.M,
		fullWidth = false,
		className,
		children,
		isEmUnits,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		disabled,
		...otherProps
	} = props;

	return (
		<div data-qa="qa-clickable" className={className} ref={ref}>
			<div
				style={{ fontSize: TextKeys[textSize] + (isEmUnits ? "em" : "rem") }}
				className={classNames(buttonStyle, { fullWidth }, ["content"])}
				{...otherProps}
			>
				{children}
			</div>
		</div>
	);
});

export default styled(Button)`
	${(p) => (p.disabled ? `pointer-events: none; opacity: 0.4;` : ``)}
	.fullWidth {
		width: 100% !important;
	}

	.content {
		width: fit-content;
		padding: ${(p) => (p.isEmUnits ? "0.33em" : "0.33rem")} ${(p) => (p.isEmUnits ? "0.88em" : "0.88rem")};
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		user-select: none;
		font-weight: 300;
	}

	.default {
		border-radius: var(--radius-medium);
		background: var(--color-code-bg);
		color: var(--color-article-heading-text);
		border: 1px solid var(--color-article-heading-text);

		&:hover {
			opacity: 0.8;
			color: var(--color-article-bg);
			background: var(--color-article-heading-text);
		}
	}

	.orange {
		background: var(--color-btn-bg);
		color: var(--color-text-accent);
		border: 1px solid var(--color-text-accent);
		border-radius: var(--radius-medium);

		&:hover {
			color: white;
			background: var(--color-text-accent);
		}
	}

	.underline {
		color: var(--color-primary-general);
		font-weight: 300;
		padding: 0;
		margin: 0 0.6em;

		&:hover {
			color: var(--color-primary);
			text-decoration: underline;
		}
	}

	.transparent {
		color: var(--color-primary-general);
		font-weight: 300;
		padding: 0;

		&:hover {
			color: var(--color-primary);
		}
	}

	.transparentInverse {
		color: var(--color-primary-general-inverse);
		font-weight: 300;
		padding: 0;

		&:hover {
			color: var(--color-primary-inverse);
		}
	}

	.purple {
		background: var(--merger-bottom-primary);
		color: white;
		border-radius: var(--radius-medium);

		&:hover {
			color: #d338f8;
			background: white;
		}
	}

	.blue {
		background: var(--merger-top-primary);
		color: white;
		border-radius: var(--radius-medium);

		&:hover {
			color: #3a9ffb;
			background: white;
		}
	}
`;
