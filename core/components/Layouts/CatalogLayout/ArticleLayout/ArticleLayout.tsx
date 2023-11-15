import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@mui/material";

interface Props {
	isRightNavPin: boolean;
	isRightNavOpen: boolean;
	article: JSX.Element;
	rightNav: JSX.Element;
	onArticleMouseEnter?: () => void;
	onArticleMouseLeave?: () => void;
	onRightNavMouseEnter?: () => void;
	onRightNavMouseLeave?: () => void;
}

const Component = ({
	article,
	rightNav,
	onArticleMouseEnter,
	onArticleMouseLeave,
	onRightNavMouseEnter,
	onRightNavMouseLeave,
	className,
}: Props & { className?: string }) => {
	const articleRef = ArticleRefService.value;
	return (
		<div className={`${className} article`}>
			<div
				className="article-content-wrapper"
				onMouseEnter={onArticleMouseEnter}
				onMouseLeave={onArticleMouseLeave}
				onTouchEnd={onArticleMouseEnter}
			>
				<div data-qa="article-content" ref={articleRef} className="article-content">
					{article}
				</div>
			</div>
			<div
				className="right-nav-layout"
				onMouseEnter={onRightNavMouseEnter}
				onMouseLeave={onRightNavMouseLeave}
				onTouchEnd={onRightNavMouseEnter}
			>
				{rightNav}
			</div>
		</div>
	);
};

const ArticleDesctopLayout = styled(Component)`
	flex: 1;
	display: flex;
	overflow: auto;
	justify-content: center;
	background: var(--color-article-bg);
	${(p) => (p.isRightNavPin ? "" : "margin-right: 20px;")}

	.article-content-wrapper {
		height: 100vh;
		display: flex;
		padding: 30px;
		padding-bottom: 0;
		justify-content: center;
		width: calc(100% - 260px);
		color: var(--color-article-text);
		${(p) => (p.isRightNavPin ? "" : "padding-left: 45px;")}
	}

	.article-content {
		width: 100%;
		display: flex;
		min-width: 0px;
		max-width: 780px;
		height: fit-content;
		min-height: 100%;
		flex-direction: column;
	}

	.right-nav-layout {
		--transition-time: 0.3s;
		transition: var(--navigation-transition);

		${(p) =>
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
                `}

		${(p) =>
			!p.isRightNavPin && p.isRightNavOpen
				? `
        transform: translateX(0);
        box-shadow: var(--shadows-deeplight);
                `
				: ``}
	}

	@media print {
		margin-right: 0px;
		background: #fff;

		.article-content-wrapper {
			width: 100% !important;
			padding-left: 30px;
		}
	}
`;

const ArticleNarrowLayout = styled(Component)`
	display: flex;
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
		max-width: 780px;
		height: fit-content;
		min-height: 100%;
		flex-direction: column;
	}

	.right-nav-layout {
		top: 0;
		right: 0;

		position: fixed;
		--transition-time: 0.3s;
		transition: var(--navigation-transition);

		${(p) =>
			p.isRightNavPin
				? `z-index: 1000; transform: translateX(0px);`
				: `transform: translateX(calc(var(--narrow-nav-width) - 20px));`}

		${(p) =>
			!p.isRightNavPin && p.isRightNavOpen
				? `transform: translateX(0); box-shadow: var(--shadows-deeplight);`
				: ``}
	}

	${cssMedia.narrow} {
		.article-content-wrapper {
			padding: 80px 50px 0 20px;
		}
	}
`;

const ArticleLayout = (props: Props) => {
	const narrowMedia = useMediaQuery(cssMedia.JSmedium);
	if (narrowMedia) return <ArticleNarrowLayout {...props} />;
	return <ArticleDesctopLayout {...props} />;
};

export default ArticleLayout;
