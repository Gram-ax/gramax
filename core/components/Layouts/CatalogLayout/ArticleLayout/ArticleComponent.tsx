import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import useSidebarSwipe from "@core-ui/hooks/useSidebarSwipe";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useRef } from "react";
import ArticleLayout from "./ArticleLayout";

export interface ArticleComponentProps {
	article: JSX.Element;
	rightNav: JSX.Element;
}

const ArticleComponent = (props: ArticleComponentProps) => {
	const { article, rightNav } = props;
	const isSidebarLeftPin = SidebarsIsPinService.value.left;
	const isSidebarRightPin = SidebarsIsPinService.value.right;
	const isSidebarRightOpen = SidebarsIsOpenService.value.right;
	const useArticleDefaultStyles = ArticleViewService.useArticleDefaultStyles;
	const additionalStyles = ArticleViewService.additionalStyles;
	const isNarrowLayout = useMediaQuery(cssMedia.JSmedium);

	const isRightNavHover = useRef(false);

	const onArticleMouseEnterHandler = () => {
		if (!isSidebarLeftPin) {
			SidebarsIsOpenService.value = { left: false };
		}
		if (!isSidebarRightPin) {
			SidebarsIsOpenService.value = { right: false };
		}
	};

	const onRightNavTransitionEndHandler = () => {
		SidebarsIsOpenService.transitionEndIsRightOpen = isRightNavHover.current;
	};

	const { openSwipeHandlers: rightNavOpenSwipeHandlers, closeSwipeHandlers: rightNavCloseSwipeHandlers } =
		useSidebarSwipe({
			enabled: isNarrowLayout && !isSidebarRightPin,
			isOpen: isSidebarRightOpen,
			onOpen: () => {
				SidebarsIsOpenService.value = { right: true };
			},
			onClose: () => {
				SidebarsIsOpenService.value = { right: false };
			},
			openDirection: "left",
		});

	return (
		<ArticleLayout
			additionalStyles={additionalStyles}
			article={article}
			isRightNavOpen={isSidebarRightOpen}
			isRightNavPin={isSidebarRightPin}
			narrowMedia={isNarrowLayout}
			onArticleMouseEnter={onArticleMouseEnterHandler}
			onRightNavTransitionEnd={onRightNavTransitionEndHandler}
			rightNav={rightNav}
			rightNavCloseSwipeHandlers={rightNavCloseSwipeHandlers}
			rightNavOpenSwipeHandlers={rightNavOpenSwipeHandlers}
			useArticleDefaultStyles={useArticleDefaultStyles}
		/>
	);
};

export default ArticleComponent;
