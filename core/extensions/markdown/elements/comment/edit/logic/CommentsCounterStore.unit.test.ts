/**
 * @jest-environment node
 */
jest.mock("@core-ui/hooks/useApi", () => ({
	RequestStatus: { Init: "init" },
	useApi: () => ({ call: jest.fn(), reset: jest.fn(), status: "init" }),
}));

jest.mock("@core-ui/hooks/usePlatform", () => ({
	usePlatform: () => ({ isNext: false, isStatic: false, isStaticCli: false }),
}));

jest.mock("@ext/git/actions/Revisions/logic/hooks/useIsRevision", () => ({
	useIsRevision: () => false,
}));

jest.mock("zustand", () => ({
	create: <TState>(init: (set: (partial: Partial<TState>) => void, get: () => TState) => TState) => {
		let state: TState;
		const set = (partial: Partial<TState>) => {
			state = { ...state, ...partial };
		};
		const get = () => state;
		state = init(set, get);

		const useStore = <TSelected>(selector: (state: TState) => TSelected) => selector(state);
		useStore.getState = () => state;

		return useStore;
	},
}));

import type { Signature } from "@ext/git/core/model/Signature";
import {
	type AuthoredCommentsByAuthor,
	setComments,
	useReviewerComments,
} from "@ext/markdown/elements/comment/edit/logic/stores/CommentsStore";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const authors: Signature[] = [
	{ name: "Reviewer One", email: "reviewer-one@example.com" },
	{ name: "Reviewer Two", email: "reviewer-two@example.com" },
	{ name: "Missing Reviewer", email: "missing@example.com" },
];

const comments: AuthoredCommentsByAuthor = {
	"reviewer-one@example.com": {
		total: 3,
		pathnames: {
			"/article-1": ["comment-1", "comment-2"],
			"/article-2": ["comment-3"],
		},
	},
	"reviewer-two@example.com": {
		total: 2,
		pathnames: {
			"/article-1": ["comment-4"],
			"/article-3": ["comment-5"],
		},
	},
	"other@example.com": {
		total: 1,
		pathnames: {
			"/article-1": ["comment-6"],
		},
	},
};

const renderReviewerComments = (props: Parameters<typeof useReviewerComments>[0]) => {
	let result: AuthoredCommentsByAuthor | undefined;

	const TestComponent = () => {
		result = useReviewerComments(props);
		return null;
	};

	renderToStaticMarkup(createElement(TestComponent));
	return result!;
};

describe("useReviewerComments", () => {
	beforeEach(() => {
		setComments({});
	});

	afterEach(() => {
		setComments({});
	});

	test("returns comments only for requested authors", () => {
		setComments(comments);

		const result = renderReviewerComments({ authors: authors.slice(0, 2) });

		expect(result).toEqual({
			"reviewer-one@example.com": comments["reviewer-one@example.com"],
			"reviewer-two@example.com": comments["reviewer-two@example.com"],
		});
	});

	test("returns empty comments for author without authored comments", () => {
		setComments(comments);

		const result = renderReviewerComments({ authors: [authors[2]] });

		expect(result).toEqual({
			"missing@example.com": { total: 0, pathnames: {} },
		});
	});

	test("filters comments by pathnames and recalculates total", () => {
		setComments(comments);

		const result = renderReviewerComments({ authors: authors.slice(0, 2), pathnames: ["/article-1", "/missing"] });

		expect(result).toEqual({
			"reviewer-one@example.com": {
				total: 2,
				pathnames: {
					"/article-1": ["comment-1", "comment-2"],
				},
			},
			"reviewer-two@example.com": {
				total: 1,
				pathnames: {
					"/article-1": ["comment-4"],
				},
			},
		});
	});

	test("returns empty result when pathnames do not contain author comments", () => {
		setComments(comments);

		const result = renderReviewerComments({ authors: authors.slice(0, 2), pathnames: ["/missing"] });

		expect(result).toEqual({
			"reviewer-one@example.com": { total: 0, pathnames: {} },
			"reviewer-two@example.com": { total: 0, pathnames: {} },
		});
	});
});
