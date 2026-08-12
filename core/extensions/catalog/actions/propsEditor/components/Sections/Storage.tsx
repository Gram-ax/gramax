import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import { FORM_DATA_QA, FORM_STYLES } from "@ext/catalog/actions/propsEditor/consts/form";
import t from "@ext/localization/locale/translate";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { FormField } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";

export const EditStorageProps = () => {
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const { sourceType } = getPartGitSourceDataByStorageName(sourceName);

	return (
		<SectionContainer>
			<FormField
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.URL}
						placeholder={t("forms.catalog-edit-props.props.url.placeholder")}
						{...field}
						readOnly={!!sourceType}
					/>
				)}
				description={t("forms.catalog-edit-props.props.url.description")}
				labelClassName={FORM_STYLES.LABEL_WIDTH}
				layout="horizontal"
				name="url"
				title={t("forms.catalog-edit-props.props.url.name")}
			/>
			<FormField
				control={({ field }) => (
					<Input
						placeholder={t("forms.catalog-edit-props.props.docroot.placeholder")}
						{...field}
						data-qa={FORM_DATA_QA.DOCROOT}
					/>
				)}
				description={t("forms.catalog-edit-props.props.docroot.description")}
				labelClassName={FORM_STYLES.LABEL_WIDTH}
				layout="horizontal"
				name="docroot"
				title={t("forms.catalog-edit-props.props.docroot.name")}
			/>
		</SectionContainer>
	);
};
