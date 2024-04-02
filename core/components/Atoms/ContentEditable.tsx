import styled from "@emotion/styled";
import { DependencyList, KeyboardEventHandler, useEffect, useState } from "react";

const ContentEditable = ({
	value,
	onChange,
	deps,
	className,
}: {
	value: string;
	onChange: (v: string) => void;
	deps?: DependencyList;
	className?: string;
}) => {
	const [html, setHtml] = useState(value);

	useEffect(() => {
		setHtml(value);
	}, deps);
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
		if (e.key === "Enter") e.preventDefault();

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
			onInput={handleInput}
			onPaste={handlePaste}
			onKeyDown={handleKeyDown}
			dangerouslySetInnerHTML={{ __html: html }}
			suppressContentEditableWarning={true}
		/>
	);
};

export default styled(ContentEditable)`
	outline: none;
	overflow-x: auto;
	white-space: nowrap;

	scrollbar-width: none; /* Firefox */
	-ms-overflow-style: none; /* IE and Edge */
	&::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera*/
	}
`;
