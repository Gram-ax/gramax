import ArticlePageActions from "@components/Article/ArticlePageActions";
import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import IconLink from "@components/Molecules/IconLink";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { getCatalogLinks, useGetArticleLinks } from "@core-ui/getRigthSidebarLinks";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cn } from "@core-ui/utils/cn";
import { CatalogView } from "@ext/catalog/views/components/CatalogView";
import SwitchContentLanguage from "@ext/localization/actions/SwitchContentLanguage";
import t from "@ext/localization/locale/translate";
import TableOfContents from "@ext/navigation/article/render/TableOfContents";
import { QuizNavigationInfo } from "@ext/quiz/components/QuizNavigationInfo";
import { ReviewList } from "@ext/review/components/ReviewList";
import { useReviewListControl } from "@ext/review/logic/hooks/useReviewListControl";
import PublishStatusPanel from "@ext/static/components/PublishStatusPanel";
import SwitchVersion from "@ext/versioning/components/SwitchVersion";
import { useRef } from "react";
import { tv } from "tailwind-variants";
import Links from "../../layoutComponents";

const asideStyles = tv({
	base: "w-full text-[var(--color-primary-general)] bg-[var(--color-right-nav-bg)]",
});

const gramaxLinkStyles = tv({
	base: "w-full flex justify-end items-end flex-1 mt-[2em]",
});

const gramaxLinkTextStyles = tv({
	base: "opacity-60 hover:opacity-100",
});

const RightNavigation = (): JSX.Element => {
	const ref = useRef<HTMLDivElement>(null);
	const articleProps = ArticlePropsService.value;
	const showArticleActions = !(articleProps?.errorCode && articleProps.errorCode !== 500);
	const articleLinks = useGetArticleLinks();
	const { isNext } = usePlatform();
	const cloudServiceUrl = PageDataContextService.value.conf.cloudServiceUrl;
	const showReview = useReviewListControl();

	return (
		<div
			className="article-right-sidebar"
			ref={ref}
			style={{ display: "flex", flexDirection: "column", flexGrow: "1", maxHeight: "100%" }}
		>
			<aside className={asideStyles()}>
				<div className="space-y-4">
					<ArticlePageActions />
					<SwitchVersion />
					<SwitchContentLanguage />
					<CatalogView />
				</div>
				{showArticleActions && (
					<TableOfContents className={cn(showReview ? "max-h-[20dvh] overflow-y-auto" : "")} />
				)}
				<Links articleLinks={articleLinks} catalogLinks={getCatalogLinks()} />
				{cloudServiceUrl && <PublishStatusPanel />}
				<QuizNavigationInfo />
			</aside>
			{showReview && <ReviewList />}
			{isNext && (
				<div className={gramaxLinkStyles()}>
					<Button buttonStyle={ButtonStyle.transparent} textSize={TextSize.XS}>
						<IconLink
							className={gramaxLinkTextStyles()}
							href={"https://gram.ax/"}
							isExternal
							text={t("created-in-gramax")}
						/>
					</Button>
				</div>
			)}
		</div>
	);
};

export default RightNavigation;
