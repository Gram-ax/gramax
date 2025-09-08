import Icon from "@components/Atoms/Icon";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import useWatch from "@core-ui/hooks/useWatch";
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
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { usePreventAutoFocusToInput } from "@ui-kit/Modal/utils";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { FORM_STYLES } from "../consts/form";
import { useFormSelectValues } from "../hooks/useFormSelectValues";
import type { CatalogSettingsModalProps, FormData, FormProps } from "../logic/createFormSchema";
import { createFormSchema } from "../logic/createFormSchema";
import { EditBasicProps, EditDisplayProps, EditExtendedProps } from "./Sections";
import UploadCatalogLogo from "./UploadCatalogLogo";

const CatalogPropsEditor = (props: CatalogSettingsModalProps) => {
	const { trigger, modalContentProps, onSubmit: onSubmitParent, onClose, isOpen, startUpdatingProps } = props;

	const { onMouseTriggerEnter, allCatalogNames, originalProps, onSubmit, open, setOpen, isLoading, error } =
		useCatalogPropsEditorActions();
	const { inputRef } = usePreventAutoFocusToInput(open);

	const internalSetIsOpen = useCallback(
		(value: boolean) => {
			setOpen(value);
			if (!value) onClose?.();
		},
		[onClose],
	);

	const { workspaceGroups, cardColors, languages, syntaxes } = useFormSelectValues();

	const catalogProps = CatalogPropsService.value;
	const { sourceType } = getPartGitSourceDataByStorageName(catalogProps.sourceName);

	const { gitButtonProps } = useOpenExternalGitSourceButton(useCallback(() => internalSetIsOpen(false), []));
	const { confirmChanges } = CatalogLogoService.value();

	const formSchema = useMemo(
		() => createFormSchema({ allCatalogNames, validateEncodingSymbolsUrl }),
		[allCatalogNames, validateEncodingSymbolsUrl],
	);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: { ...originalProps },
		mode: "onChange",
	});

	useWatch(() => {
		if (typeof isOpen === "boolean") {
			internalSetIsOpen(isOpen);
			if (isOpen) form.reset({ ...originalProps });
		}
	}, [isOpen, form, originalProps]);

	useEffect(() => form.reset({ ...originalProps }), [form, originalProps]);

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

			await form.handleSubmit(onSubmit)(e);
			await confirmChanges();
			onSubmitParent?.(originalProps);
		},
		[startUpdatingProps, form, onSubmit, confirmChanges, onSubmitParent, originalProps],
	);

	return (
		<Modal open={open} onOpenChange={internalSetIsOpen}>
			{trigger && (
				<ModalTrigger asChild onMouseEnter={onMouseTriggerEnter}>
					{trigger}
				</ModalTrigger>
			)}
			<ModalContent data-modal-root {...modalContentProps}>
				<ModalErrorHandler onError={() => {}} onClose={() => internalSetIsOpen(false)}>
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
										formProps={formProps}
										languages={languages}
										originalProps={originalProps}
										sourceType={sourceType}
										inputRef={inputRef}
									/>

									<Divider />
									<FormSectionTitle children={t("forms.catalog-edit-props.section.display")} />
									<EditDisplayProps
										formProps={formProps}
										cardColors={cardColors}
										originalProps={originalProps}
										workspaceGroups={workspaceGroups}
									/>

									<UploadCatalogLogo formProps={formProps} />
									<UploadArticleIcon formProps={formProps} />

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
							{error && <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">{error}</div>}
						</form>
					</Form>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default CatalogPropsEditor;
