import styled from "@emotion/styled";
import { ChangeEvent, HTMLProps, MutableRefObject, forwardRef } from "react";
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
}

const Input = forwardRef((props: InputProps, ref?: MutableRefObject<HTMLInputElement>) => {
	const {
		dataQa,
		icon,
		hidden,
		endText,
		startText,
		className,
		errorText,
		showErrorText = true,
		...otherProps
	} = props;

	return (
		<div className={className}>
			{icon && <Icon code={icon} />}
			{startText && <div className={"startTextContainer"}>{startText}</div>}
			<Tooltip visible={!!errorText && showErrorText} content={<span>{errorText}</span>}>
				<input
					className="textInput"
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
				: `
		width: 100%;
		height: 34px;
		display: block;
		font-size: 14px;
		padding: 6px 12px;
		border-radius: var(--radius-medium);
		background: var(--color-code-bg);`}

		${(p) =>
			(p.disabled && "color: var(--color-input-disabled-text);") ||
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
	}

	input::placeholder {
		color: var(--color-placeholder);
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
