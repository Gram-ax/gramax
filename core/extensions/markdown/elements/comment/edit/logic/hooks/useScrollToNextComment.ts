import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { useCommentsByPathname } from "@ext/markdown/elements/comment/edit/logic/stores/CommentsStore";
import { useScrollToItem } from "@ext/review/logic/hooks/useScrollToItem";
import { resolveCommentDOMSelector } from "@ext/review/logic/utils/resolveCommentDOMSelector";
import { useCallback, useMemo } from "react";

const getDOMCommentIds = (): string[] => {
	const elements = document.querySelectorAll("[data-comment-id]");
	const ids: string[] = [];
	const seen = new Set<string>();

	for (const el of elements) {
		const id = el.getAttribute("data-comment-id");
		if (id && !seen.has(id)) {
			seen.add(id);
			ids.push(id);
		}
	}

	return ids;
};

export const useScrollToNextComment = (commentId: string) => {
	const onItemClick = useScrollToItem();
	const commentsByPathname = useCommentsByPathname();
	const currentPathname = ArticlePropsService.value?.pathname;

	const { prevItem, nextItem } = useMemo(() => {
		const domIds = getDOMCommentIds();
		const currentDomIndex = domIds.indexOf(commentId);

		const idToPathname = new Map<string, string>();
		for (const [pathname, articleComments] of Object.entries(commentsByPathname)) {
			for (const id of articleComments) {
				idToPathname.set(id, pathname);
			}
		}

		const makeItem = (id: string) => {
			const pathname = idToPathname.get(id) ?? currentPathname;
			return {
				type: "comments" as const,
				id,
				pathname,
				selector: resolveCommentDOMSelector(id),
				date: "",
				author: null,
				commentBlock: null,
			};
		};

		const pathnames = Object.keys(commentsByPathname);
		const currentPathnameIndex = pathnames.indexOf(currentPathname);

		const getNeighborPathnameItem = (offset: 1 | -1) => {
			const neighborPathname = pathnames[currentPathnameIndex + offset];
			if (!neighborPathname) return;

			const ids = commentsByPathname[neighborPathname];
			if (!ids?.length) return;

			return makeItem(offset === -1 ? ids[ids.length - 1] : ids[0]);
		};

		const prevItem =
			currentDomIndex > 0
				? makeItem(domIds[currentDomIndex - 1])
				: currentPathnameIndex > 0
					? getNeighborPathnameItem(-1)
					: null;

		const nextItem =
			currentDomIndex >= 0 && currentDomIndex < domIds.length - 1
				? makeItem(domIds[currentDomIndex + 1])
				: currentPathnameIndex >= 0 && currentPathnameIndex < pathnames.length - 1
					? getNeighborPathnameItem(1)
					: null;

		return { prevItem, nextItem };
	}, [commentId, commentsByPathname, currentPathname]);

	const nextScroll = useCallback(() => {
		if (nextItem) onItemClick(nextItem);
	}, [nextItem, onItemClick]);

	const prevScroll = useCallback(() => {
		if (prevItem) onItemClick(prevItem);
	}, [prevItem, onItemClick]);

	return { nextScroll: nextItem ? nextScroll : undefined, prevScroll: prevItem ? prevScroll : undefined };
};
