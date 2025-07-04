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
	onMouseEnter?: (event: MouseEvent<HTMLDivElement>) => void;
	onMouseLeave?: (event: MouseEvent<HTMLDivElement>) => void;
}

export enum TextSize {
	XXS = "text_xx_small",
	XS = "text_x_small",
	S = "text_small",
	M = "text_medium",
	L = "text_large",
	XL = "text_x_large",
}

export const TextKeys = {
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
		style,
		...otherProps
	} = props;

	return (
		<div data-qa="qa-clickable" data-qa-disabled={disabled || null} className={className} ref={ref}>
			<div
				style={{ fontSize: TextKeys[textSize] + (isEmUnits ? "em" : "rem"), ...(style ?? {}) }}
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
		font-weight: var(--font-weight-default);
	}

	.default {
		border-radius: var(--radius-medium);
		background: var(--color-btn-default-bg);
		color: var(--color-btn-default-text);
		border: var(--border-btn-default);

		&:hover {
			opacity: var(--opacity-btn-default-bg-hover);
			color: var(--color-btn-default-text-hover);
			background: var(--color-btn-default-bg-hover);
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

	//fixme after change all form
	.underline {
		border-radius: var(--radius-medium);
		color: var(--color-btn-underline-text);
		font-weight: var(--font-weight-btn-underline);
		padding: var(--padding-btn-underline);
		margin: var(--margin-btn-underline);
		text-decoration: none;

		&:hover {
			color: var(--color-btn-underline-text-hover);
			text-decoration: var(--text-decoration-btn-underline-hover);
			background-color: var(--color-btn-underline-bg-hover);
		}
	}

	.transparent {
		color: var(--color-primary-general);
		font-weight: var(--font-weight-default);
		padding: 0;

		&:hover {
			color: var(--color-primary);
		}
	}

	.transparentInverse {
		color: var(--color-primary-general-inverse);
		font-weight: var(--font-weight-default);
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

	.git {
		background: white;
		color: var(--version-control-primary);
		border-radius: var(--radius-medium);

		&:hover {
			background: var(--version-control-primary);
			color: white;
		}
	}
`;
