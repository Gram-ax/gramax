import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import t from "@ext/localization/locale/translate";
import { markItemAsRead } from "@ext/review/logic/store/ReviewNotificationsStore";
import { useReviewStore } from "@ext/review/logic/store/ReviewStore";
import type { ReviewScope } from "@ext/review/models/ReviewList";
import { useCallback } from "react";

export const ReviewOptions = ({ scope }: { scope: ReviewScope }) => {
	const items = useReviewStore((s) => (scope === "catalog" ? s.catalogItems : s.articleItems));

	const markAsRead = useCallback(() => {
		if (!items) return;

		items.forEach((item) => {
			markItemAsRead(item.id);
		});
	}, [items]);

	return (
		<TooltipIconButton
			className="gap-1 text-xs relative px-1.5 py-0.5 ml-auto -mr-1.5"
			icon="mail-open"
			iconClassName="h-4 w-4"
			onClick={markAsRead}
			size="xs"
			tooltip={t("editor.modes.mark-as-read")}
			variant="text"
		/>
	);
};
