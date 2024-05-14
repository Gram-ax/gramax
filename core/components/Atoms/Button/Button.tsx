import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { MutableRefObject, ReactNode, forwardRef, type CSSProperties } from "react";
import { ButtonStyle } from "./ButtonStyle";

export interface ButtonProps {
	buttonStyle?: ButtonStyle;
	style?: CSSProperties;
	onClick?: (event?: React.MouseEvent<HTMLElement>) => any;
	children?: ReactNode;
	disabled?: boolean;
	fullWidth?: boolean;
	textSize?: TextSize;
	className?: string;
}

export enum TextSize {
	XXS = "text_xx_small",
	XS = "text_x_small",
	S = "text_small",
	M = "text_medium",
	L = "text_large",
	XL = "text_x_large",
}

const Button = forwardRef((props: ButtonProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const {
		buttonStyle = ButtonStyle.default,
		textSize = TextSize.M,
		fullWidth = false,
		className,
		children,
		...otherProps
	} = props;

	return (
		<div data-qa="qa-clickable" className={className} ref={ref}>
			<div className={classNames(buttonStyle, { fullWidth }, [textSize, "content"])} {...otherProps}>
				{children}
			</div>
		</div>
	);
});

export default styled(Button)`
	${(p) => (p.disabled ? `pointer-events: none; opacity: 0.4;` : ``)}
	.text_xx_small {
		font-size: 0.6rem;
	}

	.text_x_small {
		font-size: 0.75rem;
	}

	.text_small {
		font-size: 0.875rem;
	}

	.text_medium {
		font-size: 1rem;
	}

	.text_large {
		font-size: 1.25rem;
	}

	.text_x_large {
		font-size: 1.5rem;
	}

	.fullWidth {
		width: 100%;
	}

	.content {
		width: fit-content;
		padding: 0.33rem 0.88rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		user-select: none;
		font-weight: 300;
	}

	.default {
		border-radius: var(--radius-normal);
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
		border-radius: var(--radius-normal);

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

	.purple {
		background: var(--merger-bottom-primary);
		color: white;
		border-radius: var(--radius-normal);

		&:hover {
			color: #d338f8;
			background: white;
		}
	}

	.blue {
		background: var(--merger-top-primary);
		color: white;
		border-radius: var(--radius-normal);

		&:hover {
			color: #3a9ffb;
			background: white;
		}
	}
`;
