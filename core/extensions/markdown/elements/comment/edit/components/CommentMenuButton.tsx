import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getIsSelected from "@ext/markdown/elementsUtils/getIsSelected";
import hasMarkInSelection from "@ext/markdown/elementsUtils/hasMarkInSelection";
import { selecInsideSingleParagraph } from "@ext/markdown/elementsUtils/selecInsideSingleParagraph";
import { Editor } from "@tiptap/core";

const CommentMenuButton = ({ editor }: { editor: Editor }) => {
	const isSelected = getIsSelected(editor.state);
	const isSelectionInsideSingleParagraph = selecInsideSingleParagraph(editor.state);
	const commentInSelection = hasMarkInSelection(editor.state);
	const pageDataContext = PageDataContextService.value;

	return (
		<Button
			disabled={
				!isSelected || !isSelectionInsideSingleParagraph || !pageDataContext.userInfo || commentInSelection
			}
			icon={"message"}
			onClick={() => editor.chain().focus().toggleComment({ data: undefined }).run()}
			tooltipText={"Оставить комментарий"}
		/>
	);
};

export default CommentMenuButton;
