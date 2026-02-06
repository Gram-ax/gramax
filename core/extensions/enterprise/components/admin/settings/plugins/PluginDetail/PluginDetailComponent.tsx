import type DefaultModal from "@core-ui/ContextServices/ModalToOpenService/components/DefaultModal";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { Page, PluginsSettings } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { deletePlugin, togglePluginState } from "@plugins/store";
import { Button } from "@ui-kit/Button";
import { FieldLabel } from "@ui-kit/Label";
import { PageState, PageStateDescription, PageStateTitle } from "@ui-kit/PageState";
import { SwitchField } from "@ui-kit/Switch";
import { Trash2 } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import { FloatingAlert } from "../../../ui-kit/FloatingAlert";
import { Spinner } from "../../../ui-kit/Spinner";
import { StickyHeader } from "../../../ui-kit/StickyHeader";
import { StyledField } from "../../../ui-kit/StyledField";
import { TabErrorBlock } from "../../../ui-kit/TabErrorBlock";
import { TabInitialLoader } from "../../../ui-kit/TabInitialLoader";
import { ButtonsContainer, DetailsSection, FieldsContainer } from "./PluginDetailComponent.style";

const PluginDetailComponent = () => {
	const { pageParams, navigate } = useAdminNavigation(Page.PLUGIN_DETAIL);
	const { settings, updatePlugins, ensurePluginsLoaded, isInitialLoading, isRefreshing, getTabError } = useSettings();
	const pluginsSettings = settings?.plugins;
	const [isProcessing, setIsProcessing] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const selectedPluginId = pageParams.selectedPluginId;

	const pluginConfig = useMemo(
		() => pluginsSettings?.plugins.find((p) => p.metadata.id === selectedPluginId),
		[pluginsSettings, selectedPluginId],
	);

	const isDisabled = pluginConfig?.metadata.disabled;

	const handleToggleState = useCallback(async () => {
		if (!selectedPluginId || isProcessing || !pluginsSettings) return;

		setIsProcessing(true);
		try {
			const newDisabled = !isDisabled;
			const updatedPlugins = pluginsSettings.plugins.map((p) =>
				p.metadata.id === selectedPluginId ? { ...p, metadata: { ...p.metadata, disabled: newDisabled } } : p,
			);
			// Filter out built-in plugins before saving to prevent duplicates
			const updatedSettings: PluginsSettings = {
				plugins: updatedPlugins.filter((p) => !p.metadata.isBuiltIn),
			};
			await updatePlugins(updatedSettings);
			await togglePluginState(selectedPluginId, newDisabled);
		} catch (e) {
			setSaveError(e?.message);
		} finally {
			setIsProcessing(false);
		}
	}, [selectedPluginId, isDisabled, isProcessing, pluginsSettings, updatePlugins]);

	const handleDelete = useCallback(async () => {
		if (!selectedPluginId || isProcessing || !pluginsSettings) return;

		setIsProcessing(true);
		try {
			const updatedSettings: PluginsSettings = {
				plugins: pluginsSettings.plugins.filter((p) => p.metadata.id !== selectedPluginId),
			};
			await updatePlugins(updatedSettings);
			deletePlugin(selectedPluginId);

			navigate(Page.PLUGINS);
		} catch (e) {
			setSaveError(e?.message);
			setIsProcessing(false);
		}
	}, [selectedPluginId, isProcessing, pluginsSettings, updatePlugins, navigate]);

	const handleOpenDeleteModal = useCallback(() => {
		const modalId = ModalToOpenService.addModal<ComponentProps<typeof DefaultModal>>(ModalToOpen.DefaultModal, {
			title: t("plugins.delete-modal.title"),
			content: t("plugins.delete-modal.content").replace("{name}", pluginConfig.metadata?.name),
			description: t("plugins.delete-modal.description"),
			primaryButtonProps: {
				text: t("plugins.delete-modal.confirm"),
				onClick: () => {
					handleDelete();
					ModalToOpenService.removeModal(modalId);
				},
			},
			secondaryButtonProps: {
				text: t("plugins.delete-modal.cancel"),
				onClick: () => ModalToOpenService.removeModal(modalId),
			},
			status: "warning",
			onClose: () => ModalToOpenService.removeModal(modalId),
		});
	}, [pluginConfig.metadata.name, handleDelete]);

	const tabError = getTabError("plugins");

	if (isInitialLoading("plugins")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensurePluginsLoaded(true)} />;
	}

	if (!selectedPluginId || !pluginConfig) {
		return (
			<PageState>
				<PageStateTitle>{t("plugins.detail.not-found-title")}</PageStateTitle>
				<PageStateDescription>{t("plugins.detail.not-found-description")}</PageStateDescription>
			</PageState>
		);
	}

	return (
		<div>
			<StickyHeader
				actions={
					<ButtonsContainer>
						<SwitchField
							alignment="right"
							checked={!isDisabled}
							className="gap-2"
							disabled={isProcessing}
							label={t("plugins.detail.current-status")}
							onCheckedChange={handleToggleState}
						/>
						<Button
							disabled={isProcessing}
							onClick={handleOpenDeleteModal}
							status="error"
							variant="secondary"
						>
							<Trash2 size={16} />
							{t("plugins.detail.delete")}
						</Button>
					</ButtonsContainer>
				}
				isScrolled={false}
				title={
					<>
						{getAdminPageTitle(Page.PLUGIN_DETAIL)} <Spinner show={isRefreshing("plugins")} size="small" />
					</>
				}
			/>
			<FloatingAlert message={saveError} show={Boolean(saveError)} />

			<DetailsSection>
				<FieldsContainer>
					<StyledField
						control={() => <FieldLabel>{selectedPluginId}</FieldLabel>}
						title={t("plugins.detail.fields.id")}
					/>
					<StyledField
						control={() => <FieldLabel>{pluginConfig?.metadata?.name || "—"}</FieldLabel>}
						title={t("plugins.detail.fields.name")}
					/>
					<StyledField
						control={() => <FieldLabel>{pluginConfig?.metadata?.version || "—"}</FieldLabel>}
						title={t("plugins.detail.fields.version")}
					/>
					<StyledField
						control={() => <FieldLabel>{pluginConfig?.metadata?.author || "—"}</FieldLabel>}
						title={t("plugins.detail.fields.author")}
					/>
					<StyledField
						control={() => <FieldLabel>{pluginConfig?.metadata?.description || "—"}</FieldLabel>}
						title={t("plugins.detail.fields.description")}
					/>
				</FieldsContainer>
			</DetailsSection>
		</div>
	);
};

export default PluginDetailComponent;
