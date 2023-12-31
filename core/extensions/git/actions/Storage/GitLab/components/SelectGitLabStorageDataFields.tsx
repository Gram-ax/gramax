import GitSourceData from "../../../../core/model/GitSourceData.schema";
import GitStorageData from "../../../../core/model/GitStorageData";
import CloneFields from "../../components/CloneFields";
import GitLabApi from "../logic/GitLabApi";
import ConnectFields from "./ConnectFields";

const SelectGitLabStorageDataFields = ({
	source,
	forClone,
	onChange,
}: {
	source: GitSourceData;
	forClone?: boolean;
	onChange?: (data: GitStorageData) => void;
}) => {
	return forClone ? (
		<CloneFields
			onChange={onChange}
			source={source}
			getLoadProjects={async (source) => {
				if (!source) return;
				const gitLabApi = new GitLabApi(source);
				return await gitLabApi.getAllProjects();
			}}
		/>
	) : (
		<ConnectFields onChange={onChange} source={source} />
	);
};

export default SelectGitLabStorageDataFields;
