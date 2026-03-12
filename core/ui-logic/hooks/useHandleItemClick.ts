import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { useScrollPositionStore } from "@core-ui/stores/ScrollPositionStore";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { useCallback } from "react";

interface HandleClickParams {
	itemPath: string;
	toggleFunction: () => void;
	closeNavigation?: () => void;
	isCurrentLink: boolean;
}

const useHandleItemClick = ({ itemPath, toggleFunction, closeNavigation, isCurrentLink }: HandleClickParams) => {
	const articleElement = ArticleRefService.value.current;
	const { clearPosition } = useScrollPositionStore();

	const scrollToTop = useCallback(
		(articlePath: string) => {
			articleElement?.scrollTo({
				top: 0,
				left: 0,
				behavior: "smooth",
			});

			clearPosition(articlePath);
		},
		[articleElement, clearPosition],
	);

	return useCallback(
		(event: React.MouseEvent) => {
			const mutable = { preventGoto: false };
			void NavigationEvents.emit("item-click", { path: itemPath, mutable });

			if (mutable.preventGoto) {
				event.preventDefault();
				return;
			}

			closeNavigation?.();

			if (isCurrentLink) {
				scrollToTop(itemPath);
			}

			toggleFunction();
		},
		[itemPath, closeNavigation, isCurrentLink, scrollToTop, toggleFunction],
	);
};

export default useHandleItemClick;
