import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import type { CustomDecorations } from "@ext/markdown/elements/find/edit/components/ArticleSearchHotkeyView";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import type { Editor } from "@tiptap/core";
import { type FC, useEffect, useRef, useState } from "react";
import FindReplaceModal from "./FindReplaceModal";

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
	decorations: CustomDecorations[];
	className?: string;
}

const ArticleSearchComponent: FC<ArticleSearchProps> = (props) => {
	const { editor, closeHandle, openHandle, className, isOpen, ...otherProps } = props;
	const ref = useRef<HTMLDivElement>(null);
	const searchState = EditorService.getData("search");
	const [openKey, setOpenKey] = useState(0);
	const [selectionText, setSelectionText] = useState("");
	const [caseSensitive, setCaseSensitive] = useState(searchState.caseSensitive);
	const [wholeWord, setWholeWord] = useState(searchState.wholeWord);
	const [initialFindText, setInitialFindText] = useState(searchState.findText);
	const [replaceText, setReplaceText] = useState(searchState.replaceText);
	const [replaceIsOpen, setReplaceIsOpen] = useState(searchState.replaceIsOpen);
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const keydownCallback = (event: KeyboardEvent) => {
			const action: (e: KeyboardEvent) => void = {
				Escape: (e: KeyboardEvent) => {
					if (!editor || !isOpen) return;

					e.preventDefault();
					closeHandle();
					restoreSelection();
				},
				KeyF: (e: KeyboardEvent) => {
					if (!editor || !editor?.isFocused) return;
					if (e.shiftKey) return;
					if (!e.ctrlKey && !e.metaKey) return;
					if (e.ctrlKey && e.metaKey) return;

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
	}, [isOpen, closeHandle, openHandle, editor]);

	const updateSearchState = (partial: Partial<typeof searchState>) => {
		const current = EditorService.getData("search");
		EditorService.setData("search", { ...current, ...partial });
	};

	const handleSetInitialFindText = (value: string) => {
		setInitialFindText(value);
		updateSearchState({ findText: value });
	};

	const handleSetCaseSensitive = (value: boolean) => {
		setCaseSensitive(value);
		updateSearchState({ caseSensitive: value });
	};

	const handleSetWholeWord = (value: boolean) => {
		setWholeWord(value);
		updateSearchState({ wholeWord: value });
	};

	const handleSetReplaceText = (value: string) => {
		setReplaceText(value);
		updateSearchState({ replaceText: value });
	};

	const handleSetReplaceIsOpen = (value: boolean) => {
		setReplaceIsOpen(value);
		updateSearchState({ replaceIsOpen: value });
	};

	if (!isOpen || !editor) return null;

	return (
		<div className={className} ref={ref}>
			<FindReplaceModal
				caseSensitive={caseSensitive}
				editor={editor}
				initialFindText={selectionText ? "" : initialFindText}
				onClose={closeHandle}
				openKey={openKey}
				parentRef={ref}
				replaceIsOpen={replaceIsOpen}
				replaceText={replaceText}
				selectionText={selectionText}
				setCaseSensitive={handleSetCaseSensitive}
				setInitialFindText={handleSetInitialFindText}
				setReplaceIsOpen={handleSetReplaceIsOpen}
				setReplaceText={handleSetReplaceText}
				setWholeWord={handleSetWholeWord}
				wholeWord={wholeWord}
				{...otherProps}
			/>
		</div>
	);
};

const StyledArticleSearch = styled(ArticleSearchComponent)`
	right: 24px;
	top: 24px;
	position: absolute;
	z-index: var(--z-index-article-search);
	padding: 0 10px;

	font-size: 0.875rem;
	filter: brightness(1.1);
	color: var(--color-article-text);
	border-radius: var(--radius-large);
	background: var(--color-article-bg);
	box-shadow: var(--menu-tooltip-shadow);
`;

export default StyledArticleSearch;
