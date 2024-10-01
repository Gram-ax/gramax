import { RIGHT_NAV_CLASS } from "@app/config/const";
import { classNames } from "@components/libs/classNames";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";

export interface ArticleLayoutProps {
	article: JSX.Element;
	rightNav: JSX.Element;
	narrowMedia: boolean;
	isRightNavPin: boolean;
	isRightNavOpen: boolean;
	onArticleMouseEnter?: () => void;
	onArticleMouseLeave?: () => void;
	onRightNavMouseEnter?: () => void;
	onRightNavMouseLeave?: () => void;
	className?: string;
}

const ArticleLayout = (props: ArticleLayoutProps) => {
	const articleRef = ArticleRefService.value;
	const useArticleDefaultStyles = ArticleViewService.useArticleDefaultStyles;

	const {
		article,
		rightNav,
		onArticleMouseEnter,
		onArticleMouseLeave,
		onRightNavMouseEnter,
		onRightNavMouseLeave,
		className,
	} = props;

	return (
		<div className={classNames(className, { article: useArticleDefaultStyles })} ref={articleRef}>
			<div
				className="article-content-wrapper"
				onMouseEnter={onArticleMouseEnter}
				onMouseLeave={onArticleMouseLeave}
				onTouchEnd={onArticleMouseEnter}
			>
				<div className="article-content">{article}</div>
			</div>
			<div
				className={classNames("article", {}, [RIGHT_NAV_CLASS])}
				onMouseEnter={onRightNavMouseEnter}
				onMouseLeave={onRightNavMouseLeave}
				onTouchEnd={onRightNavMouseEnter}
			>
				{rightNav}
			</div>
		</div>
	);
};

export default styled(ArticleLayout)`
	.right-nav-layout {
		z-index: var(--z-index-nav-layout);
		height: 100%;
	}

	${(p) =>
		p.narrowMedia
			? `display: flex;
	max-width: 100%;
	min-width: 100%;
	position: relative;
	flex-direction: row;
	overflow: hidden auto;
	background: var(--color-article-bg);

	.article-content-wrapper {
		height: 100vh;
		min-width: 100%;
		padding: 20px 40px 0px 50px;
		color: var(--color-article-text);
	}

	.article-content {
		width: 100%;
		display: flex;
		min-width: 0px;
		max-width: var(--article-max-width);
		height: 100%;
		min-height: 100%;
		flex-direction: column;
	}

	.right-nav-layout {
		top: 0;
		right: 0;

		position: fixed;
		--transition-time: 0.3s;
		transition: var(--navigation-transition);

		${
			p.isRightNavPin
				? `z-index: 1000; transform: translateX(0px);`
				: `transform: translateX(calc(var(--narrow-nav-width) - 20px));`
		}

		${!p.isRightNavPin && p.isRightNavOpen ? `transform: translateX(0); box-shadow: var(--shadows-deeplight);` : ``}
	}

	${cssMedia.narrow} {
		.article-content-wrapper {
			padding: 80px 50px 0 20px;
		}
	}`
			: `
	flex: 1;
	display: flex;
	overflow-y: auto;
	overflow-x: hidden;
	justify-content: center;
	background: var(--color-article-bg);
	${p.isRightNavPin ? "" : "margin-right: 20px;"}

	.article-content-wrapper {
		height: 100vh;
		display: flex;
		padding: 30px;
		padding-bottom: 0;
		justify-content: center;
		width: calc(100% - 260px);
		color: var(--color-article-text);
		${p.isRightNavPin ? "" : "padding-left: 45px;"}
	}

	.article-content {
		width: 100%;
		display: flex;
		min-width: 0px;
		max-width: var(--article-max-width);
		height: 100%;
		min-height: 100%;
		flex-direction: column;
	}

	.right-nav-layout {
		--transition-time: 0.3s;
		transition: var(--navigation-transition);

		${
			p.isRightNavPin
				? `
		top: 0;
		position: sticky;
		transform: translateX(0px);
                `
				: `
                position: absolute;
                right: 0px;
                transform: translateX(calc(var(--narrow-nav-width) - 20px));
                `
		}

		${
			!p.isRightNavPin && p.isRightNavOpen
				? `
        transform: translateX(0);
        box-shadow: var(--shadows-deeplight);
                `
				: ``
		}
	}

	@media print {
		margin-right: 0px;
		background: #fff;

		.article-content-wrapper {
			width: 100% !important;
			padding-left: 30px;
		}
	}
	`}
`;
