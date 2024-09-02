import styled from "@emotion/styled";
import React, { DependencyList, useEffect, useState } from "react";
import Icon from "./Icon";

function insertPlainText(text) {
	const selection = window.getSelection();
	if (!selection.rangeCount) return false;
	const range = selection.getRangeAt(0);
	range.deleteContents();

	const textNode = document.createTextNode(text);
	range.insertNode(textNode);
	range.setStartAfter(textNode);
	selection.removeAllRanges();
	selection.addRange(range);
}

const BlockInput = styled(
	React.forwardRef(
		(
			{
				onBlur,
				onInput,
				onFocus,
				onKeyDown,
				value,
				icon,
				placeholder,
				isCode = false,
				className,
				deps,
			}: {
				onBlur?: React.FocusEventHandler<HTMLDivElement | HTMLPreElement>;
				onInput: React.FormEventHandler<HTMLDivElement | HTMLPreElement>;
				onFocus?: React.FocusEventHandler<HTMLDivElement | HTMLPreElement>;
				onKeyDown?: React.KeyboardEventHandler<HTMLDivElement | HTMLPreElement>;
				value?: string;
				icon?: string;
				placeholder?: string;
				isCode?: boolean;
				className?: string;
				deps?: DependencyList;
			},
			ref?: React.MutableRefObject<HTMLDivElement | HTMLPreElement>,
		) => {
			const [currentValue, setCurrentValue] = useState(value);

			useEffect(() => {
				if (value == "" && currentValue == "") setCurrentValue(" ");
				else setCurrentValue(value);
			}, deps);

			useEffect(() => {
				if (currentValue == " ") setCurrentValue(value);
			}, [currentValue]);

			return (
				<div className={className + (isCode ? " article ProseMirror" : "")}>
					{icon ? <Icon code={icon} /> : null}
					{React.createElement(
						isCode ? "pre" : "div",
						{
							ref,
							onBlur,
							onInput,
							onFocus,
							onKeyDown,
							contentEditable: true,
							suppressContentEditableWarning: true,
							"data-text": placeholder,
							onPaste: (e) => {
								e.preventDefault();
								insertPlainText(e.clipboardData.getData("Text"));
							},
						},
						currentValue,
					)}
				</div>
			);
		},
	),
)`
	width: 100%;
	display: flex;
	align-items: center;

	pre,
	div {
		outline: none;
		width: 100%;

		:hover {
			cursor: text;
		}
	}

	pre {
		margin: 0;
		width: 100%;
		display: block;
		padding: 6px 12px;
		font-size: 0.8rem;
		line-height: 20px;
		border-radius: var(--radius-small);
		color: var(--color-fence-text);
		background: var(--color-code-bg);
	}

	[contentEditable="true"]:empty:before {
		content: attr(data-text);
		color: var(--color-placeholder);
	}
`;

export default BlockInput;
