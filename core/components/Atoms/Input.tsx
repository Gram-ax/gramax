import { classNames } from "@components/libs/classNames";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { ChangeEvent, forwardRef, HTMLProps, MutableRefObject } from "react";
import Icon from "./Icon";
import Tooltip from "./Tooltip";

interface InputProps extends HTMLProps<HTMLInputElement> {
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	dataQa?: string;
	icon?: string;
	endText?: string;
	startText?: string;
	isCode?: boolean;
	errorText?: string;
	showErrorText?: boolean;
	tabIndex?: number;
	isLoading?: boolean;
}

const Input = forwardRef((props: InputProps, ref?: MutableRefObject<HTMLInputElement>) => {
	const {
		dataQa,
		icon,
		hidden,
		endText,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		isCode,
		startText,
		className,
		errorText,
		showErrorText = true,
		isLoading = false,
		...otherProps
	} = props;

	return (
		<div className={className}>
			{icon && <Icon code={icon} />}
			{startText && <div className="startTextContainer">{startText}</div>}
			<Tooltip content={<span>{errorText}</span>} visible={!!errorText && showErrorText}>
				<input
					className={classNames("textInput", { loading: isLoading })}
					data-qa={dataQa}
					ref={ref}
					type={hidden ? "password" : "text"}
					{...otherProps}
				/>
			</Tooltip>
			{endText && <div className="endTextContainer">{endText}</div>}
		</div>
	);
});

export default styled(Input)`
	gap: 0.5rem;
	${(p) => (p.disabled ? "pointer-events: none;" : "")}
	width: 100%;
	display: flex;
	align-items: center;
	flex-direction: row;

	input,
	.startTextContainer,
	.endTextContainer {
		flex: 1;
		border: none;
		outline: none;
		color: inherit;
		font-size: inherit;
		font-weight: inherit;
		line-height: inherit;
		background: none;

		${(p) =>
			!p.isCode
				? ""
				: css`
						width: 100%;
						height: 3em;
						display: block;
						font-size: 1em;
						padding: 0.4em 0.8em;
						border-radius: var(--radius-medium);
						background: var(--color-code-bg);
				  `}

		${(p) =>
			(p.disabled && p.readOnly && "color: var(--color-input-disabled-text);") ||
			(p.isCode && "color: var(--color-article-heading-text);")}
	}

	.textInput {
		${(p) => (p.startText || p.endText ? "max-width: 220px;" : "")};
		${(p) =>
			p.errorText == null || p.errorText == undefined
				? ""
				: `
		color: var(--color-admonition-danger-br-h);
		`}
		&.loading {
			position: relative;
			background: linear-gradient(
				50deg,
				var(--color-code-bg) 0%,
				var(--color-code-bg) 45%,
				rgba(255, 255, 255, 0.3) 50%,
				var(--color-code-bg) 55%,
				var(--color-code-bg) 100%
			);
			background-size: 300% 300%;
			animation: shimmer 1.5s infinite linear;
			color: transparent;
			user-select: none;
			cursor: default;

			&::placeholder {
				color: transparent;
			}
		}
	}

	@keyframes shimmer {
		100% {
			background-position: 0% 0%;
		}
		0% {
			background-position: 100% 100%;
		}
	}

	input::placeholder {
		color: var(--color-placeholder);
	}

	input[type="text"][disabled] {
		pointer-events: stroke;
		user-select: text;
	}

	.startTextContainer,
	.endTextContainer {
		opacity: 40%;
	}

	.startTextContainer {
		flex: 1 1 0%;
		overflow: auto;
		white-space: nowrap;
		overflow-y: hidden;
	}

	.endTextContainer {
		flex: 0;
		min-width: 32px;
	}
`;
