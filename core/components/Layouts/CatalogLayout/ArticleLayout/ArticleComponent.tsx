import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useMediaQuery } from "@mui/material";
import { useRef, useState } from "react";
import ArticleLayout from "./ArticleLayout";

export interface ArticleComponentProps {
	article: JSX.Element;
	rightNav: JSX.Element;
	delay?: number;
}

const ArticleComponent = (props: ArticleComponentProps) => {
	const { article, rightNav, delay } = props;
	const isSidebarsPin = SidebarsIsPinService.value;
	const [isRightNavOpen, setIsRightNavOpen] = useState(false);
	const isRightNavHover = useRef(false);

	const onArticleMouseEnterHandler = () => {
		if (isSidebarsPin) return;
		setIsRightNavOpen(false);
		LeftNavigationIsOpenService.value = false;
	};

	const onRightNavMouseEnterHandler = () => {
		setTimeout(() => {
			if (isRightNavHover.current && !isSidebarsPin) {
				setIsRightNavOpen(true);
			}
		}, delay);
	};

	const RightNav = (
		<div
			onMouseEnter={() => (isRightNavHover.current = true)}
			onMouseLeave={() => (isRightNavHover.current = false)}
		>
			{rightNav}
		</div>
	);

	return (
		<ArticleLayout
			article={article}
			isRightNavPin={isSidebarsPin}
			isRightNavOpen={isRightNavOpen}
			narrowMedia={useMediaQuery(cssMedia.JSmedium)}
			onArticleMouseEnter={onArticleMouseEnterHandler}
			onRightNavMouseEnter={onRightNavMouseEnterHandler}
			rightNav={RightNav}
		/>
	);
};

export default ArticleComponent;
