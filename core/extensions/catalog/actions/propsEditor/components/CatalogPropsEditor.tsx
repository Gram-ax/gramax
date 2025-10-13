import Icon from "@components/Atoms/Icon";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import validateEncodingSymbolsUrl from "@core/utils/validateEncodingSymbolsUrl";
import { useCatalogPropsEditorActions } from "@ext/catalog/actions/propsEditor/logic/useCatalogPropsEditorActions";
import { useOpenExternalGitSourceButton } from "@ext/catalog/actions/propsEditor/logic/useOpenExternalGitSourceButton";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import UploadArticleIcon from "@ext/markdown/elements/icon/edit/components/UploadArticleIcon";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Form, FormFooter, FormHeader, FormSectionTitle, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { usePreventAutoFocusToInput } from "@ui-kit/Modal/utils";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FORM_STYLES } from "../consts/form";
import { useFormSelectValues } from "../hooks/useFormSelectValues";
import type { CatalogSettingsModalProps, FormData, FormProps } from "../logic/createFormSchema";
import { createFormSchema } from "../logic/createFormSchema";
import { EditBasicProps, EditDisplayProps, EditExtendedProps } from "./Sections";
import UploadCatalogLogo from "./UploadCatalogLogo";
import { Description } from "@ui-kit/Description";
import FormSkeleton from "@components/Atoms/FormSkeleton";

const CatalogPropsEditor = (props: CatalogSettingsModalProps) => {
	const { modalContentProps, onSubmit: onSubmitParent, onClose, startUpdatingProps } = props;
	const [isFormLoading, setIsFormLoading] = useState(true);

	const { allCatalogNames, getOriginalProps, onSubmit, open, setOpen, isLoading, error } =
		useCatalogPropsEditorActions(onClose);
	const { inputRef } = usePreventAutoFocusToInput(open);

	const { workspaceGroups, cardColors, languages, syntaxes } = useFormSelectValues();

	const catalogProps = CatalogPropsService.value;
	const { sourceType } = getPartGitSourceDataByStorageName(catalogProps.sourceName);

	const { gitButtonProps } = useOpenExternalGitSourceButton(useCallback(() => setOpen(false), [setOpen]));
	const { confirmChanges } = CatalogLogoService.value();

	const formSchema = useMemo(
		() => createFormSchema({ allCatalogNames, validateEncodingSymbolsUrl }),
		[allCatalogNames, validateEncodingSymbolsUrl],
	);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: async () => {
			const props = await getOriginalProps();
			setIsFormLoading(false);
			return props;
		},
		mode: "onChange",
	});

	const formProps: FormProps = useMemo(
		() => ({
			labelClassName: FORM_STYLES.LABEL_WIDTH,
		}),
		[],
	);

	const formSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			startUpdatingProps?.();

			await form.handleSubmit((data) =>
				onSubmit(
					data as Parameters<typeof onSubmit>[0],
					form.formState.defaultValues as Parameters<typeof onSubmit>[1],
				),
			)(e);
			await confirmChanges();
			onSubmitParent?.(await getOriginalProps());
		},
		[startUpdatingProps, form, onSubmit, confirmChanges, onSubmitParent, getOriginalProps],
	);

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent data-modal-root {...modalContentProps}>
				<ModalErrorHandler onError={() => {}} onClose={() => setOpen(false)}>
					<FormSkeleton isLoading={isFormLoading} form={form}>
						<Form asChild {...form}>
							<form className="contents" onSubmit={formSubmit}>
								<FormHeader
									icon="settings"
									title={t("forms.catalog-edit-props.name")}
									description={t("forms.catalog-edit-props.description")}
								/>
								<ModalBody>
									<FormStack>
										<EditBasicProps
											form={form}
											formProps={formProps}
											languages={languages}
											sourceType={sourceType}
											inputRef={inputRef}
										/>

										<Divider />
										<FormSectionTitle children={t("forms.catalog-edit-props.section.display")} />
										<EditDisplayProps
											form={form}
											formProps={formProps}
											cardColors={cardColors}
											workspaceGroups={workspaceGroups}
										/>

										<UploadCatalogLogo formProps={formProps} form={form} />

										<Divider />
										<FormSectionTitle children={t("forms.catalog-edit-props.props.icons.name")} />
										<Description
											children={t("forms.catalog-edit-props.props.icons.description")}
											className="text-muted font-normal"
											style={{ marginTop: 0 }}
										/>
										<UploadArticleIcon form={form} />

										<Divider />
										<FormSectionTitle children={t("forms.catalog-extended-edit-props.name")} />
										<EditExtendedProps syntaxes={syntaxes} />
									</FormStack>
								</ModalBody>
								<FormFooter
									primaryButton={
										<Button type="submit" variant="primary" disabled={isLoading}>
											{isLoading && <Icon code="loader-circle" isLoading />}
											{t("save")}
										</Button>
									}
									secondaryButton={<Button variant="outline" {...gitButtonProps} />}
								/>
								{error && (
									<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">{error}</div>
								)}
							</form>
						</Form>
					</FormSkeleton>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default CatalogPropsEditor;
