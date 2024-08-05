import ListLayout from "@components/List/ListLayout";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";
import GitStorageData from "../../../../core/model/GitStorageData";
import GitlabSourceAPI from "../logic/GitlabSourceAPI";

const ConnectFields = ({
	source,
	onChange,
}: {
	source: GitlabSourceData;
	onChange?: (data: GitStorageData) => void;
}) => {
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const [group, setGroup] = useState<string>(null);
	const [groups, setGroups] = useState<string[]>([]);
	const [isLoadingData, setIsLoadingData] = useState(false);

	const loadGroups = async (source: GitlabSourceData) => {
		if (!source) return;
		setIsLoadingData(true);
		const gitLabApi = new GitlabSourceAPI(source, authServiceUrl);
		setGroups(await gitLabApi.getAllGroups());
		setIsLoadingData(false);
	};

	useEffect(() => {
		void loadGroups(source);
	}, [source]);

	useEffect(() => {
		if (onChange) onChange({ source, group, name: null });
	}, [group]);

	return (
		<div className="form-group field field-string row">
			<label className="control-label">{t("group") + " GitLab"}</label>
			<div className="input-lable">
				<ListLayout
					isLoadingData={isLoadingData}
					placeholder={`${t("find")} ${t("group2")}`}
					item={group ?? ""}
					items={groups}
					onItemClick={setGroup}
				/>
			</div>
		</div>
	);
};

export default ConnectFields;
