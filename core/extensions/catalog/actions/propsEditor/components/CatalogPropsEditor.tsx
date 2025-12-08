import FormSkeleton from "@components/Atoms/FormSkeleton";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import validateEncodingSymbolsUrl from "@core/utils/validateEncodingSymbolsUrl";
import { useCatalogPropsEditorActions } from "@ext/catalog/actions/propsEditor/logic/useCatalogPropsEditorActions";
import { useOpenExternalGitSourceButton } from "@ext/catalog/actions/propsEditor/logic/useOpenExternalGitSourceButton";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FORM_STYLES } from "../consts/form";
import type { CatalogSettingsModalProps, FormData, FormProps } from "../logic/createFormSchema";
import { createFormSchema } from "../logic/createFormSchema";
import { SettingsTabs, SettingsTab, SectionComponent } from "./Sections";
import {
	SidebarMenu,
	SidebarGroupContent,
	SidebarGroup,
	SidebarContent,
	Sidebar,
	SidebarProvider,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@ui-kit/Sidebar";
import styled from "@emotion/styled";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";

const SidebarContainer = styled(SidebarProvider)`
	--sidebar-width: 12rem !important;
	height: 100%;
	min-height: unset;
	max-height: 100%;
	overflow: hidden;

	ul {
		list-style: none !important;
	}

	li {
		line-height: unset;
		margin-bottom: unset;
	}
`;

const CatalogPropsEditor = (props: CatalogSettingsModalProps) => {
	const { modalContentProps, onSubmit: onSubmitParent, onClose, startUpdatingProps } = props;
	const [isFormLoading, setIsFormLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<SettingsTab>("general");

	const { allCatalogNames, getOriginalProps, onSubmit, open, setOpen, isLoading } =
		useCatalogPropsEditorActions(onClose);

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
			<ModalContent
				data-modal-root
				{...modalContentProps}
				size="M"
				className="overflow-hidden p-0"
				style={{ height: "calc(100vh - 2rem)" }}
			>
				<ModalErrorHandler onError={() => {}} onClose={() => setOpen(false)}>
					<FormHeader
						icon="settings"
						title={t("forms.catalog-edit-props.name")}
						description={t("forms.catalog-edit-props.description")}
					/>
					<SidebarContainer>
						<Sidebar collapsible="none">
							<SidebarContent>
								<SidebarGroup>
									<SidebarGroupContent>
										<SidebarMenu>
											{Object.entries(SettingsTabs).map(([key, tab]) => (
												<SidebarMenuItem key={key}>
													<SidebarMenuButton
														isActive={activeTab === key}
														onClick={() => setActiveTab(key as SettingsTab)}
													>
														<Icon icon={tab.icon} />
														<span>
															{t(`forms.catalog-edit-props.tabs.${key as SettingsTab}`)}
														</span>
													</SidebarMenuButton>
												</SidebarMenuItem>
											))}
										</SidebarMenu>
									</SidebarGroupContent>
								</SidebarGroup>
							</SidebarContent>
						</Sidebar>
						<main className="flex flex-1 flex-col overflow-hidden min-h-0">
							<FormSkeleton isLoading={isFormLoading} form={form}>
								<div className="flex flex-col h-full min-h-0">
									<Form asChild {...form}>
										<form className="flex flex-col h-full min-h-0" onSubmit={formSubmit}>
											<ModalBody className="flex-1 overflow-auto min-h-0" style={{ flexGrow: 1 }}>
												<FormStack>
													<SectionComponent
														activeTab={activeTab}
														formProps={formProps}
														form={form}
													/>
												</FormStack>
											</ModalBody>
											<FormFooter
												className="flex-shrink-0"
												primaryButton={
													<Button type="submit" variant="primary" disabled={isLoading}>
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
						</main>
					</SidebarContainer>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default CatalogPropsEditor;
