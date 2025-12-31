import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { Editor } from "@tiptap/core";
import { CSSProperties, memo, useCallback } from "react";

interface ArticleMatProps {
	editor?: Editor;
	className?: string;
	style?: CSSProperties;
}

const ArticleMat = memo(({ editor, className, style }: ArticleMatProps) => {
	const onClickHandler = useCallback(() => {
		if (!editor) return;
		const doc = editor.state.doc;
		const lastChild = doc.lastChild;
		const inNotParagraph = lastChild && lastChild.type.name !== "paragraph";
		const voidParagraph = lastChild && lastChild.type.name === "paragraph" && lastChild.textContent.length === 0;
		if (inNotParagraph || !voidParagraph) {
			editor
				.chain()
				.command(({ tr, dispatch }) => {
					const emptyParagraph = editor.schema.nodes.paragraph.create();
					const transaction = tr.insert(doc.content.size, emptyParagraph);
					if (dispatch) {
						dispatch(transaction);
					}
					return true;
				})
				.focus("end", { scrollIntoView: false })
				.run();
		} else {
			editor?.commands.focus("end");
		}
	}, [editor]);

	return <div className={classNames("mat-under-article", {}, [className])} onClick={onClickHandler} style={style} />;
});

export const getMat = () => {
	const matCollection = document.getElementsByClassName("mat-under-article");
	if (matCollection && matCollection.length > 0) {
		return matCollection.item(0);
	}

	return null;
};

export default styled(ArticleMat)`
	&.mat-under-article {
		flex-grow: 1;
		background: transparent;
		cursor: text;
		width: 100%;
		min-height: 30vh;
	}
`;
