import { RIGHT_NAV_CLASS } from "@app/config/const";
import { classNames } from "@components/libs/classNames";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";

export interface ArticleLayoutProps {
	article: JSX.Element;
	rightNav: JSX.Element;
	narrowMedia: boolean;
	isRightNavPin: boolean;
	isRightNavOpen: boolean;
	useArticleDefaultStyles: boolean;
	additionalStyles?: string;
	onArticleMouseEnter?: () => void;
	onArticleMouseLeave?: () => void;
	onRightNavTransitionEnd?: () => void;
	className?: string;
}

const ArticleLayout = (props: ArticleLayoutProps) => {
	const articleRef = ArticleRefService.value;

	const {
		article,
		rightNav,
		onArticleMouseEnter,
		onArticleMouseLeave,
		onRightNavTransitionEnd,
		useArticleDefaultStyles,
		className,
	} = props;

	return (
		<div
			className={classNames(className, { article: useArticleDefaultStyles })}
			ref={articleRef}
			onTransitionEnd={onRightNavTransitionEnd}
		>
			<div
				id="article"
				className="article-content-wrapper"
				onMouseEnter={onArticleMouseEnter}
				onMouseLeave={onArticleMouseLeave}
				onTouchEnd={onArticleMouseEnter}
			>
				<div className={classNames("article-content", { "article-default-content": useArticleDefaultStyles })}>
					{article}
				</div>
			</div>
			<div className={classNames("article", {}, [RIGHT_NAV_CLASS])}>
				<div style={{ height: "inherit" }}>{rightNav}</div>
			</div>
		</div>
	);
};

export default styled(ArticleLayout)`
	.right-nav-layout {
		${(p) => !p.isRightNavPin && `z-index: var(--z-index-nav-layout);`}
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
				? `z-index: var(--z-index-popover); transform: translateX(0px);`
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
		position: relative;
		height: 100vh;
		display: flex;
		${p.useArticleDefaultStyles ? "padding: 30px;" : ""}
		padding-bottom: 0;
		justify-content: center;
		width: ${p.isRightNavPin ? "calc(100% - var(--narrow-nav-width))" : "100%"};
		color: var(--color-article-text);
		${!p.useArticleDefaultStyles ? "" : p.isRightNavPin ? "" : `padding-left: var(--article-wrapper-padding-left);`}
	}

	.article-content{
		width: 100%;
		height: 100%;
	}

	.article-default-content {
		display: flex;
		min-width: 0px;
		max-width: var(--article-max-width);
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

	${(p) => p.additionalStyles ?? ""}
`;
