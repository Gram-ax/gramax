import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import type { Signature } from "@ext/git/core/model/Signature";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import { type DependencyList, useEffect, useMemo } from "react";
import { create } from "zustand";

export type AuthoredComments = { total: number; pathnames: CommentsByArticle };

export type CommentsByArticle = { [pathname: string]: string[] };

export type AuthoredCommentsByAuthor = { [author: string]: AuthoredComments };

export type UseReviewerCommentsProps = { authors: Signature[]; pathnames?: string[] };

interface CommentsProviderProps {
	children: React.ReactNode;
	deps?: DependencyList;
}

interface CommentsState {
	comments: AuthoredCommentsByAuthor;
	delete: (pathname: string, userInfo: UserInfo, deleteId: string) => void;
	add: (pathname: string, userInfo: UserInfo, newId: string, title?: string) => void;
	set: (comments: AuthoredCommentsByAuthor) => void;
}

const useCommentsStore = create<CommentsState>((set, get) => ({
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

		updatedComments[userInfo.mail].pathnames = { ...updatedComments[userInfo.mail].pathnames };

		if (!updatedComments[userInfo.mail].pathnames[pathname]) {
			updatedComments[userInfo.mail].pathnames[pathname] = [];
		}
		if (!updatedComments[userInfo.mail].pathnames[pathname].includes(newId)) {
			updatedComments[userInfo.mail].total++;
			updatedComments[userInfo.mail].pathnames[pathname] = [
				...updatedComments[userInfo.mail].pathnames[pathname],
				newId,
			];
		}

		set({ comments: updatedComments });
	},
	set: (newComments: AuthoredCommentsByAuthor) => {
		set({ comments: newComments });
	},
}));

export const useComments = () => {
	return useCommentsStore((state) => state.comments);
};

export const setComments = (comments: AuthoredCommentsByAuthor) => {
	return useCommentsStore.getState().set(comments);
};

export const addComment = (pathname: string, userInfo: UserInfo, newId: string, title?: string) => {
	return useCommentsStore.getState().add(pathname, userInfo, newId, title);
};

export const deleteComment = (pathname: string, userInfo: UserInfo, deleteId: string) => {
	return useCommentsStore.getState().delete(pathname, userInfo, deleteId);
};

export const useCommentsByPathname = (): CommentsByArticle => {
	const comments = useComments();

	return useMemo(() => {
		const result: CommentsByArticle = {};

		Object.values(comments).forEach((authorComments: AuthoredComments) => {
			for (const [pathname, articleComments] of Object.entries(authorComments.pathnames)) {
				if (!result[pathname]) {
					result[pathname] = [];
				}

				for (const id of articleComments) {
					if (!result[pathname].includes(id)) {
						result[pathname].push(id);
					}
				}
			}
		});

		return result;
	}, [comments]);
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

export const useReviewerComments = ({ authors, pathnames }: UseReviewerCommentsProps): AuthoredCommentsByAuthor => {
	const comments = useComments();

	return useMemo(
		() =>
			authors.reduce((acc, author) => {
				const authorComments = comments[author.email] || { total: 0, pathnames: {} };
				if (!pathnames) {
					acc[author.email] = authorComments;
					return acc;
				}

				const filteredComments = pathnames.reduce(
					(filtered, pathname) => {
						const commentIds = authorComments.pathnames[pathname];
						if (!commentIds?.length) return filtered;

						filtered.pathnames[pathname] = commentIds;
						filtered.total += commentIds.length;
						return filtered;
					},
					{ total: 0, pathnames: {} } as AuthoredComments,
				);

				acc[author.email] = filteredComments;
				return acc;
			}, {} as AuthoredCommentsByAuthor),
		[authors, comments, pathnames],
	);
};

export const CommentsCounterProvider = ({ children, deps = [] }: CommentsProviderProps) => {
	const { isNext, isStatic, isStaticCli } = usePlatform();
	const isRevision = useIsRevision();
	const skip = isNext || isStatic || isStaticCli || isRevision;

	const { call, status, reset } = useApi<AuthoredCommentsByAuthor>({
		url: (api) => api.getCommentsByAuthors(),
		parse: "json",
		onDone: (data) => setComments(data || {}),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: only deps trigger refetch; status/reset/call are read but must not retrigger
	useEffect(() => {
		if (skip) return;
		if (status !== RequestStatus.Init) return;
		reset();
		void call();
	}, [skip, ...deps]);

	return children;
};
