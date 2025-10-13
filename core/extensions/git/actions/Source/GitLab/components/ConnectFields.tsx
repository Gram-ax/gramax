import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import { useMakeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import GitlabSourceAPI from "../logic/GitlabSourceAPI";
import { LazySearchSelect } from "@ui-kit/LazySearchSelect";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";

interface ConnectFieldsProps {
	source: GitSourceData;
	placeholder?: string;
	onChange?: (value: any) => void;
}

const ConnectFields = ({ source, placeholder, ...rest }: ConnectFieldsProps) => {
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const [groups, setGroups] = useState<string[]>([]);
	const sourceApi = useMakeSourceApi(source, authServiceUrl) as GitlabSourceAPI;

	const loadGroups = async () => {
		setGroups(await sourceApi.getAllGroups());
	};

	useWatch(() => {
		if (!source) return;
		void loadGroups();
	}, [source]);

	return (
		<LazySearchSelect
			{...rest}
			placeholder={placeholder || `${t("find")} ${t("group2")}`}
			onChange={(value) => {
				rest.onChange?.({ path: value, lastActivity: undefined });
			}}
			options={groups.map((group) => ({
				label: group,
				value: group,
			}))}
		/>
	);
};

export default ConnectFields;
