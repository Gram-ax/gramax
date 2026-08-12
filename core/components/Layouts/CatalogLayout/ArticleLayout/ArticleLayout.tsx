import { RIGHT_NAV_CLASS } from "@app/config/const";
import { ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE } from "@components/Layouts/CatalogLayout/ArticleLayout/consts";
import { classNames } from "@components/libs/classNames";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import type { SwipeHandlers } from "@core-ui/hooks/useSidebarSwipe";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
// biome-ignore lint/style/noRestrictedImports: needs
import styled from "@emotion/styled";
import { ArticleBreadcrumbDiffLine } from "@ext/git/core/Diff/components/ArticleBreadcrumbDiffLine";
import { PAGE_WIDTH_PDF } from "@ext/print/const";
import { useEffect } from "react";

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
	rightNavOpenSwipeHandlers?: SwipeHandlers;
	rightNavCloseSwipeHandlers?: SwipeHandlers;
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
		rightNavOpenSwipeHandlers,
		rightNavCloseSwipeHandlers,
		useArticleDefaultStyles,
		className,
	} = props;
	const breakpoint = useBreakpoint();

	const isMobile = breakpoint === "sm";

	useEffect(() => {
		const articleContentWrapper = articleRef.current?.firstElementChild as HTMLDivElement;
		if (!articleContentWrapper) return;

		const observer = new ResizeObserver(([entry]) => {
			articleContentWrapper.style.setProperty(
				ARTICLE_CONTENT_WRAPPER_WIDTH_ATTRIBUTE,
				`${entry.contentRect.width}px`,
			);
		});

		observer.observe(articleContentWrapper);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			className={classNames(className, { article: useArticleDefaultStyles })}
			data-testid="article-scroll-container"
			onTransitionEnd={onRightNavTransitionEnd}
			ref={articleRef}
			tabIndex={-1}
		>
			<div
				className={cn("article-content-wrapper", isMobile && "article-mobile")}
				id="article"
				onMouseEnter={onArticleMouseEnter}
				onMouseLeave={onArticleMouseLeave}
				onTouchEnd={onArticleMouseEnter}
			>
				<div className={classNames("article-content", { "article-default-content": useArticleDefaultStyles })}>
					{article}
				</div>
				<ArticleBreadcrumbDiffLine />
			</div>
			<div className={classNames("article", {}, [RIGHT_NAV_CLASS])} {...rightNavCloseSwipeHandlers}>
				<div style={{ height: "inherit" }}>{rightNav}</div>
			</div>
			{props.narrowMedia && !props.isRightNavPin && !props.isRightNavOpen && (
				<div aria-hidden className="right-nav-swipe-zone" {...rightNavOpenSwipeHandlers} />
			)}
		</div>
	);
};

export default styled(ArticleLayout)`
	&:focus {
		outline: none;
	}

	.right-nav-layout {
		${(p) => !p.isRightNavPin && `z-index: var(--z-index-nav-layout);`}
		height: 100%;
		touch-action: pan-y;
	}

	.right-nav-swipe-zone {
		display: none;
	}

	${(p) =>
		p.narrowMedia
			? `display: flex;
	max-width: 100%;
	min-width: 100%;
	position: relative;
	flex-direction: row;
	overflow: hidden auto;
	overflow-anchor: none;
	background: var(--color-article-bg);

	.article-content-wrapper {
		height: 100vh;
		min-width: 100%;
		padding: 20px 40px 0px 50px;
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
				: `transform: translateX(var(--narrow-nav-width));`
		}

		${!p.isRightNavPin && p.isRightNavOpen ? `transform: translateX(0); box-shadow: var(--shadows-deeplight);` : ``}
	}

	.right-nav-swipe-zone {
		display: block;
		position: fixed;
		top: 0;
		right: 0;
		width: 1.5rem;
		height: 100dvh;
		z-index: var(--z-index-nav-layout);
		touch-action: pan-y;
	}

	${cssMedia.narrow} {
		.article-content-wrapper {
			padding: 3.5rem 1.25rem 0;
		}

		.article-content-wrapper {
			height: fit-content;
			min-height: 100dvh;
			min-height: -webkit-fill-available;
		}

		.article-content {
			height: unset;
			min-height: fit-content;
		}
	}`
			: `
	flex: 1;
	display: flex;
	overflow-y: auto;
	overflow-x: hidden;
	overflow-anchor: none;
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
		${!p.useArticleDefaultStyles ? "" : p.isRightNavPin ? "" : `padding-left: calc(var(--left-navigation-content-padding-right) + 30px);`}
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

	`}

	@media print {
		margin-right: 0px;
		background: #fff;

		.article-content-wrapper {
			height: auto;
			padding-top: 0;
			padding-left: 30px;
			width: 100% !important;
		}

		.article-content {
			height: auto ;
		}

		.article-default-content {
			min-width: ${PAGE_WIDTH_PDF}px !important;
			height: auto ;
		}
	}
	${(p) => p.additionalStyles ?? ""}
`;
