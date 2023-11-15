import styled from "@emotion/styled";
import React from "react";
import Icon from "./Icon";
import Tooltip from "./Tooltip";

const Input = styled(
	React.forwardRef(
		(
			{
				dataQa,
				value,
				onKeyDown,
				onChange,
				onFocus,
				onBlur,
				icon,
				placeholder,
				hidden,
				endText,
				startText,
				tabIndex,
				className,
				isInputInvalid,
				errorText,
			}: {
				dataQa?: string;
				value: string;
				onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
				onChange?: React.ChangeEventHandler<HTMLInputElement>;
				onFocus?: React.FocusEventHandler<HTMLInputElement>;
				onBlur?: React.FocusEventHandler<HTMLInputElement>;
				icon?: string;
				placeholder?: string;
				hidden?: boolean;
				endText?: string;
				startText?: string;
				isCode?: boolean;
				isInputInvalid?: boolean;
				errorText?: string;
				disable?: boolean;
				tabIndex?: number;
				className?: string;
			},
			ref?: React.MutableRefObject<HTMLInputElement>,
		) => {
			return (
				<div className={className}>
					{icon ? <Icon code={icon} faFw /> : null}
					{startText && <div className={"startTextContainer"}>{startText}</div>}
					<Tooltip visible={!!(isInputInvalid && errorText)} content={<span>{errorText}</span>}>
						<input
							className="textInput"
							data-qa={dataQa}
							ref={ref}
							type={hidden ? 'password' : 'text'}
							tabIndex={tabIndex}
							onKeyDown={onKeyDown}
							onChange={onChange}
							onFocus={onFocus}
							onBlur={onBlur}
							value={value}
							placeholder={placeholder}
						/>
					</Tooltip>
					{endText && <div className="endTextContainer">{endText}</div>}
				</div>
			);
		},
	),
)`
	gap: 0.5rem;
	${(p) => (p.disable ? "pointer-events: none;" : "")}
	width: 100%;
	display: flex;
	align-items: center;
	flex-direction: row;
	width: 100%;

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
		border-radius: 4px;
		background: var(--color-code-bg);
		color: var(--color-article-heading-text);
		`}
	}

	.textInput {
		${(p) => (p.startText || p.endText ? "max-width: 220px;" : "")};
		${(p) =>
			!p.isInputInvalid
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

export default Input;
