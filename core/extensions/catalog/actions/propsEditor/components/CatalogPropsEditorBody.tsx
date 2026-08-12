import FormSkeleton from "@components/Atoms/FormSkeleton";
import validateEncodingSymbolsUrl from "@core/utils/validateEncodingSymbolsUrl";
import { FORM_STYLES } from "@ext/catalog/actions/propsEditor/consts/form";
import { useCatalogPropsEditorActions } from "@ext/catalog/actions/propsEditor/logic/useCatalogPropsEditorActions";
import { useOpenExternalGitSourceButton } from "@ext/catalog/actions/propsEditor/logic/useOpenExternalGitSourceButton";
import t from "@ext/localization/locale/translate";
import { useRegisterSettingsSave, useReportSettingsDirty } from "@ext/settings/components/SettingsDirtyContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormFooter } from "@ui-kit/Form";
import { Loader } from "@ui-kit/Loader";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { CatalogSettingsModalProps, FormData, FormProps } from "../logic/createFormSchema";
import { createFormSchema } from "../logic/createFormSchema";
import { SectionComponent, type SettingsTab } from "./Sections";

export interface CatalogPropsEditorBodyProps {
	activeTab: SettingsTab;
	onSubmit?: CatalogSettingsModalProps["onSubmit"];
	onClose?: () => void;
	startUpdatingProps?: CatalogSettingsModalProps["startUpdatingProps"];
}

const CatalogPropsEditorBody = ({
	activeTab,
	onSubmit: onSubmitParent,
	onClose,
	startUpdatingProps,
}: CatalogPropsEditorBodyProps) => {
	const [isFormLoading, setIsFormLoading] = useState(true);
	const { allCatalogNames, getOriginalProps, onSubmit, isLoading } = useCatalogPropsEditorActions(onClose);
	const { gitButtonProps } = useOpenExternalGitSourceButton(useCallback(() => onClose?.(), [onClose]));

	const formSchema = useMemo(
		() => createFormSchema({ allCatalogNames, validateEncodingSymbolsUrl }),
		[allCatalogNames],
	);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: async () => {
			const props = await getOriginalProps();
			setIsFormLoading(false);
			return { ...props };
		},
		mode: "onChange",
	});

	useReportSettingsDirty(form.formState.isDirty);

	const formProps: FormProps = useMemo(() => ({ layout: "horizontal", labelClassName: FORM_STYLES.LABEL_WIDTH }), []);

	const submitForm = useCallback(async () => {
		startUpdatingProps?.();
		await form.handleSubmit((data) => {
			onSubmit(
				data as Parameters<typeof onSubmit>[0],
				form.formState.defaultValues as Parameters<typeof onSubmit>[1],
			);
		})();
		onSubmitParent?.(await getOriginalProps());
	}, [startUpdatingProps, form, onSubmit, onSubmitParent, getOriginalProps]);

	// The unsaved-changes guard's "Save and close" submits this form.
	useRegisterSettingsSave(submitForm);

	const formSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			return submitForm();
		},
		[submitForm],
	);

	return (
		<FormSkeleton form={form} isLoading={isFormLoading}>
			<div className="flex flex-col h-full min-h-0">
				<Form asChild {...form}>
					<form className="flex flex-col h-full min-h-0" onSubmit={formSubmit}>
						<SectionComponent activeTab={activeTab} form={form} formProps={formProps} />
						<FormFooter
							className="flex-shrink-0"
							primaryButton={
								<Button disabled={isLoading} type="submit" variant="primary">
									{isLoading && <Loader size="sm" />}
									{t("save")}
								</Button>
							}
							secondaryButton={<Button variant="outline" {...gitButtonProps} />}
						/>
					</form>
				</Form>
			</div>
		</FormSkeleton>
	);
};

export default CatalogPropsEditorBody;
