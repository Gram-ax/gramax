import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { memo, useCallback, useEffect, useState } from "react";

const CommentMenuButton = memo(({ editor }: { editor: Editor }) => {
	const [isSelected, setIsSelected] = useState(false);
	const { isActive, disabled } = ButtonStateService.useCurrentAction({ mark: "comment" });
	const pageDataContext = PageDataContextService.value;
	const isStorageConnected = useIsStorageConnected();
	const apiUrlCreator = ApiUrlCreatorService.value;

	useEffect(() => {
		const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
			setIsSelected(!editor.state.selection.empty);
		};

		editor.on("selectionUpdate", onSelectionUpdate);
		return () => {
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor]);

	const isButtonDisabled = !isSelected || !pageDataContext.userInfo || disabled || !isStorageConnected;
	const tooltipText =
		pageDataContext.userInfo && isStorageConnected ? "leave-comment" : "connect-storage-to-leave-comment";

	const onClickHandler = useCallback(async () => {
		const res = await FetchService.fetch(apiUrlCreator.getNewCommentId());
		if (!res.ok) return;
		const commentId = await res.text();
		const selection = editor.state.selection;
		if (!selection) return;

		editor.commands.toggleComment({ id: commentId }, { from: selection.from, to: selection.to });
	}, [editor, apiUrlCreator]);

	return (
		<ToolbarToggleButton
			disabled={isButtonDisabled}
			active={isActive}
			onClick={onClickHandler}
			tooltipText={(!pageDataContext.userInfo || !isStorageConnected || !isButtonDisabled) && t(tooltipText)}
		>
			<ToolbarIcon icon={"message-circle-2"} />
		</ToolbarToggleButton>
	);
});

export default CommentMenuButton;
