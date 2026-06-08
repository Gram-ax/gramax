import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import { setEditorStore, useEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import { ReviewListCounter } from "@ext/review/components/ReviewListCounter";
import { Label } from "@ui-kit/Label";
import { useCallback } from "react";

export const ReviewListHeader = ({ unreadCount, count }: { unreadCount: number; count: number }) => {
	const review = useEditorStore((s) => s.review);

	const handleClose = useCallback(() => {
		setEditorStore({ review: !review });
	}, [review]);

	return (
		<div className="px-3 mb-2 w-full flex items-center justify-between h-4">
			<div className="flex items-center gap-2">
				<Label className="uppercase text-[var(--color-merge-request-text)]">
					{t("editor.modes.type-filter.comments")}
				</Label>
				<ReviewListCounter count={count} unreadCount={unreadCount} />
			</div>
			<TooltipIconButton
				className="gap-1 text-xs relative px-3 py-0.5 -mr-2 h-auto"
				icon="x"
				iconClassName="h-4 w-4"
				onClick={handleClose}
				size="xs"
				tooltip={t("close")}
				variant="text"
			/>
		</div>
	);
};
