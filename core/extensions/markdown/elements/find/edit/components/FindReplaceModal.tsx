import { TextSize } from "@components/Atoms/Button/Button";
import Checkbox from "@components/Atoms/Checkbox";
import Input from "@components/Atoms/Input";
import Tooltip from "@components/Atoms/Tooltip";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { isElementNearEdges } from "@ext/markdown/elements/find/edit/logic/elementNearEdges";
import {
	replaceSpecificHighlightedText,
	replaceHighlightedText,
} from "@ext/markdown/elements/find/edit/logic/replaceText";
import { searchPlugin } from "@ext/markdown/elements/find/edit/models/ArticleSearch";
import React, { useState, useRef, useEffect, useCallback, ChangeEvent, RefObject } from "react";
import { Editor } from "@tiptap/core";
import { EditorView } from "prosemirror-view";
import t from "@ext/localization/locale/translate";
import { Decoration } from "prosemirror-view";

interface FindReplaceModalProps {
	onClose: () => void;
	openKey: number;
	wholeWord: boolean;
	caseSensitive: boolean;
	setWholeWord: (value: boolean) => void;
	setCaseSensitive: (value: boolean) => void;
	setInitialFindText: (value: string) => void;
	editor?: Editor;
	className?: string;
	selectionText?: string;
	initialFindText?: string;
	decorations: Decoration[];
	parentRef?: RefObject<HTMLDivElement>;
}

const FindReplaceModal: React.FC<FindReplaceModalProps> = (props) => {
	const {
		onClose,
		editor,
		className,
		decorations,
		openKey,
		selectionText,
		setCaseSensitive,
		setWholeWord,
		setInitialFindText,
		initialFindText = "",
		caseSensitive,
		wholeWord,
		parentRef,
	} = props;

	const [findText, setFindText] = useState("");
	const [replaceText, setReplaceText] = useState("");
	const [isActiveHighlight, setIsActiveHighlight] = useState(false);
	const { start } = useDebounce(() => setIsActiveHighlight(true), 200);
	const inputRef = useRef<HTMLInputElement>(null);
	const counterRef = useRef<HTMLDivElement>(null);
	const [counterText, setCounterText] = useState("0/0");
	const [activeElementIndex, setElementIndex] = useState(0);
	const [inputWidth, setInputWidth] = useState(130);
	const [counterWidth, setCounterWidth] = useState(20);
	const [configIsOpen, setConfigIsOpen] = useState(false);
	const [replaceIsOpen, setReplaceIsOpen] = useState(false);

	const handleDownElement = () => {
		const nextIndex = activeElementIndex + 1;

		if (nextIndex < decorations.length) setElementIndex(nextIndex);
		else setElementIndex(0);
	};

	const handleOpenConfig = () => {
		if (!configIsOpen && replaceIsOpen) setReplaceIsOpen(false);
		setConfigIsOpen(!configIsOpen);
	};

	const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFindText(e.target.value);
		setInitialFindText(e.target.value);
		setIsActiveHighlight(false);
		start();
	};

	const handleUpElement = () => {
		const prevIndex = activeElementIndex - 1;

		if (activeElementIndex === 0) setElementIndex(decorations.length - 1);
		else setElementIndex(prevIndex);
	};

	const handleReplaceOpen = () => {
		if (!replaceIsOpen) setConfigIsOpen(false);
		setReplaceIsOpen(!replaceIsOpen);
	};

	const handleOnReplaceChange = (e: ChangeEvent<HTMLInputElement>) => {
		setReplaceText(e.target.value);
	};
	const handleReplace = () => {
		replaceSpecificHighlightedText(
			editor.view,
			findText,
			replaceText,
			activeElementIndex,
			caseSensitive,
			wholeWord,
		);
	};
	const handleReplaceAll = () => {
		replaceHighlightedText(editor.view, findText, replaceText, caseSensitive, wholeWord);
	};

	const updateSearch = useCallback(
		(
			searchTerm: string,
			isActiveHighlight: boolean,
			view: EditorView,
			activeElementIndex: number,
			caseSensitive: boolean,
			wholeWord: boolean,
		) => {
			const plugin = searchPlugin({
				searchTerm,
				isActiveHighlight,
				activeElementIndex,
				caseSensitive,
				wholeWord,
			});

			const currentPlugins = view.state.plugins;

			const filteredPlugins = currentPlugins.filter((p) => p.spec?.key !== plugin.spec?.key);
			const newState = view.state.reconfigure({
				plugins: [...filteredPlugins, plugin],
			});

			try {
				view.updateState(newState);
			} catch (e) {}
		},
		[searchPlugin],
	);

	useWatch(() => {
		updateSearch(findText, isActiveHighlight, editor.view, activeElementIndex, caseSensitive, wholeWord);
	}, [updateSearch, isActiveHighlight, findText, activeElementIndex, caseSensitive, wholeWord]);

	useWatch(() => {
		if (selectionText) {
			setFindText(selectionText);
			setInitialFindText(selectionText);
			if (!isActiveHighlight) setIsActiveHighlight(true);
			return;
		}

		if (initialFindText && !findText) {
			setFindText(initialFindText);
			if (!isActiveHighlight) setIsActiveHighlight(true);
		}
	}, [openKey]);

	useWatch(() => {
		if (decorations.length === 0) setElementIndex(0);
		else if (decorations.length < activeElementIndex) {
			setElementIndex(0);
		}
	}, [decorations.length]);

	useWatch(() => {
		const length = decorations.length;
		const userRightIndex = activeElementIndex + 1;
		if (!length) setCounterText("0/0");
		else {
			const v = userRightIndex + "/" + length;
			setCounterText(v);
		}
	}, [decorations.length, findText, activeElementIndex]);

	useEffect(() => {
		if (!isActiveHighlight || !findText) return;
		const elementsCollection = editor.view.dom.getElementsByClassName("search-highlight-active");
		const item = elementsCollection.item(0) as HTMLElement;
		if (!item) return;
		if (isElementNearEdges(item)) item.scrollIntoView({ block: "center", behavior: "instant" });
	}, [activeElementIndex, isActiveHighlight]);

	useEffect(() => {
		if (findText) inputRef.current.select();
		else inputRef.current.focus();
	}, [openKey]);

	useEffect(() => {
		const MAX_WIDTH = 150;
		const counterWidth = counterRef.current.clientWidth;

		const newCounterWidth = Math.max(counterWidth, 23);
		setCounterWidth(newCounterWidth);
		setInputWidth(MAX_WIDTH - newCounterWidth);
	}, [counterText, findText]);

	useEffect(() => {
		return () => updateSearch("", true, editor.view, activeElementIndex, caseSensitive, wholeWord);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const action = {
				Enter: () => {
					if (e.shiftKey) handleUpElement();
					else handleDownElement();
				},
				ArrowDown: () => {
					e.preventDefault();
					handleDownElement();
				},
				ArrowUp: () => {
					e.preventDefault();
					handleUpElement();
				},
			}[e.code];

			if (parentRef.current?.contains(document.activeElement)) action?.();
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [activeElementIndex, decorations]);

	return (
		<div className={className}>
			<div className="left-action">
				<ButtonLink
					textSize={TextSize.M}
					iconFw={false}
					className={"toggle-bottom-action"}
					iconCode={`chevron-${replaceIsOpen ? "down" : "right"}`}
					onClick={handleReplaceOpen}
				/>
				<div className={"divider"} />
			</div>
			<div className={"right-wrapper"}>
				<div className={"right-action"}>
					<Input
						type={"text"}
						placeholder={t("find2")}
						value={findText}
						onChange={handleOnChange}
						className={"right-action-input"}
						style={{ width: inputWidth }}
						ref={inputRef}
					/>
					<div className={"counter to-middle"} ref={counterRef} style={{ width: counterWidth }}>
						{findText && <span>{counterText}</span>}
					</div>
					<div className="divider" />
					<ButtonLink
						textSize={TextSize.M}
						iconFw={false}
						className={"to-middle"}
						onClick={handleUpElement}
						iconCode={"chevron-up"}
					/>
					<ButtonLink
						textSize={TextSize.M}
						iconFw={false}
						onClick={handleDownElement}
						className={"to-middle"}
						iconCode={"chevron-down"}
					/>
					<div className={"filter-item to-middle"}>
						<Tooltip content={t("filter")}>
							<ButtonLink
								textSize={TextSize.M}
								iconFw={false}
								onClick={handleOpenConfig}
								className={"to-middle"}
								iconCode={"list-filter"}
							/>
						</Tooltip>

						{(wholeWord || caseSensitive) && (
							<div onClick={handleOpenConfig} className={"filter-counter"}>
								{[wholeWord, caseSensitive].filter(Boolean).length}
							</div>
						)}
					</div>

					<ButtonLink
						onClick={onClose}
						textSize={TextSize.M}
						iconFw={false}
						className={"to-middle"}
						iconCode={"x"}
					/>
				</div>
				{configIsOpen && (
					<div className={"right-action checkbox-view"}>
						<Checkbox
							className={"checkbox-item"}
							checked={caseSensitive}
							onClick={() => setCaseSensitive(!caseSensitive)}
						>
							<span>{t("caseSensitive")}</span>
						</Checkbox>
						<Checkbox
							className={"checkbox-item"}
							checked={wholeWord}
							onClick={() => setWholeWord(!wholeWord)}
						>
							<span>{t("wholeWord")}</span>
						</Checkbox>
					</div>
				)}
				{replaceIsOpen && (
					<div className={"right-action replace-view"}>
						<Input
							type={"text"}
							placeholder={t("replace")}
							value={replaceText}
							onChange={handleOnReplaceChange}
							className={"right-replace-input"}
						/>
						<div className="divider" />
						<Tooltip content={t("replace")}>
							<ButtonLink
								textSize={TextSize.M}
								iconFw={false}
								className={"to-middle"}
								onClick={handleReplace}
								iconCode={"replace"}
							/>
						</Tooltip>

						<Tooltip content={t("replaceAll")}>
							<ButtonLink
								textSize={TextSize.M}
								iconFw={false}
								onClick={handleReplaceAll}
								className={"to-middle"}
								iconCode={"replace-all"}
							/>
						</Tooltip>
					</div>
				)}
			</div>
		</div>
	);
};

export default styled(FindReplaceModal)`
	display: flex;
	flex-direction: row;
	padding: 10px 0;
	gap: 8px;

	.left-action {
		display: flex;
		flex-direction: row;
		width: 26px;
		justify-content: space-between;
		gap: 8px;

		.toggle-bottom-action {
			margin-top: 3px;
			height: 18px;
			width: 18px;
			display: flex;
			align-items: center;
		}
	}

	.to-middle {
		display: flex;
		align-items: center;
	}

	.filter-item {
		position: relative;
	}

	.filter-counter {
		position: absolute;
		height: 12px;
		width: 12px;
		line-height: 12px;
		border-radius: 6px;
		font-weight: 400;
		background-color: #0075ff;
		color: #ffffff;
		display: flex;
		justify-content: center;
		vertical-align: middle;
		right: -6px;
		bottom: 0;
		font-size: 10px;
		user-select: none;
		cursor: pointer;
	}

	.right-wrapper {
		gap: 16px;
		display: flex;
		flex-direction: column;

		.checkbox-item {
			height: 24px;
			width: fit-content;
		}

		.checkbox-view {
			display: flex;
			flex-direction: column;
			height: unset !important;
		}
	}

	.right-action {
		height: 24px;
		line-height: 20px;
		display: flex;
		flex-direction: row;
		vertical-align: middle;
		gap: 8px;
	}

	.right-replace-input {
		max-width: 158px;
		width: 158px;
	}
	.replace-view {
		display: flex;
		justify-content: start;
	}

	.counter {
		display: flex;
		justify-content: end;
		min-width: 20px;
		opacity: 0.6;
		user-select: none;
		font-size: 14px;
	}

	.divider {
		padding: 0;
		height: 100%;
		border-left: 1px solid var(--color-edit-menu-button-active-bg-inverse);
	}
`;
