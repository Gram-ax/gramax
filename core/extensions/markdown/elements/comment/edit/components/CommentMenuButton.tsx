import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useLocalize from "@ext/localization/useLocalize";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getIsSelected from "@ext/markdown/elementsUtils/getIsSelected";
import { selecInsideSingleParagraph } from "@ext/markdown/elementsUtils/selecInsideSingleParagraph";
import { Editor } from "@tiptap/core";

const CommentMenuButton = ({ editor, onClick }: { editor: Editor; onClick: () => void }) => {
	const { isActive, disabled } = ButtonStateService.useCurrentAction({ mark: "comment" });
	const isSelected = getIsSelected(editor.state);
	const isSelectionInsideSingleParagraph = selecInsideSingleParagraph(editor.state);
	const pageDataContext = PageDataContextService.value;
	const isButtonDisabled = !isSelected || !isSelectionInsideSingleParagraph || !pageDataContext.userInfo || disabled;
	const tooltipText = pageDataContext.userInfo ? "leaveComment" : "connectStorageToLeaveComment";
	const onClickHandler = () => {
		editor.chain().focus().toggleComment({ data: undefined }).run();
		onClick();
	};

	return (
		<Button
			disabled={isButtonDisabled}
			isActive={isActive}
			icon={"message"}
			onClick={onClickHandler}
			tooltipText={(!pageDataContext.userInfo || !isButtonDisabled) && useLocalize(tooltipText)}
		/>
	);
};

export default CommentMenuButton;
