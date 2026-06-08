import styled from "@emotion/styled";
import { type DependencyList, type HTMLProps, type KeyboardEventHandler, useEffect, useRef, useState } from "react";

interface ContentEditableProps extends Omit<HTMLProps<HTMLDivElement>, "onChange"> {
	value: string;
	onChange?: (v: string) => void;
	onEnter?: () => void;
	deps?: DependencyList;
	className?: string;
}

const ContentEditable = (props: ContentEditableProps) => {
	const { value, onChange, onEnter, deps, className, autoFocus, ...rest } = props;
	const [html, setHtml] = useState(value);
	const inputRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setHtml(value);
		// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	}, deps);

	useEffect(() => {
		if (autoFocus) {
			inputRef.current?.focus({ preventScroll: true });
			window.getSelection().selectAllChildren(inputRef.current);
			window.getSelection().collapseToEnd();
		}
	}, [autoFocus]);

	const handleInput = (e) => {
		onChange(e.target.innerText ?? "");
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const text = e.clipboardData.getData("text/plain").replaceAll("\n", "");
		document.execCommand("insertText", false, text);
		onChange(text);
	};

	const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			onEnter?.();
		}

		if ((e.metaKey || e.ctrlKey) && e.key === "a") {
			e.preventDefault();
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(e.currentTarget);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	};

	return (
		<div
			className={className}
			contentEditable
			ref={inputRef}
			{...rest}
			// biome-ignore lint/style/useNamingConvention: expected
			dangerouslySetInnerHTML={{ __html: html }}
			onInput={handleInput}
			onKeyDown={handleKeyDown}
			onPaste={handlePaste}
			suppressContentEditableWarning={true}
		/>
	);
};

export default styled(ContentEditable)`
	outline: none;
	min-width: 1px;
	overflow-x: auto;
	white-space: nowrap !important;

	scrollbar-width: none; /* Firefox */
	-ms-overflow-style: none; /* IE and Edge */
	&::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera*/
	}
`;
