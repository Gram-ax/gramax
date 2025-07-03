import ReformattedSelect from "@components/Select/ReformattedSelect";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import useWatch from "@core-ui/hooks/useWatch";
import validateEncodingSymbolsUrl from "@core/utils/validateEncodingSymbolsUrl";
import { useCatalogPropsEditorActions } from "@ext/catalog/actions/propsEditor/logic/useCatalogPropsEditorActions";
import { useOpenExternalGitSourceButton } from "@ext/catalog/actions/propsEditor/logic/useOpenExternalGitSourceButton";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import UploadArticleIcon from "@ext/markdown/elements/icon/edit/components/UploadArticleIcon";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Form, FormField, FormSectionTitle, FormHeader, FormStack, FormFooter } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { usePreventAutoFocusToInput } from "@ui-kit/Modal/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { useCallback, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Schema from "../model/CatalogEditProps.schema.json";
import UploadCatalogLogo from "./UploadCatalogLogo";
import CatalogExtendedPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogExtendedPropsEditor";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";

interface CatalogSettingsModalProps {
	isOpen?: boolean;
	modalContentProps?: object;
	onSubmit?: (editProps: any) => void;
	onClose?: () => void;
	trigger?: JSX.Element;
	startUpdatingProps?: () => void;
}

export type FormProps = Record<string, string>;

const useFormSelectValues = () => {
	const workspace = WorkspaceService.current();

	const languages = useMemo<{ value: string; children: string }[]>(
		() =>
			Schema.properties.language.enum.map((shortLang) => {
				return { value: shortLang, children: t(`${Schema.properties.language.see}.${shortLang}` as any) };
			}),
		[],
	);

	const cardColors = useMemo(
		() =>
			Schema.properties.style.enum.map((color) => {
				return t(`${Schema.properties.style.see}.${color}` as any);
			}),
		[],
	);

	const workspaceGroups = useMemo(
		() =>
			Object.entries(workspace?.groups || {}).map(([key, group]) => ({
				value: key,
				children: group.title,
			})),
		[workspace?.groups],
	);

	return { workspaceGroups, cardColors, languages };
};

const CatalogPropsEditor = (props: CatalogSettingsModalProps) => {
	const { trigger, modalContentProps, onSubmit: onSubmitParent, onClose, isOpen, startUpdatingProps } = props;

	const hookProps = useCatalogPropsEditorActions();
	const { onMouseTriggerEnter, allCatalogNames, originalProps, onSubmit, open, setOpen } = hookProps;
	const { inputRef } = usePreventAutoFocusToInput(open);

	const internalSetIsOpen = useCallback(
		(value: boolean) => {
			setOpen(value);
			if (!value) onClose?.();
		},
		[onClose],
	);

	useWatch(() => {
		if (typeof isOpen === "boolean") internalSetIsOpen(isOpen);
	}, [isOpen]);

	const { workspaceGroups, cardColors, languages } = useFormSelectValues();

	const catalogProps = CatalogPropsService.value;
	const { sourceType } = getPartGitSourceDataByStorageName(catalogProps.sourceName);

	const { gitlabButtonProps } = useOpenExternalGitSourceButton(useCallback(() => internalSetIsOpen(false), []));
	const { confirmChanges } = CatalogLogoService.value();

	const suchCatalogExists = t("catalog.error.already-exist");
	const noEncodingSymbolsInUrl = t("no-encoding-symbols-in-url");
	const maxLetterLength = t("max-length");

	const formSchema = z.object({
		title: z
			.string()
			.min(2, {
				message: t("directory-name-min-length"),
			})
			.refine((value) => !allCatalogNames.includes(value), {
				message: suchCatalogExists,
			}),
		url: z
			.string()
			.min(2, {
				message: t("repository-name-min-length"),
			})
			.refine((value) => validateEncodingSymbolsUrl(value), {
				message: noEncodingSymbolsInUrl,
			}),
		docroot: z.optional(z.string().nullable()),
		language: z.optional(z.string().nullable()),
		versions: z.optional(z.array(z.string()).nullable()),
		description: z.optional(
			z
				.string()
				.max(50, {
					message: maxLetterLength + "50",
				})
				.nullable(),
		),
		style: z.optional(z.string().nullable()),
		code: z.optional(
			z
				.string()
				.max(4, {
					message: maxLetterLength + "4",
				})
				.nullable(),
		),
		group: z.optional(z.string().nullable()),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: Object.assign({}, originalProps) as any,
		mode: "onChange",
	});

	const formProps: FormProps = useMemo(() => {
		return {
			labelClassName: "w-44",
		};
	}, []);

	const formSubmit = async (e) => {
		startUpdatingProps?.();
		form.handleSubmit(onSubmit)(e);
		await confirmChanges();
		onSubmitParent?.(originalProps);
	};

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
								icon={"settings"}
								title={t("forms.catalog-edit-props.name")}
								description={t("forms.catalog-edit-props.description")}
							/>
							<ModalBody>
								<FormStack>
									<FormField
										name="title"
										title={t("forms.catalog-edit-props.props.title.name")}
										description={t("forms.catalog-edit-props.props.title.description")}
										required
										control={({ field }) => (
											<Input
												data-qa={t("forms.catalog-edit-props.props.title.name")}
												placeholder={t("forms.catalog-edit-props.props.title.placeholder")}
												{...field}
												ref={inputRef}
											/>
										)}
										{...formProps}
									/>
									<FormField
										name="url"
										title={t("forms.catalog-edit-props.props.url.name")}
										description={t("forms.catalog-edit-props.props.url.description")}
										control={({ field }) => (
											<Input
												data-qa={t("forms.catalog-edit-props.props.url.name")}
												placeholder={t("forms.catalog-edit-props.props.url.placeholder")}
												{...field}
												readOnly={!!sourceType}
											/>
										)}
										{...formProps}
									/>
									<FormField
										name="docroot"
										title={t("forms.catalog-edit-props.props.docroot.name")}
										description={t("forms.catalog-edit-props.props.docroot.description")}
										control={({ field }) => (
											<Input
												data-qa={t("forms.catalog-edit-props.props.docroot.name")}
												placeholder={t("forms.catalog-edit-props.props.docroot.placeholder")}
												{...field}
											/>
										)}
										{...formProps}
									/>
									<FormField
										name="language"
										title={t("forms.catalog-edit-props.props.language.name")}
										description={t("forms.catalog-edit-props.props.language.description")}
										control={({ field }) => (
											<Select
												onValueChange={field.onChange}
												disabled={Boolean(originalProps.language)}
												defaultValue={field.value || undefined}
											>
												<SelectTrigger
													data-qa={t("forms.catalog-edit-props.props.language.name")}
												>
													<SelectValue
														placeholder={t(
															"forms.catalog-edit-props.props.language.placeholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{languages.map(({ value, children }) => (
														<SelectItem
															data-qa={"qa-clickable"}
															key={value}
															children={children}
															value={value}
														/>
													))}
												</SelectContent>
											</Select>
										)}
										{...formProps}
									/>
									<FormField
										name="versions"
										title={t("forms.catalog-edit-props.props.versions.name")}
										description={t("forms.catalog-edit-props.props.versions.description")}
										control={({ field }) => (
											<ReformattedSelect
												create
												placeholder={t("forms.catalog-edit-props.props.versions.placeholder")}
												dataQa={t("forms.catalog-edit-props.props.versions.name")}
												onChange={(values) => {
													const versions = values.map((value) => value.value);
													form.setValue("versions", versions);
													field.value = versions;
												}}
												options={[]}
												values={field.value?.map((value) => ({ value, label: value }))}
											/>
										)}
										{...formProps}
									/>
									<Divider />
									<FormSectionTitle children={t("forms.catalog-edit-props.section.display")} />
									<FormField
										name="description"
										title={t("forms.catalog-edit-props.props.description.name")}
										control={({ field }) => (
											<Input
												data-qa={t("forms.catalog-edit-props.props.description.name")}
												placeholder={t(
													"forms.catalog-edit-props.props.description.placeholder",
												)}
												{...field}
											/>
										)}
										{...formProps}
									/>
									<FormField
										name="style"
										title={t("forms.catalog-edit-props.props.style.name")}
										control={({ field }) => (
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value || undefined}
											>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"forms.catalog-edit-props.props.style.placeholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{cardColors.map((color, index) => (
														<SelectItem
															children={color}
															key={color}
															value={Schema.properties.style.enum[index]}
														/>
													))}
												</SelectContent>
											</Select>
										)}
										{...formProps}
									/>
									<FormField
										name="code"
										title={t("forms.catalog-edit-props.props.code.name")}
										control={({ field }) => (
											<Input
												data-qa={t("forms.catalog-edit-props.props.code.name")}
												placeholder={t("forms.catalog-edit-props.props.code.placeholder")}
												{...field}
											/>
										)}
										{...formProps}
									/>
									{workspaceGroups.length >= 1 && (
										<FormField
											name="group"
											title={t("forms.catalog-edit-props.props.group.name")}
											control={({ field }) => (
												<Select
													disabled={!workspaceGroups.length}
													onValueChange={field.onChange}
													defaultValue={field.value || undefined}
												>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"forms.catalog-edit-props.props.group.placeholder",
															)}
														/>
													</SelectTrigger>
													<SelectContent>
														{workspaceGroups.map(({ value, children }) => (
															<SelectItem children={children} key={value} value={value} />
														))}
													</SelectContent>
												</Select>
											)}
											{...formProps}
										/>
									)}
									<UploadCatalogLogo formProps={formProps} />
									<UploadArticleIcon formProps={formProps} />
								</FormStack>
							</ModalBody>
							<FormFooter
								primaryButton={<Button hidden variant="primary" children={t("save")} />}
								secondaryButton={
									<>
										<Button variant="outline" {...gitlabButtonProps} />
										<CatalogExtendedPropsEditor
											trigger={
												<Button variant="outline">
													{t("forms.catalog-edit-props.extended.name")}
												</Button>
											}
										/>
									</>
								}
							/>
						</form>
					</Form>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default CatalogPropsEditor;
