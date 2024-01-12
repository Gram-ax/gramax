import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getIsSelected from "@ext/markdown/elementsUtils/getIsSelected";
import { selecInsideSingleParagraph } from "@ext/markdown/elementsUtils/selecInsideSingleParagraph";
import { Editor } from "@tiptap/core";

const CommentMenuButton = ({ editor, onClick }: { editor: Editor; onClick: () => void }) => {
	const { isActive, disabled } = ButtonStateService.useCurrentAction({ mark: "comment" });
	const isSelected = getIsSelected(editor.state);
	const isSelectionInsideSingleParagraph = selecInsideSingleParagraph(editor.state);
	const pageDataContext = PageDataContextService.value;

	const onClickHandler = () => {
		editor.chain().focus().toggleComment({ data: undefined }).run();
		onClick();
	};

	return (
		<Button
			disabled={!isSelected || !isSelectionInsideSingleParagraph || !pageDataContext.userInfo || disabled}
			isActive={isActive}
			icon={"message"}
			onClick={onClickHandler}
			tooltipText={"Оставить комментарий"}
		/>
	);
};

export default CommentMenuButton;
