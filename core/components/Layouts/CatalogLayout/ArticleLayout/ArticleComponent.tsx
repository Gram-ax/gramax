import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import { useRef, useState } from "react";
import ArticleLayout from "./ArticleLayout";

const ArticleComponent = ({
	article,
	rightNav,
	delay,
}: {
	article: JSX.Element;
	rightNav: JSX.Element;
	delay?: number;
}) => {
	const isSidebarsPin = SidebarsIsPinService.value;
	const [isRightNavOpen, setIsRightNavOpen] = useState(false);
	const isRightNavHover = useRef(false);

	return (
		<ArticleLayout
			article={article}
			rightNav={
				<div
					onMouseEnter={() => (isRightNavHover.current = true)}
					onMouseLeave={() => (isRightNavHover.current = false)}
				>
					{rightNav}
				</div>
			}
			isRightNavPin={isSidebarsPin}
			isRightNavOpen={isRightNavOpen}
			onArticleMouseEnter={() => {
				if (isSidebarsPin) return;
				setIsRightNavOpen(false);
				LeftNavigationIsOpenService.value = false;
			}}
			onRightNavMouseEnter={() => {
				setTimeout(() => {
					if (isRightNavHover.current) {
						if (!isSidebarsPin) setIsRightNavOpen(true);
					}
				}, delay);
			}}
		/>
	);
};

export default ArticleComponent;
