import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/core";
import { Mark } from "prosemirror-model";
import { useEffect, useRef, useState } from "react";
import CommentBlockComponent from "../../../../../../components/Comments/CommentBlock";
import Input from "../../../../../../components/Comments/Input";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";
import { EditorView } from "prosemirror-view";
import { getMat } from "@ext/markdown/core/edit/components/ArticleMat";
import { classNames } from "@components/libs/classNames";

interface CommentProps {
	mark: Mark;
	view: EditorView;
	element: HTMLElement;
	onDelete: () => void;
	onUpdate: (commentBlock: CommentBlock) => void;
	onConfirm: (content: JSONContent[]) => void;
	className?: string;
}

const Comment = (props: CommentProps) => {
	const { mark, view, element, onDelete, onUpdate, onConfirm, className } = props;
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		element.style.color = "var(--color-comment-active-text)";
		element.style.background = "var(--color-comment-active-bg)";

		return () => {
			element.style.color = "var(--color-article-text)";
			element.style.background = "var(--color-comment-bg)";
		};
	}, [mark?.attrs?.count]);

	const onLoaded = () => {
		setIsLoaded(true);
		setPosition();
	};

	const setPosition = () => {
		const tooltip = tooltipRef.current?.parentElement;
		const tooltipWidth = tooltip.offsetWidth;
		const tooltipHeight = document.documentElement.clientHeight / 2;
		const rect = element.getBoundingClientRect();
		const domRect = view.dom.parentElement.getBoundingClientRect();
		const mat = getMat();
		const matHeight = (mat?.getBoundingClientRect().height ?? 0) + 12;

		tooltip.style.top = tooltip.style.bottom = null;
		const top = rect.top - domRect.top;

		if (tooltipHeight > domRect.height) tooltip.style.top = top + rect.height + "px";
		else {
			if (top + tooltipHeight > domRect.height) {
				tooltip.style.bottom = domRect.height + matHeight - top + "px";
			} else tooltip.style.top = top + rect.height + "px";
		}

		tooltip.style.left = tooltip.style.right = null;
		const left = rect.left - domRect.left;

		if (left > 0 && left + tooltipWidth > domRect.width) tooltip.style.right = "0px";
		else if (left < 0) tooltip.style.left = "0px";
		else tooltip.style.left = left + "px";
	};

	if (mark?.attrs?.comment) {
		if (!Array.isArray(mark.attrs.answers)) (mark.attrs as CommentBlock).answers = [];
		return (
			<div ref={tooltipRef} className={classNames(className, { isLoaded })} data-comment={true}>
				<CommentBlockComponent
					maxHeight="50vh"
					onLoaded={onLoaded}
					commentBlock={mark.attrs as CommentBlock}
					onUpdate={onUpdate}
					onDeleteComment={onDelete}
				/>
			</div>
		);
	}

	return (
		<div ref={tooltipRef} className={classNames(className, { isLoaded })}>
			<div className="add-input" data-qa="qa-add-comment">
				<Input
					onCancel={onDelete}
					onConfirm={onConfirm}
					onLoaded={onLoaded}
					placeholder={t("leave-comment")}
					confirmButtonText={t("comment")}
				/>
			</div>
		</div>
	);
};

export default styled(Comment)`
	z-index: var(--z-index-foreground);
	border-radius: var(--radius-x-large);
	overflow: hidden;
	background: var(--color-comments-bg);
	box-shadow: var(--comment-tooltip-shadow);
	opacity: 0;

	&.isLoaded {
		opacity: 1;
	}

	.add-input {
		padding: 1em;
	}
`;
