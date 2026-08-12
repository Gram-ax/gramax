import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { ReviewFilters } from "@ext/review/components/Filters/ReviewFilters";
import { ReviewItemSearcher } from "@ext/review/components/ReviewItemSearcher";
import { ReviewItemsList } from "@ext/review/components/ReviewItemsList";
import { ReviewListHeader } from "@ext/review/components/ReviewListHeader";
import { ReviewOptions } from "@ext/review/components/ReviewOptions";
import { ReviewScopeSwitcher } from "@ext/review/components/ReviewScopeSwitcher";
import { ReviewSorting } from "@ext/review/components/Sorting/ReviewSorting";
import { useReviewList } from "@ext/review/logic/hooks/useReviewList";
import { useScopedItems } from "@ext/review/logic/hooks/useScopedItems";
import { useReviewStore } from "@ext/review/logic/store/ReviewStore";
import { useRef } from "react";

export const ReviewList = () => {
	const articlePathname = useArticlePropsStore((state) => state.data?.pathname);
	const tabRef = useRef<HTMLDivElement>(null);
	const { currentScope, setCurrentScope } = useReviewStore((s) => ({
		currentScope: s.currentScope,
		setCurrentScope: s.setCurrentScope,
	}));

	const { isLoading: isCatalogLoading } = useReviewList(undefined, "catalog");
	const { isLoading: isArticleLoading } = useReviewList(articlePathname, "article");

	const scopedCatalogData = useScopedItems("catalog");
	const scopedArticleData = useScopedItems("article");

	return (
		<div
			className="flex flex-col overflow-hidden flex-1 mt-auto border-l border-t border-secondary-border ml-[-2rem] mr-[-1.2rem] my-4 -mb-8 pt-4 bg-secondary-bg max-h-[60dvh] h-[60dvh] shrink-0"
			ref={tabRef}
		>
			<div
				className="editor-mode-menu flex flex-col overflow-hidden min-h-0 flex-1"
				data-testid="editor-mode-menu"
			>
				<ReviewListHeader count={scopedCatalogData.count} unreadCount={scopedCatalogData.unreadCount} />
				<div className="flex flex-col overflow-hidden min-h-0 flex-1">
					<ReviewItemSearcher />
					<div className="flex items-center px-3">
						<ReviewScopeSwitcher
							articleScopeData={scopedArticleData}
							catalogScopeData={scopedCatalogData}
							onChange={setCurrentScope}
							scope={currentScope}
						/>
						<ReviewSorting />
						<ReviewFilters tabRef={tabRef} />
						<ReviewOptions scope={currentScope} />
					</div>
					{currentScope === "catalog" && (
						<ReviewItemsList data={scopedCatalogData} isLoading={isCatalogLoading} />
					)}
					{currentScope === "article" && (
						<ReviewItemsList data={scopedArticleData} isLoading={isArticleLoading} />
					)}
				</div>
			</div>
		</div>
	);
};
