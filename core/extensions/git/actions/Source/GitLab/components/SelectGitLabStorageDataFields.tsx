import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { useMemo } from "react";
import GitStorageData from "../../../../core/model/GitStorageData";
import CloneFields from "../../components/CloneFields";
import ConnectFields from "./ConnectFields";
import Mode from "@ext/git/actions/Clone/model/Mode";

interface SelectGitLabStorageDataFieldsProps {
	source: GitlabSourceData;
	mode: Mode;
	onChange?: (data: GitStorageData) => void;
}

const SelectGitLabStorageDataFields = (props: SelectGitLabStorageDataFieldsProps) => {
	const { source, mode, onChange } = props;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const gitPaginatedProjectList = useMemo(
		() => new GitPaginatedProjectList(makeSourceApi(source, authServiceUrl) as GitSourceApi),
		[source, authServiceUrl],
	);

	return mode === Mode.clone ? (
		<CloneFields onChange={onChange} source={source} gitPaginatedProjectList={gitPaginatedProjectList} />
	) : (
		<ConnectFields onChange={onChange} source={source} />
	);
};

export default SelectGitLabStorageDataFields;
