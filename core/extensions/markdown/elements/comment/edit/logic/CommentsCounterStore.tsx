import { useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type { Signature } from "@ext/git/core/model/Signature";
import UserInfo from "@ext/security/logic/User/UserInfo";
import { DependencyList, useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";

export type AuthoredComments = { total: number; pathnames: CommentsByArticle };

export type CommentsByArticle = { [pathname: string]: string[] };

export type AuthoredCommentsByAuthor = { [author: string]: AuthoredComments };

export type UseReviewerCommentsProps = { authors: Signature[] };

interface CommentsCounterProviderProps {
	children: React.ReactNode;
	deps: DependencyList;
}

interface CommentsCounterState {
	comments: AuthoredCommentsByAuthor;
	delete: (pathname: string, userInfo: UserInfo, deleteId: string) => void;
	add: (pathname: string, userInfo: UserInfo, newId: string) => void;
	set: (comments: AuthoredCommentsByAuthor) => void;
}

const useCommentsCounterStore = create<CommentsCounterState>((set, get) => ({
	comments: {},
	delete: (pathname: string, userInfo: UserInfo, deleteId: string) => {
		const { comments } = get();
		if (!comments[userInfo.mail]) return;

		const updatedComments = { ...comments };
		updatedComments[userInfo.mail] = { ...updatedComments[userInfo.mail] };
		updatedComments[userInfo.mail].total--;

		const withoutDeleteId = updatedComments[userInfo.mail].pathnames[pathname]?.filter((id) => id !== deleteId);
		if (!withoutDeleteId) return;

		updatedComments[userInfo.mail].pathnames = { ...updatedComments[userInfo.mail].pathnames };
		updatedComments[userInfo.mail].pathnames[pathname] = withoutDeleteId;
		if (withoutDeleteId.length === 0) delete updatedComments[userInfo.mail].pathnames[pathname];

		set({ comments: updatedComments });
	},
	add: (pathname: string, userInfo: UserInfo, newId: string) => {
		const { comments } = get();
		const updatedComments = { ...comments };

		if (!updatedComments[userInfo.mail]) {
			updatedComments[userInfo.mail] = { total: 0, pathnames: {} };
		} else {
			updatedComments[userInfo.mail] = { ...updatedComments[userInfo.mail] };
		}

		updatedComments[userInfo.mail].total++;
		updatedComments[userInfo.mail].pathnames = { ...updatedComments[userInfo.mail].pathnames };

		if (!updatedComments[userInfo.mail].pathnames[pathname]) {
			updatedComments[userInfo.mail].pathnames[pathname] = [];
		}

		updatedComments[userInfo.mail].pathnames[pathname] = [
			...updatedComments[userInfo.mail].pathnames[pathname],
			newId,
		];

		set({ comments: updatedComments });
	},
	set: (newComments: AuthoredCommentsByAuthor) => {
		set({ comments: newComments });
	},
}));

export const useComments = () => {
	return useCommentsCounterStore((state) => state.comments);
};

export const setComments = (comments: AuthoredCommentsByAuthor) => {
	return useCommentsCounterStore.getState().set(comments);
};

export const addComment = (pathname: string, userInfo: UserInfo, newId: string) => {
	return useCommentsCounterStore.getState().add(pathname, userInfo, newId);
};

export const deleteComment = (pathname: string, userInfo: UserInfo, deleteId: string) => {
	return useCommentsCounterStore.getState().delete(pathname, userInfo, deleteId);
};

export const useGetTotalCommentsByPathname = (pathname: string) => {
	const comments = useComments();

	return useMemo(() => {
		if (!pathname) return 0;
		let total = 0;

		Object.values(comments).forEach((authorComments: AuthoredComments) => {
			if (authorComments.pathnames[pathname]) {
				total += authorComments.pathnames[pathname].length;
			}
		});

		return total;
	}, [comments, pathname]);
};

export const useReviewerComments = ({ authors }: UseReviewerCommentsProps): AuthoredCommentsByAuthor => {
	const comments = useComments();

	return useMemo(
		() =>
			authors.reduce((acc, author) => {
				acc[author.email] = comments[author.email] || { total: 0, pathnames: {} };
				return acc;
			}, {} as AuthoredCommentsByAuthor),
		[authors, comments],
	);
};

export const CommentsCounterProvider = ({ children, deps }: CommentsCounterProviderProps) => {
	const { isNext, isStatic, isStaticCli } = usePlatform();
	const { call: getCommentsByAuthorsApi } = useApi<AuthoredCommentsByAuthor>({
		url: (api) => api.getCommentsByAuthors(),
		parse: "json",
	});

	const load = useCallback(async () => {
		const comments = (await getCommentsByAuthorsApi()) || {};
		setComments(comments);
	}, [getCommentsByAuthorsApi]);

	useEffect(() => {
		if (isNext || isStatic || isStaticCli) return;
		void load();
	}, deps);

	return children;
};
