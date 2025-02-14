import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import type { CommitAuthorInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { useEffect, useState } from "react";

export type UseGitCommitAuthors = {
	authors: CommitAuthorInfo[];
};

const useGitCommitAuthors = (shouldFetch: boolean) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [authors, setAuthors] = useState<CommitAuthorInfo[]>([]);

	useEffect(() => {
		if (!shouldFetch || authors.length > 0) return;

		const fetchAuthors = async () => {
			const url = apiUrlCreator.getGitCommitAuthors();
			const response = await FetchService.fetch<CommitAuthorInfo[]>(url);
			const data = await response.json();

			setAuthors(data?.sort((a, b) => b.count - a.count) || []);
		};

		void fetchAuthors();
	}, [shouldFetch]);

	return { authors: authors || [] };
};

export default useGitCommitAuthors;
