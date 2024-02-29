import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import GitStorageData from "../../../../core/model/GitStorageData";
import CloneFields from "../../components/CloneFields";
import GitlabSourceAPI from "../logic/GitlabSourceAPI";
import ConnectFields from "./ConnectFields";

interface SelectGitLabStorageDataFieldsProps {
	source: GitlabSourceData;
	forClone?: boolean;
	onChange?: (data: GitStorageData) => void;
}

const SelectGitLabStorageDataFields = (props: SelectGitLabStorageDataFieldsProps) => {
	const { source, forClone, onChange } = props;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;

	return forClone ? (
		<CloneFields
			onChange={onChange}
			source={source}
			getLoadProjects={async (source) => {
				if (!source) return;
				const gitLabApi = new GitlabSourceAPI(source as GitlabSourceData, authServiceUrl);
				return await gitLabApi.getAllProjects();
			}}
		/>
	) : (
		<ConnectFields onChange={onChange} source={source} />
	);
};

export default SelectGitLabStorageDataFields;
