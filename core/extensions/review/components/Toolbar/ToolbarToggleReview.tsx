import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { setEditorStore, useEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import { ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { useCallback } from "react";

export const ToolbarToggleReview = () => {
	const pageDataContext = PageDataContext.value;
	const isStorageConnected = useIsStorageConnected();
	const isCommentsDisabled = !pageDataContext.userInfo || !isStorageConnected;
	const isReadOnly = pageDataContext.conf.isReadOnly;
	const review = useEditorStore((s) => s.review);

	const toggleCommentMode = useCallback(() => {
		setEditorStore({ review: !review });
	}, [review]);

	if (isCommentsDisabled) return null;

	return (
		<ToolbarToggleButton
			active={review}
			disabled={isReadOnly}
			onClick={toggleCommentMode}
			tooltipText={t("editor.modes.comments")}
		>
			<ToolbarIcon icon={"message-square-quote"} />
		</ToolbarToggleButton>
	);
};
