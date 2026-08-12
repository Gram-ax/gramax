import type DefaultModal from "@core-ui/ContextServices/ModalToOpenService/components/DefaultModal";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { useAlertMessage } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { getGesErrorBadgeText, getGesErrorTitle, getSaveErrorText } from "@ext/enterprise/errors/getGesErrorText";
import { Page } from "@ext/enterprise/types/Page";
import type { PluginsSettings } from "@ext/enterprise/types/PluginsSettings";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { deletePlugin, togglePluginState } from "@plugins/store";
import { Icon } from "@ui-kit/Icon";
import { FieldLabel } from "@ui-kit/Label";
import { PageState, PageStateDescription, PageStateTitle } from "@ui-kit/PageState";
import { SwitchField } from "@ui-kit/Switch";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import { Spinner } from "../../../ui-kit/Spinner";
import { StyledField } from "../../../ui-kit/StyledField";
import { TabErrorBlock } from "../../../ui-kit/TabErrorBlock";
import { TabInitialLoader } from "../../../ui-kit/TabInitialLoader";
import { ButtonsContainer, DetailsSection, FieldsContainer } from "./PluginDetailComponent.style";

const PluginDetailComponent = () => {
	const { pageParams, navigate } = useAdminNavigation(Page.PLUGIN_DETAIL);
	const { settings, gesUrl, update, ensureLoaded, isInitialLoading, isRefreshing, getTabError } = useSettings();
	const pluginsSettings = settings?.plugins;
	const [isProcessing, setIsProcessing] = useState(false);
	const saveError = useAlertMessage();
	const selectedPluginId = pageParams.selectedPluginId;

	const pluginConfig = useMemo(
		() => pluginsSettings?.plugins.find((p) => p.metadata.id === selectedPluginId),
		[pluginsSettings, selectedPluginId],
	);

	const isDisabled = pluginConfig?.metadata.disabled;

	const handleToggleState = useCallback(async () => {
		if (!selectedPluginId || isProcessing || !pluginsSettings) return;

		saveError.hide();
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
			await update("plugins", updatedSettings);
			await togglePluginState(selectedPluginId, newDisabled);
		} catch (e) {
			const code = toGesErrorCode(e);
			saveError.alert(getSaveErrorText(code, gesUrl), getGesErrorTitle(code), getGesErrorBadgeText(code));
		} finally {
			setIsProcessing(false);
		}
	}, [selectedPluginId, isDisabled, isProcessing, pluginsSettings, update, saveError.hide, saveError.alert, gesUrl]);

	const handleDelete = useCallback(async () => {
		if (!selectedPluginId || isProcessing || !pluginsSettings) return;

		saveError.hide();
		setIsProcessing(true);
		try {
			const updatedSettings: PluginsSettings = {
				plugins: pluginsSettings.plugins.filter((p) => p.metadata.id !== selectedPluginId),
			};
			await update("plugins", updatedSettings);
			deletePlugin(selectedPluginId);

			navigate(Page.PLUGINS);
		} catch (e) {
			const code = toGesErrorCode(e);
			saveError.alert(getSaveErrorText(code, gesUrl), getGesErrorTitle(code), getGesErrorBadgeText(code));
			setIsProcessing(false);
		}
	}, [selectedPluginId, isProcessing, pluginsSettings, update, navigate, saveError.hide, saveError.alert, gesUrl]);

	const handleOpenDeleteModal = useCallback(() => {
		const modalId = ModalToOpenService.addModal<ComponentProps<typeof DefaultModal>>(ModalToOpen.DefaultModal, {
			title: t("plugins.delete-modal.title"),
			content: t("plugins.delete-modal.content").replace("{name}", pluginConfig.metadata?.name),
			description: t("plugins.delete-modal.description"),
			primaryButtonProps: {
				text: t("plugins.delete-modal.confirm"),
				onClick: () => {
					// biome-ignore lint/nursery/noFloatingPromises: TODO: fix
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
	const isContentUnavailable = isInitialLoading("plugins") || Boolean(tabError) || !pluginConfig;

	useAdminHeader({
		alert: saveError,
		title: (
			<>
				{getAdminPageTitle(Page.PLUGIN_DETAIL)} <Spinner show={isRefreshing("plugins")} size="small" />
			</>
		),
		actions: isContentUnavailable ? undefined : (
			<ButtonsContainer>
				<SwitchField
					alignment="right"
					checked={!isDisabled}
					className="gap-2"
					disabled={isProcessing}
					label={t("plugins.detail.current-status")}
					onCheckedChange={handleToggleState}
				/>
				<Button disabled={isProcessing} onClick={handleOpenDeleteModal} status="error" variant="secondary">
					<Icon icon="trash-2" size="md" />
					{t("plugins.detail.delete")}
				</Button>
			</ButtonsContainer>
		),
	});

	if (isInitialLoading("plugins")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock code={tabError} onRetry={() => ensureLoaded("plugins", true)} />;
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
