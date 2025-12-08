import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { useCallback } from "react";

interface HandleClickParams {
	itemPath: string;
	toggleFunction: () => void;
	closeNavigation?: () => void;
	isCurrentLink: boolean;
}

const scrollToTop = (element: HTMLElement | null) => {
	element?.scrollTo({
		top: 0,
		left: 0,
		behavior: "smooth",
	});
};

const useHandleItemClick = ({ itemPath, toggleFunction, closeNavigation, isCurrentLink }: HandleClickParams) => {
	const articleElement = ArticleRefService.value.current;

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
				scrollToTop(articleElement);
			}

			toggleFunction();
		},
		[itemPath, closeNavigation, isCurrentLink, articleElement, toggleFunction],
	);
};

export default useHandleItemClick;
