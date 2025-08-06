import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getIsSelected from "@ext/markdown/elementsUtils/getIsSelected";
import { Editor } from "@tiptap/core";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

const CommentMenuButton = ({ editor, onClick }: { editor: Editor; onClick: () => void }) => {
	const { isActive, disabled } = ButtonStateService.useCurrentAction({ mark: "comment" });
	const isSelected = getIsSelected(editor.state);
	const pageDataContext = PageDataContextService.value;
	const isButtonDisabled = !isSelected || !pageDataContext.userInfo || disabled;
	const tooltipText = pageDataContext.userInfo ? "leave-comment" : "connect-storage-to-leave-comment";
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onClickHandler = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getNewCommentId());
		if (!res.ok) return;
		const commentId = await res.text();
		const selection = editor.state.selection;
		if (!selection) return;

		editor.commands.toggleComment({ id: commentId }, { from: selection.from, to: selection.to });
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
