import type DefaultModal from "@core-ui/ContextServices/ModalToOpenService/components/DefaultModal";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { BUILT_IN_PLUGIN_DEFINITIONS, useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import {
	getPluginsTableColumns,
	type PluginTableRow,
} from "@ext/enterprise/components/admin/settings/plugins/PluginPage/PluginsTableConfig";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { GesError, toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { getSaveErrorText } from "@ext/enterprise/errors/getGesErrorText";
import type { PluginsSettings } from "@ext/enterprise/types/PluginsSettings";
import t from "@ext/localization/locale/translate";
import { PluginFileParser } from "@plugins/core/PluginFileParser";
import { pluginValidator } from "@plugins/core/PluginValidator";
import type { PluginConfig } from "@plugins/types";
import { toast } from "@ui-kit/Toast";
import assert from "assert";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useRef } from "react";

const getPluginRowId = (p: PluginTableRow) => p.id;

const BUILT_IN_MODULE_HANDLERS = new Map(BUILT_IN_PLUGIN_DEFINITIONS.map((def) => [def.id, def] as const));

export const usePluginsViewModel = () => {
	const { settings, gesUrl, update, ensureLoaded, isInitialLoading, isRefreshing, getTabError } = useSettings();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const serverPlugins = useMemo(
		() => (settings?.plugins?.plugins ?? []).filter((p) => !(p.metadata.isBuiltIn && !p.metadata.navigateTo)),
		[settings?.plugins?.plugins],
	);
	const serverPluginsMap = useMemo(() => new Map(serverPlugins.map((p) => [p.metadata.id, p])), [serverPlugins]);

	const savePlugins = useCallback(
		async (plugins: PluginConfig[]) => {
			const realPlugins = plugins.filter((p) => !BUILT_IN_MODULE_HANDLERS.has(p.metadata.id));
			const settingsToSave: PluginsSettings = { plugins: realPlugins };
			await update("plugins", settingsToSave);
		},
		[update],
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
						await plugin.metadata.onSave({ ...currentSettings, enabled: !newDisabled });
					}
					return;
				}

				const updatedPlugins = serverPlugins
					.filter((p) => !BUILT_IN_MODULE_HANDLERS.has(p.metadata.id))
					.map((plugin) =>
						plugin.metadata.id === pluginId
							? { ...plugin, metadata: { ...plugin.metadata, disabled: newDisabled } }
							: plugin,
					);
				await savePlugins(updatedPlugins);
			} catch (e) {
				toast(getSaveErrorText(toGesErrorCode(e), gesUrl));
			}
		},
		[serverPlugins, serverPluginsMap, settings, savePlugins, gesUrl],
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
							await savePlugins(serverPlugins.filter((p) => p.metadata.id !== pluginId));
						} catch (e) {
							toast(getSaveErrorText(toGesErrorCode(e), gesUrl));
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
		[serverPlugins, savePlugins, gesUrl],
	);

	const handleDeleteSelected = useCallback(
		(rows: PluginTableRow[]) => {
			const selectedIds = new Set(rows.map((row) => row.id));
			const count = rows.length;

			const modalId = ModalToOpenService.addModal<ComponentProps<typeof DefaultModal>>(ModalToOpen.DefaultModal, {
				title: t("plugins.delete-modal.title"),
				content: t("confirmation.delete.body")
					.replace("{count}", count.toString())
					.replace("{item}", count === 1 ? t("record") : t("records")),
				primaryButtonProps: {
					text: t("plugins.delete-modal.confirm"),
					onClick: async () => {
						try {
							await savePlugins(serverPlugins.filter((p) => !selectedIds.has(p.metadata.id)));
						} catch (e) {
							toast(getSaveErrorText(toGesErrorCode(e), gesUrl));
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
		[serverPlugins, savePlugins, gesUrl],
	);

	const handleFolderSelect = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(event.target.files || []);
			if (files.length === 0) return;

			try {
				const pluginConfig = await PluginFileParser.parseFromFiles(files);
				const validationResult = pluginValidator.validateFiles(pluginConfig);
				if (!validationResult.valid) throw new Error(validationResult.errors.join("; "));
				assert(
					serverPlugins.some((p) => p.metadata.id === pluginConfig.metadata.id) === false,
					t("plugins.messages.already-exists").replace("{id}", pluginConfig.metadata.id),
				);

				await savePlugins([...serverPlugins, pluginConfig]);
			} catch (e) {
				toast(e instanceof GesError ? getSaveErrorText(e.code, gesUrl) : e?.message);
			}

			if (fileInputRef.current) fileInputRef.current.value = "";
		},
		[serverPlugins, savePlugins, gesUrl],
	);

	const triggerFileSelect = useCallback(() => fileInputRef.current?.click(), []);

	// const handleRowClick = useCallback(
	// 	(row: PluginTableRow) => {
	// 		if (row.deleted) return;
	// 		if (row.isBuiltIn && row.navigateToPage) {
	// 			navigate(row.navigateToPage as Parameters<typeof navigate>[0]);
	// 		} else {
	// 			navigate(Page.PLUGIN_DETAIL, { selectedPluginId: row.id });
	// 		}
	// 	},
	// 	[navigate],
	// );

	const isRowDisabled = useCallback(
		(row: PluginTableRow) => (row.isBuiltIn ? t("plugins.messages.built-in-cannot-delete") : undefined),
		[],
	);

	const columns = useMemo(
		() => getPluginsTableColumns({ onDelete: handleDeletePlugin, onToggleState: handleToggleState }),
		[handleDeletePlugin, handleToggleState],
	);

	const tableData: PluginTableRow[] = useMemo(
		() =>
			serverPlugins.map((plugin) => ({
				id: plugin.metadata.id,
				name: plugin.metadata.name,
				version: plugin.metadata.version,
				disabled: plugin.metadata.disabled ?? false,
				deleted: false,
				isBuiltIn: plugin.metadata.isBuiltIn ?? false,
				navigateToPage: plugin.metadata.navigateTo,
			})),
		[serverPlugins],
	);

	const {
		rowSelection,
		setRowSelection,
		selectedRows: selectedPlugins,
	} = useRowSelectionWithData(tableData, getPluginRowId);

	return {
		columns,
		tableData,
		hasPlugins: serverPlugins.length > 0,
		fileInputRef,
		triggerFileSelect,
		handleFolderSelect,
		handleDeleteSelected,
		rowSelection,
		setRowSelection,
		selectedPlugins,
		isRowDisabled,
		isInitialLoading: isInitialLoading("plugins"),
		isRefreshing: isRefreshing("plugins"),
		tabError: getTabError("plugins"),
		retry: () => ensureLoaded("plugins", true),
	};
};
