import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import {
	DiffItemContentData,
	DiffItemContentScope,
} from "@ext/git/core/GitDiffItemCreator/DiffItemContent/DiffItemContent";
import { useCallback } from "react";

interface UseFetchDiffDataProps {
	isAdded: boolean;
	isDeleted: boolean;
	scope: DiffItemContentScope;
	oldScope: DiffItemContentScope;
	newPath: string;
	oldPath: string;
	isResource?: boolean;
}

const useFetchDiffData = (props: UseFetchDiffDataProps) => {
	const scope = props.scope || "workdir";
	const oldScope = props.oldScope || "HEAD";
	const { isAdded, isDeleted, newPath, oldPath, isResource } = props;

	const apiUrlCreator = ApiUrlCreatorService.value;

	return useCallback(
		async (onlyNew: boolean) => {
			const fetchContent = async (scope: DiffItemContentScope, filePath: string) => {
				const url = apiUrlCreator.getVersionControlDiffItemContentUrl(scope, filePath, isResource);
				const res = await FetchService.fetch<DiffItemContentData>(url);
				if (!res.ok) return;
				return res.json();
			};

			let data: { oldData: DiffItemContentData; newData: DiffItemContentData };
			if (isAdded) {
				data = { newData: await fetchContent(scope, newPath), oldData: null };
			} else if (isDeleted) {
				data = { newData: null, oldData: await fetchContent(oldScope, newPath) };
			} else {
				const [newData, oldData] = await Promise.all([
					fetchContent(scope, newPath),
					onlyNew ? null : fetchContent(oldScope, oldPath),
				]);
				data = { newData, oldData };
			}

			return data;
		},
		[apiUrlCreator],
	);
};

export default useFetchDiffData;
