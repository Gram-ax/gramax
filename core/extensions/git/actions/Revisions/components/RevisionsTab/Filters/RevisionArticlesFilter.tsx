import { useRouter } from "@core/Api/useRouter";
import type { RevisionArticleFilter } from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import t from "@ext/localization/locale/translate";
import { Divider } from "@ui-kit/Divider";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { Tag } from "@ui-kit/Tag";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useCallback } from "react";

interface RevisionArticlesFilterProps {
	articles: RevisionArticleFilter[];
	onChange: (articles: RevisionArticleFilter[]) => void;
}

export const RevisionArticlesFilter = ({ articles, onChange }: RevisionArticlesFilterProps) => {
	const router = useRouter();

	const redirectToPathname = useCallback(
		(pathname: string) => {
			router.pushPath(pathname);
		},
		[router],
	);

	const onClear = useCallback(
		(article: RevisionArticleFilter) => {
			const existing = articles?.find((a) => a.path === article.path);
			const newArticles = existing
				? articles?.filter((a) => a.path !== article.path)
				: [...(articles || []), article];
			onChange(newArticles.length ? newArticles : null);
		},
		[articles, onChange],
	);

	if (!articles?.length) return;

	return (
		<>
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<span className="text-xs font-normal uppercase text-muted tracking-wide">
						{t("git.history.filters.articles.title")}
					</span>
				</div>
				<ScrollShadowContainer className="max-h-36 space-y-0.5 [&>div]:flex [&>div]:items-center [&>div]:gap-1 [&>div]:flex-wrap">
					{articles.map((article) => {
						return (
							<Tag
								containerClassName="w-auto"
								key={article.path}
								onClose={() => onClear(article)}
								onLabelClick={() => redirectToPathname(article.pathname)}
								size="sm"
							>
								<TextOverflowTooltip>{article.name}</TextOverflowTooltip>
							</Tag>
						);
					})}
				</ScrollShadowContainer>
			</div>
			<Divider />
		</>
	);
};
