import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import BranchUpdaterService, {
	type OnBranchUpdateListener,
} from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import SyncService, { type SyncServiceEvents } from "@ext/git/actions/Sync/logic/SyncService";
import { clearReviewStore, updatePathnameToTitle, useReviewStore } from "@ext/review/logic/store/ReviewStore";
import type { ReviewScope } from "@ext/review/models/ReviewList";
import type { ReviewSearchParams, ReviewSearchResult } from "@ext/review/models/ReviewSearchParams";
import { useCallback, useEffect, useRef, useState } from "react";

export const useReviewList = (path?: string, scope?: ReviewScope) => {
	const { setCatalogItems, setArticleItems, filters, searchQuery } = useReviewStore((s) => ({
		setCatalogItems: s.setCatalogItems,
		setArticleItems: s.setArticleItems,
		filters: s.filters,
		searchQuery: s.searchQuery,
	}));

	const [loading, setLoading] = useState(true);
	const isFirstLoad = useRef(true);

	const apiUrlCreator = ApiUrlCreator.value;
	const apiUrlCreatorRef = useRef(apiUrlCreator);
	apiUrlCreatorRef.current = apiUrlCreator;

	const paramsRef = useRef<ReviewSearchParams>({ filters, searchQuery, pathname: path });
	paramsRef.current = { filters, searchQuery, pathname: path };

	const scopeRef = useRef<ReviewScope>(scope);
	scopeRef.current = scope;

	const abortControllerRef = useRef<AbortController>();

	const fetchData = useCallback(() => {
		if (abortControllerRef.current) abortControllerRef.current.abort();
		abortControllerRef.current = new AbortController();

		void (async () => {
			const url = apiUrlCreatorRef.current.searchReviewItems();
			const body: ReviewSearchParams = {
				pathname: paramsRef.current.pathname,
				searchQuery: paramsRef.current.searchQuery,
				filters: paramsRef.current.filters,
			};

			if (isFirstLoad.current) setLoading(true);
			try {
				// adding delay to avoid flickering
				const [res] = await Promise.all([
					FetchService.fetch<ReviewSearchResult>(
						url,
						JSON.stringify(body),
						MimeTypes.json,
						Method.POST,
						true,
						undefined,
						abortControllerRef.current.signal,
					),
					!isFirstLoad.current ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, 150)),
				]);

				if (!res.ok) return;
				const data: ReviewSearchResult = await res.json();

				updatePathnameToTitle(data.articles);

				if (scopeRef.current === "article") setArticleItems(data.items);
				else setCatalogItems(data.items);
			} catch (error) {
				console.error(error);
			} finally {
				isFirstLoad.current = false;
				setLoading(false);
			}
		})();
		return () => abortControllerRef.current?.abort();
	}, [setCatalogItems, setArticleItems]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		const abort = fetchData();
		return () => abort();
	}, [filters, searchQuery, path, scope]);

	useEffect(() => {
		const handleReset = () => {
			isFirstLoad.current = true;
			clearReviewStore();
			fetchData();
		};

		const handleSyncFinish: SyncServiceEvents["finish"] = ({ syncData }) => {
			if (!syncData.isVersionChanged) return;
			handleReset();
		};

		const handleBranchUpdate: OnBranchUpdateListener = (_, caller) => {
			if (caller !== OnBranchUpdateCaller.Checkout) return;
			handleReset();
		};

		const syncToken = SyncService.events.on("finish", handleSyncFinish);
		BranchUpdaterService.addListener(handleBranchUpdate);

		return () => {
			SyncService.events.off(syncToken);
			BranchUpdaterService.removeListener(handleBranchUpdate);
		};
	}, [fetchData]);

	return { isLoading: loading };
};
