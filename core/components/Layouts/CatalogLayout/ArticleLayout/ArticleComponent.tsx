import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useMediaQuery } from "@mui/material";
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

	return (
		<ArticleLayout
			article={article}
			isRightNavPin={isSidebarRightPin}
			isRightNavOpen={isSidebarRightOpen}
			narrowMedia={useMediaQuery(cssMedia.JSmedium)}
			onArticleMouseEnter={onArticleMouseEnterHandler}
			onRightNavTransitionEnd={onRightNavTransitionEndHandler}
			rightNav={rightNav}
		/>
	);
};

export default ArticleComponent;
