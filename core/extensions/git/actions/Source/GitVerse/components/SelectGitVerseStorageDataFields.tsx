import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import Mode from "@ext/git/actions/Clone/model/Mode";
import CloneFields from "@ext/git/actions/Source/components/CloneFields";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import type GitVerseSourceData from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceData";
import { useMakeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";

interface SelectGitVerseStorageDataFieldsProps {
	source: GitVerseSourceData;
	mode?: "init" | "clone";
	form: UseFormReturn<SelectFormSchemaType>;
}

const SelectGitVerseStorageDataFields = (props: SelectGitVerseStorageDataFieldsProps) => {
	const { source, mode, form } = props;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const sourceApi = useMakeSourceApi(source, authServiceUrl) as GitSourceApi;
	const gitPaginatedProjectList = useMemo(() => new GitPaginatedProjectList(sourceApi), [sourceApi]);

	// useWatch(async () => {
	// 	if (mode !== Mode.init) return;
	// 	const userData = await sourceApi.getUser();
	// 	onChange?.({
	// 		source,
	// 		group: userData.username,
	// 		name: null,
	// 	});
	// }, [mode]);

	if (mode === Mode.init) return null;

	// return <CloneFields form={form} source={source} gitPaginatedProjectList={gitPaginatedProjectList} />;
};

export default SelectGitVerseStorageDataFields;
