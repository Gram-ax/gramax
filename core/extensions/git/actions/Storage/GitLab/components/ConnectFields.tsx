import ListLayout from "@components/List/ListLayout";
import { useEffect, useState } from "react";
import useLocalize from "../../../../../localization/useLocalize";
import GitSourceData from "../../../../core/model/GitSourceData.schema";
import GitStorageData from "../../../../core/model/GitStorageData";
import GitLabApi from "../logic/GitLabApi";

const ConnectFields = ({ source, onChange }: { source: GitSourceData; onChange?: (data: GitStorageData) => void }) => {
	const [group, setGroup] = useState<string>(null);
	const [groups, setGroups] = useState<string[]>([]);
	const [isLoadingData, setIsLoadingData] = useState(false);

	const loadGroups = async (source: GitSourceData) => {
		if (!source) return;
		setIsLoadingData(true)
		const gitLabApi = new GitLabApi(source);
		setGroups(await gitLabApi.getGroups());
		setIsLoadingData(false)
	};

	useEffect(() => {
		void loadGroups(source);
	}, [source]);

	useEffect(() => {
		if (onChange) onChange({ source, group, name: null });
	}, [group]);

	return (
		<div className="form-group field field-string row">
			<label className="control-label">{useLocalize("group") + " GitLab"}</label>
			<div className="input-lable">
				<ListLayout
					isLoadingData={isLoadingData}
					placeholder={`${useLocalize("find")} ${useLocalize("group2")}`}
					item={group ?? ""}
					items={groups}
					onItemClick={setGroup}
				/>
			</div>
		</div>
	);
};

export default ConnectFields;
