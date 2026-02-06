import getExampleStorageLink from "@ext/git/actions/Clone/logic/getExampleStorageLink";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import { FormField } from "@ui-kit/Form";
import { TextInput } from "@ui-kit/Input";
import { UseFormReturn } from "react-hook-form";

interface SelectGitStorageDataFieldsProps {
	mode?: "init" | "clone";
	form: UseFormReturn<SelectFormSchemaType>;
	source: GitSourceData;
	onChange?: (data: GitStorageData) => void;
}

const SelectGitStorageDataFields = (props: SelectGitStorageDataFieldsProps) => {
	const { source, mode } = props;
	if (mode === "init") return null;
	const exampleLink = getExampleStorageLink(source);

	return (
		<FormField
			control={({ field }) => (
				<TextInput
					{...field}
					onChange={(value) => field.onChange({ path: value, lastActivity: undefined })}
					placeholder={exampleLink}
					value={field.value?.path}
				/>
			)}
			name="repository"
			title={t("git.clone.repo-link")}
		/>
	);
};

export default SelectGitStorageDataFields;
