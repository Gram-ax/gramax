import ListLayout from "@components/List/ListLayout";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import { useMakeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
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
	const sourceApi = useMakeSourceApi(source, authServiceUrl) as GitlabSourceAPI;

	const loadGroups = async () => {
		setIsLoadingData(true);
		setGroups(await sourceApi.getAllGroups());
		setIsLoadingData(false);
	};

	useWatch(() => {
		if (!source) return;
		void loadGroups();
	}, [source]);

	useWatch(() => {
		onChange?.({ source, group, name: null });
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
