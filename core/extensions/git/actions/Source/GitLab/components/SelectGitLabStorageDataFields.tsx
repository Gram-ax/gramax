import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { useMakeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { useMemo } from "react";
import GitStorageData from "../../../../core/model/GitStorageData";
import CloneFields from "../../components/CloneFields";
import { UseFormReturn } from "react-hook-form";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import { FormField } from "@ui-kit/Form";
import t from "@ext/localization/locale/translate";
import ConnectFields from "@ext/git/actions/Source/GitLab/components/ConnectFields";

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
			title={mode === "init" ? t("group") : t("repository")}
			name="repository"
			control={({ field }) =>
				mode === "init" ? (
					<ConnectFields {...field} source={source} placeholder={t("find") + " " + t("group2")} />
				) : (
					<CloneFields
						{...field}
						form={form}
						source={source}
						gitPaginatedProjectList={gitPaginatedProjectList}
					/>
				)
			}
		/>
	);
};

export default SelectGitLabStorageDataFields;
