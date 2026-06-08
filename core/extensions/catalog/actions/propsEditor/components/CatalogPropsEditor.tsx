import FormSkeleton from "@components/Atoms/FormSkeleton";
import validateEncodingSymbolsUrl from "@core/utils/validateEncodingSymbolsUrl";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import { useCatalogPropsEditorActions } from "@ext/catalog/actions/propsEditor/logic/useCatalogPropsEditorActions";
import { useOpenExternalGitSourceButton } from "@ext/catalog/actions/propsEditor/logic/useOpenExternalGitSourceButton";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@ui-kit/Sidebar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FORM_STYLES } from "../consts/form";
import type { CatalogSettingsModalProps, FormData, FormProps } from "../logic/createFormSchema";
import { createFormSchema } from "../logic/createFormSchema";
import { GitSettingsTabs, SectionComponent, type SettingsTab, SettingsTabs } from "./Sections";

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

	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const hasGitSource = !!sourceName;

	useEffect(() => {
		if (!hasGitSource && activeTab in GitSettingsTabs) setActiveTab("general");
	}, [hasGitSource, activeTab]);

	const { gitButtonProps } = useOpenExternalGitSourceButton(useCallback(() => setOpen(false), [setOpen]));

	const formSchema = useMemo(
		() => createFormSchema({ allCatalogNames, validateEncodingSymbolsUrl }),
		[allCatalogNames],
	);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: async () => {
			const props = await getOriginalProps();
			setIsFormLoading(false);
			return {
				...props,
			};
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

			await form.handleSubmit((data) => {
				onSubmit(
					data as Parameters<typeof onSubmit>[0],
					form.formState.defaultValues as Parameters<typeof onSubmit>[1],
				);
			})(e);
			onSubmitParent?.(await getOriginalProps());
		},
		[startUpdatingProps, form, onSubmit, onSubmitParent, getOriginalProps],
	);

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogContent
				data-modal-root
				{...modalContentProps}
				className="overflow-hidden p-0"
				size="M"
				style={{ height: "calc(100vh - 2rem)" }}
			>
				<ModalErrorHandler onClose={() => setOpen(false)} onError={() => {}}>
					<FormHeader
						description={t("forms.catalog-edit-props.description")}
						icon="settings"
						title={t("forms.catalog-edit-props.name")}
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
								{hasGitSource && (
									<SidebarGroup>
										<SidebarGroupContent>
											<span
												className="text-xs font-medium px-2 py-1"
												style={{ color: "var(--color-text-secondary)" }}
											>
												{t("forms.catalog-edit-props.sidebar.git")}
											</span>
											<SidebarMenu>
												{Object.entries(GitSettingsTabs).map(([key, tab]) => (
													<SidebarMenuItem key={key}>
														<SidebarMenuButton
															isActive={activeTab === key}
															onClick={() => setActiveTab(key as SettingsTab)}
														>
															<Icon icon={tab.icon} />
															<span>
																{t(
																	`forms.catalog-edit-props.tabs.${key as SettingsTab}`,
																)}
															</span>
														</SidebarMenuButton>
													</SidebarMenuItem>
												))}
											</SidebarMenu>
										</SidebarGroupContent>
									</SidebarGroup>
								)}
							</SidebarContent>
						</Sidebar>
						<main className="flex flex-1 flex-col overflow-hidden min-h-0">
							<FormSkeleton form={form} isLoading={isFormLoading}>
								<div className="flex flex-col h-full min-h-0">
									<Form asChild {...form}>
										<form className="flex flex-col h-full min-h-0" onSubmit={formSubmit}>
											<DialogBody
												className="flex-1 overflow-auto min-h-0"
												style={{ flexGrow: 1 }}
											>
												<FormStack>
													<SectionComponent
														activeTab={activeTab}
														form={form}
														formProps={formProps}
													/>
												</FormStack>
											</DialogBody>
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
						</main>
					</SidebarContainer>
				</ModalErrorHandler>
			</DialogContent>
		</Dialog>
	);
};

export default CatalogPropsEditor;
