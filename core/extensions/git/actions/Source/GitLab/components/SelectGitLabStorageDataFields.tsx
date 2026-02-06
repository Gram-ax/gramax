import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import ConnectFields from "@ext/git/actions/Source/GitLab/components/ConnectFields";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { useMakeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import t from "@ext/localization/locale/translate";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import { FormField } from "@ui-kit/Form";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import GitStorageData from "../../../../core/model/GitStorageData";
import CloneFields from "../../components/CloneFields";

interface SelectGitLabStorageDataFieldsProps {
	mode?: "init" | "clone";
	form: UseFormReturn<SelectFormSchemaType>;
	source: GitlabSourceData;
	onChange?: (data: GitStorageData) => void;
}

const SelectGitLabStorageDataFields = (props: SelectGitLabStorageDataFieldsProps) => {
	const { source, form, mode } = props;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const sourceApi = useMakeSourceApi(source, authServiceUrl) as GitSourceApi;
	const gitPaginatedProjectList = useMemo(() => new GitPaginatedProjectList(sourceApi), [sourceApi]);

	return (
		<FormField
			control={({ field }) =>
				mode === "init" ? (
					<ConnectFields {...field} placeholder={t("find") + " " + t("group2")} source={source} />
				) : (
					<CloneFields
						{...field}
						form={form}
						gitPaginatedProjectList={gitPaginatedProjectList}
						source={source}
					/>
				)
			}
			name="repository"
			title={mode === "init" ? t("group") : t("repository")}
		/>
	);
};

export default SelectGitLabStorageDataFields;
