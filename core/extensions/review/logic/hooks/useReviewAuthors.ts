import useGitCommitAuthors from "@ext/git/actions/Branch/components/useGitCommitAuthors";
import { useCallback } from "react";

type Author = {
	name: string;
	email: string;
};

export const useReviewAuthors = (): Author[] => {
	const { authors: gitCommitAuthors } = useGitCommitAuthors(true);

	const commentFilter = useCallback(
		(mail: string) => {
			return gitCommitAuthors.some((author) => author.email === mail);
		},
		[gitCommitAuthors],
	);

	return gitCommitAuthors.filter((author) => commentFilter(author.email));
};
