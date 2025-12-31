import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { FormField } from "@ui-kit/Form";
import { TagInput } from "@ui-kit/TagInput";
import { UseFormReturn } from "react-hook-form";
import type { FormProps } from "../../logic/createFormSchema";
import { FormData } from "../../logic/createFormSchema";

export type LfsProps = {
	form: UseFormReturn<FormData>;
	formProps: FormProps;
};

export const EditLfsProps = ({ form, formProps }: LfsProps) => {
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const { sourceType } = getPartGitSourceDataByStorageName(sourceName);

	return (
		<>
			<FormField
				name="lfs"
				title={t("forms.catalog-edit-props.props.lfs.name")}
				description={t("forms.catalog-edit-props.props.lfs.description")}
				control={({ field }) => (
					<TagInput
						readonly={!sourceType}
						placeholder={t("forms.catalog-edit-props.props.lfs.placeholder")}
						value={field.value || []}
						onChange={(values) => field.onChange(values)}
					/>
				)}
				{...formProps}
			/>
		</>
	);
};
