import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import Mode from "@ext/git/actions/Clone/model/Mode";
import CloneFields from "@ext/git/actions/Source/components/CloneFields";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import type GitVerseSourceData from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceData";
import { useMakeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import { useMemo } from "react";

interface SelectGitVerseStorageDataFieldsProps {
	source: GitVerseSourceData;
	mode: Mode;
	onChange?: (data: GitStorageData) => void;
}

const SelectGitVerseStorageDataFields = (props: SelectGitVerseStorageDataFieldsProps) => {
	const { source, onChange, mode } = props;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const sourceApi = useMakeSourceApi(source, authServiceUrl) as GitSourceApi;
	const gitPaginatedProjectList = useMemo(() => new GitPaginatedProjectList(sourceApi), [sourceApi]);

	useWatch(async () => {
		if (mode !== Mode.init) return;
		const userData = await sourceApi.getUser();
		onChange?.({
			source,
			group: userData.username,
			name: null,
		});
	}, [mode]);

	if (mode === Mode.init) return null;

	return <CloneFields onChange={onChange} source={source} gitPaginatedProjectList={gitPaginatedProjectList} />;
};

export default SelectGitVerseStorageDataFields;
