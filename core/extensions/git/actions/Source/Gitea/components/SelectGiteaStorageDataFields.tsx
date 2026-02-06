import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import CloneFields, { CloneListItem } from "@ext/git/actions/Source/components/CloneFields";
import ReadOnlyUserField from "@ext/git/actions/Source/components/ReadOnlyUserField";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import type GiteaSourceData from "@ext/git/actions/Source/Gitea/logic/GiteaSourceData";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { useMakeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import { FormField } from "@ui-kit/Form";
import { useEffect, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface SelectGiteaStorageDataFieldsProps {
	source: GiteaSourceData;
	mode?: "init" | "clone";
	form: UseFormReturn<SelectFormSchemaType>;
	onChange?: (data: GitStorageData) => void;
}

const sortModel = (model: CloneListItem[]) => {
	return model.sort((a, b) => a?.date - b?.date);
};

const SelectGiteaStorageDataFields = (props: SelectGiteaStorageDataFieldsProps) => {
	const { source, form, mode } = props;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const sourceApi = useMakeSourceApi(source, authServiceUrl) as GitSourceApi;
	const gitPaginatedProjectList = useMemo(
		() => new GitPaginatedProjectList(sourceApi, undefined, sortModel),
		[sourceApi],
	);
	const [user, setUser] = useState<SourceUser>(null);

	useEffect(() => {
		if (mode !== "init") return;
		sourceApi.getUser().then((user) => {
			setUser(user);

			form.setValue("user", {
				avatarUrl: user.avatarUrl,
				name: user.username,
				type: "User",
				htmlUrl: "", // don't work without it
			});
		});
	}, []);

	if (mode === "init") return <ReadOnlyUserField user={user} />;

	return (
		<FormField
			control={({ field }) => (
				<CloneFields {...field} form={form} gitPaginatedProjectList={gitPaginatedProjectList} source={source} />
			)}
			name="repository"
			title={t("repository")}
		/>
	);
};

export default SelectGiteaStorageDataFields;
