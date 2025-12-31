import Input from "@components/Atoms/Input";
import type DefaultModal from "@core-ui/ContextServices/ModalToOpenService/components/DefaultModal";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { BUILT_IN_PLUGIN_DEFINITIONS, useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import {
	PluginsEmptyState,
	PluginsHeader,
	PluginsTable,
} from "@ext/enterprise/components/admin/settings/plugins/PluginPage/components";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { PluginsSettings } from "@ext/enterprise/types/EnterpriseAdmin";
import t from "@ext/localization/locale/translate";
import { PluginFileParser } from "@plugins/core/PluginFileParser";
import { pluginValidator } from "@plugins/core/PluginValidator";
import type { PluginConfig } from "@plugins/types";
import assert from "assert";
import { toast } from "ics-ui-kit/components/toast";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { usePluginsTable } from "./usePluginsTable";

const BUILT_IN_MODULE_HANDLERS = new Map(BUILT_IN_PLUGIN_DEFINITIONS.map((def) => [def.id, def] as const));

const PluginsComponent = () => {
	const { settings, updatePlugins, ensurePluginsLoaded, isInitialLoading, isRefreshing, getTabError } = useSettings();
	const serverPlugins = useMemo(
		() => (settings?.plugins?.plugins ?? []).filter((p) => !(p.metadata.isBuiltIn && !p.metadata.navigateTo)),
		[settings?.plugins?.plugins],
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const serverPluginsMap = useMemo(() => new Map(serverPlugins.map((p) => [p.metadata.id, p])), [serverPlugins]);

	const savePlugins = useCallback(
		async (plugins: PluginConfig[]) => {
			const realPlugins = plugins.filter((p) => !BUILT_IN_MODULE_HANDLERS.has(p.metadata.id));
			const settingsToSave: PluginsSettings = {
				plugins: realPlugins,
			};
			await updatePlugins(settingsToSave);
		},
		[updatePlugins],
	);
	const handleToggleState = useCallback(
		async (pluginId: string, isDisabled: boolean) => {
			try {
				const newDisabled = !isDisabled;

				const moduleDef = BUILT_IN_MODULE_HANDLERS.get(pluginId);
				if (moduleDef) {
					const plugin = serverPluginsMap.get(pluginId);
					const currentSettings = moduleDef.getSettings(settings);
					if (plugin?.metadata.onSave && currentSettings) {
						const newSettings = { ...currentSettings, enabled: !newDisabled };
						await plugin.metadata.onSave(newSettings);
					}
					return;
				}

				const updatedPlugins = serverPlugins
					.filter((p) => !BUILT_IN_MODULE_HANDLERS.has(p.metadata.id)) // Filter out modules from save
					.map((plugin) =>
						plugin.metadata.id === pluginId
							? { ...plugin, metadata: { ...plugin.metadata, disabled: newDisabled } }
							: plugin,
					);
				await savePlugins(updatedPlugins);
			} catch (e) {
				toast(e?.message);
			}
		},
		[serverPlugins, serverPluginsMap, settings, savePlugins],
	);

	const handleDeletePlugin = useCallback(
		(pluginId: string, pluginName: string) => {
			const modalId = ModalToOpenService.addModal<ComponentProps<typeof DefaultModal>>(ModalToOpen.DefaultModal, {
				title: t("plugins.delete-modal.title"),
				content: t("plugins.delete-modal.content").replace("{name}", pluginName),
				primaryButtonProps: {
					text: t("plugins.delete-modal.confirm"),
					onClick: async () => {
						try {
							const updatedPlugins = serverPlugins.filter((p) => p.metadata.id !== pluginId);
							await savePlugins(updatedPlugins);
						} catch (e) {
							toast(e?.message);
						}
						ModalToOpenService.removeModal(modalId);
					},
				},
				secondaryButtonProps: {
					text: t("plugins.delete-modal.cancel"),
					onClick: () => ModalToOpenService.removeModal(modalId),
				},
				onClose: () => ModalToOpenService.removeModal(modalId),
			});
		},
		[serverPlugins, savePlugins],
	);

	const { table, plugins, getSelectedCount, getSelectedItems, resetSelection } = usePluginsTable({
		serverPlugins,
		onDelete: handleDeletePlugin,
		onToggleState: handleToggleState,
	});

	const selectedCount = getSelectedCount();

	const handleDeleteSelected = useCallback(() => {
		const selectedItems = getSelectedItems();
		const selectedIds = new Set(selectedItems.map((row) => row.id));
		const count = selectedItems.length;

		const modalId = ModalToOpenService.addModal<ComponentProps<typeof DefaultModal>>(ModalToOpen.DefaultModal, {
			title: t("plugins.delete-modal.title"),
			content: t("confirmation.delete.body")
				.replace("{count}", count.toString())
				.replace("{item}", count === 1 ? t("record") : t("records")),
			primaryButtonProps: {
				text: t("plugins.delete-modal.confirm"),
				onClick: async () => {
					setIsDeleting(true);
					try {
						const updatedPlugins = serverPlugins.filter((p) => !selectedIds.has(p.metadata.id));
						await savePlugins(updatedPlugins);
						resetSelection();
					} catch (e) {
						toast(e?.message);
					} finally {
						setIsDeleting(false);
					}
					ModalToOpenService.removeModal(modalId);
				},
			},
			secondaryButtonProps: {
				text: t("plugins.delete-modal.cancel"),
				onClick: () => ModalToOpenService.removeModal(modalId),
			},
			onClose: () => ModalToOpenService.removeModal(modalId),
		});
	}, [getSelectedItems, serverPlugins, savePlugins, resetSelection]);

	const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);
		if (files.length === 0) return;

		try {
			const pluginConfig = await PluginFileParser.parseFromFiles(files);
			const validationResult = pluginValidator.validateFiles(pluginConfig);
			if (!validationResult.valid) {
				throw new Error(validationResult.errors.join("; "));
			}
			assert(
				serverPlugins.some((p) => p.metadata.id === pluginConfig.metadata.id) === false,
				t("plugins.messages.already-exists").replace("{id}", pluginConfig.metadata.id),
			);

			const updatedPlugins = [...serverPlugins, pluginConfig];
			await savePlugins(updatedPlugins);
		} catch (e) {
			toast(e?.message || t("plugins.messages.load-error").replace("{name}", "plugin"));
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const triggerFileSelect = () => fileInputRef.current?.click();

	const tabError = getTabError("plugins");

	if (isInitialLoading("plugins")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensurePluginsLoaded(true)} />;
	}

	return (
		<div>
			<Input
				ref={fileInputRef}
				type="file"
				{...{ webkitdirectory: "", directory: "" }}
				multiple
				onChange={handleFolderSelect}
				style={{ display: "none" }}
			/>

			<PluginsHeader
				isRefreshing={isRefreshing("plugins")}
				onAddClick={triggerFileSelect}
				selectedCount={selectedCount}
				loading={isDeleting}
				onDeleteSelected={handleDeleteSelected}
			/>
			<div className="px-6">
				{plugins.length === 0 ? (
					<PluginsEmptyState onUploadClick={triggerFileSelect} />
				) : (
					<PluginsTable table={table} />
				)}
			</div>
		</div>
	);
};

export default PluginsComponent;
