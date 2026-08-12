import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import t from "@ext/localization/locale/translate";
import UploadArticleIcon from "@ext/markdown/elements/icon/edit/components/UploadArticleIcon";
import { Description } from "@ui-kit/Description";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "../../logic/createFormSchema";

export const EditIconsProps = ({ form }: { form: UseFormReturn<FormData> }) => {
	return (
		<SectionContainer>
			<UploadArticleIcon form={form} />
			<Description className="text-muted font-normal text-xs !mt-2">
				{t("forms.catalog-edit-props.props.icons.description")}
			</Description>
		</SectionContainer>
	);
};
