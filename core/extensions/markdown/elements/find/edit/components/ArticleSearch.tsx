import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { Editor } from "@tiptap/core";
import { FC, useEffect, useRef, useState } from "react";
import FindReplaceModal from "./FindReplaceModal";
import { Decoration } from "prosemirror-view";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		articleSearch: {
			openArticleSearch: () => ReturnType;
		};
	}
}

interface ArticleSearchProps {
	isOpen: boolean;
	editor: Editor;
	closeHandle: () => void;
	openHandle: () => void;
	decorations: Decoration[];
	className?: string;
}

const ArticleSearchComponent: FC<ArticleSearchProps> = (props) => {
	const { editor, closeHandle, openHandle, className, isOpen, ...otherProps } = props;
	const ref = useRef<HTMLDivElement>(null);
	const [openKey, setOpenKey] = useState(0);
	const [selectionText, setSelectionText] = useState("");
	const [caseSensitive, setCaseSensitive] = useState(false);
	const [wholeWord, setWholeWord] = useState(false);
	const [initialFindText, setInitialFindText] = useState("");
	const savedSelection = useRef(null);

	const restoreSelection = () => {
		if (savedSelection.current && editor) {
			const { state } = editor.view;
			const tr = state.tr.setSelection(savedSelection.current);
			editor.view.dispatch(tr);
			editor.view.focus();
		}
	};

	useWatch(() => {
		savedSelection.current = editor?.view?.state?.selection || null;
	}, [editor?.view?.state?.selection]);

	useEffect(() => {
		const keydownCallback = (event: KeyboardEvent) => {
			const action: (e: KeyboardEvent) => void = {
				Escape: (e: KeyboardEvent) => {
					if (!isOpen || !ref.current?.contains(document.activeElement)) return;

					e.preventDefault();
					closeHandle();
					restoreSelection();
				},
				KeyF: (e: KeyboardEvent) => {
					if (e.shiftKey) return;
					if (!e.ctrlKey && !e.metaKey) return;

					e.preventDefault();
					const selectionText = window.getSelection()?.toString() || "";
					setSelectionText(selectionText);
					openHandle();
					setOpenKey((prev) => prev + 1);
				},
			}[event.code];

			if (action) action(event);
		};

		document.addEventListener("keydown", keydownCallback);

		return () => document.removeEventListener("keydown", keydownCallback);
	}, [isOpen, closeHandle, openHandle]);

	if (!isOpen || !editor) return null;

	return (
		<div ref={ref} className={className}>
			<FindReplaceModal
				editor={editor}
				onClose={closeHandle}
				selectionText={selectionText}
				openKey={openKey}
				initialFindText={selectionText ? "" : initialFindText}
				setInitialFindText={setInitialFindText}
				caseSensitive={caseSensitive}
				wholeWord={wholeWord}
				setCaseSensitive={setCaseSensitive}
				setWholeWord={setWholeWord}
				parentRef={ref}
				{...otherProps}
			/>
		</div>
	);
};

const StyledArticleSearch = styled(ArticleSearchComponent)`
	right: 24px;
	top: 24px;
	position: absolute;
	z-index: 110;
	padding: 0 10px;

	font-size: 0.875rem;
	filter: brightness(1.1);
	color: var(--color-article-text);
	border-radius: var(--radius-large);
	background: var(--color-article-bg);
	box-shadow: var(--menu-tooltip-shadow);
`;

export default StyledArticleSearch;
