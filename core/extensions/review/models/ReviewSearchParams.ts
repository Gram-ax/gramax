import type { ReviewListItem } from "@ext/review/models/ReviewList";

export type ReviewSearchParams = {
	searchQuery?: string;
	pathname?: string;
	filters?: {
		authors?: string[];
		afterDate?: string;
		beforeDate?: string;
	};
};

export type ReviewSearchResult = {
	items: ReviewListItem[];
	articles: { [pathname: string]: string };
};
