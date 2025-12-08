import UploadArticleIcon from "@ext/markdown/elements/icon/edit/components/UploadArticleIcon";
import { Description } from "@ui-kit/Description";
import t from "@ext/localization/locale/translate";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../../logic/createFormSchema";
import { FieldLabel } from "@ui-kit/Label";

export const EditIconsProps = ({ form }: { form: UseFormReturn<FormData> }) => {
	return (
		<>
			<FieldLabel children={t("forms.catalog-edit-props.props.icons.name")} />
			<Description
				children={t("forms.catalog-edit-props.props.icons.description")}
				className="text-muted font-normal text-xs"
				style={{ marginTop: 0 }}
			/>
			<UploadArticleIcon form={form} />
		</>
	);
};
