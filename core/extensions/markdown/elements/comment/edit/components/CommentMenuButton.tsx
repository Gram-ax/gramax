import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
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
	const tooltipText = pageDataContext.userInfo ? "leave-comment" : "connect-storage-to-leave-comment";
	const onClickHandler = () => {
		editor.commands.toggleComment({ data: undefined });
		onClick();
	};

	return (
		<Button
			disabled={isButtonDisabled}
			isActive={isActive}
			icon={"message-square"}
			onClick={onClickHandler}
			tooltipText={(!pageDataContext.userInfo || !isButtonDisabled) && t(tooltipText)}
		/>
	);
};

export default CommentMenuButton;
