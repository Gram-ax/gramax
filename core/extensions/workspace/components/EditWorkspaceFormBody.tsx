import { usePlatform } from "@core-ui/hooks/usePlatform";
import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import type { FormProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import t from "@ext/localization/locale/translate";
import { PopoverIconPicker } from "@ext/markdown/elements/icon/edit/components/IconPicker/PopoverIconPicker";
import type { SidebarItem } from "@ext/settings/components/AppSettingsSidebarTabsRenderer";
import { useRegisterSettingsSave, useReportSettingsDirty } from "@ext/settings/components/SettingsDirtyContext";
import AiSettingsFields from "@ext/settings/components/sections/AiSettingsFields";
import ServicesSection from "@ext/settings/components/sections/ServicesSection";
import { createAiSchema, servicesSchema } from "@ext/settings/logic/formSchema";
import { useUpdateSettings } from "@ext/settings/logic/hooks";
import EditCustomTheme from "@ext/workspace/components/EditCustomTheme";
import { useWorkspaceEditorActions } from "@ext/workspace/components/logic/useWorkspaceEditorActions";
import { getWorkspaceServicesDiff } from "@ext/workspace/components/logic/workspaceServicesDiff";
import { useWorkspaceAi } from "@ext/workspace/components/useWorkspaceAi";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Loader } from "@ui-kit/Loader";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const WORKSPACE_TABS = {
	general: { type: "button", key: "general", icon: "settings" as const, label: "name" },
	appearance: { type: "button", key: "appearance", icon: "id-card" as const, label: "workspace.appearance" },
	services: { type: "button", key: "services", icon: "server" as const, label: "app-settings.tabs.services" },
	ai: { type: "button", key: "ai", icon: "sparkles" as const, label: "workspace.set-ai-server" },
} satisfies Record<string, SidebarItem>;

export type WorkspaceTab = (typeof WORKSPACE_TABS)[keyof typeof WORKSPACE_TABS]["key"];

export interface EditWorkspaceFormBodyProps {
	workspace: ClientWorkspaceConfig;
	activeTab?: WorkspaceTab;
	onSubmit?: (props: ClientWorkspaceConfig) => void;
	onClose?: () => void;
}

const EditWorkspaceFormBody = ({
	workspace,
	activeTab = "general",
	onSubmit: onSubmitParent,
	onClose,
}: EditWorkspaceFormBodyProps) => {
	const {
		originalProps,
		workspaces,
		pathPlaceholder,
		removeWorkspace,
		onSubmit,
		workspaceLogoProps,
		workspaceStyleProps,
	} = useWorkspaceEditorActions(workspace);

	const {
		saveData: saveAiData,
		checkServer: checkAiServer,
		getData: getAiData,
		checkToken: checkAiToken,
		isChecking: isAiChecking,
		isSaving: isAiSaving,
	} = useWorkspaceAi(workspace.path);

	const { isTauri, isDocportal } = usePlatform();
	const askPath = isTauri;

	const isNameUnique = (name: string) =>
		name.length > 0 && !workspaces.find((w) => w.path !== originalProps.path && w.name === name);

	const isPathValid = (path: string) => path.length > 0;

	const formSchema = z.object({
		name: z
			.string()
			.min(2, { message: t("space-name-min-length") })
			.refine(isNameUnique, { message: t("cant-be-same-name") }),
		icon: z.optional(z.string()),
		logo: z.object({ light: z.null().optional(), dark: z.null().optional() }).optional(),
		path: z.optional(
			z
				.string()
				.min(2, { message: t("space-name-min-length") })
				.refine(isPathValid, { message: t("cant-be-same-path") }),
		),
		lfs: z.object({ patterns: z.optional(z.array(z.string())) }).optional(),
		settings: z
			.object({
				services: servicesSchema.optional(),
			})
			.optional(),
		ai: createAiSchema({
			checkServer: checkAiServer,
			checkToken: checkAiToken,
		}),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: async () => {
			const ai = await getAiData();
			return {
				...originalProps,
				lfsPatterns: originalProps.git?.lfs ?? [],
				settings: {
					services: {
						"web-editor": { endpoint: originalProps.settings?.services?.["web-editor"]?.endpoint ?? "" },
						auth: { endpoint: originalProps.settings?.services?.auth?.endpoint ?? "" },
						"diagram-renderer": {
							endpoint: originalProps.settings?.services?.["diagram-renderer"]?.endpoint ?? "",
						},
						"git-proxy": { endpoint: originalProps.settings?.services?.["git-proxy"]?.endpoint ?? "" },
					},
				},
				ai: { endpoint: ai?.aiApiUrl, token: ai?.aiToken },
			};
		},
		mode: "onChange",
	});

	useReportSettingsDirty(form.formState.isDirty);

	const onCloseHandler = useCallback(() => onClose?.(), [onClose]);
	const updateSettings = useUpdateSettings("workspace");

	const submitForm = useCallback(async () => {
		await form.handleSubmit(async (data) => {
			const origServices = originalProps.settings?.services ?? {};
			const newServices = data.settings?.services ?? {};
			const patch = getWorkspaceServicesDiff(origServices, newServices);

			if (Object.keys(patch).length > 0) {
				await updateSettings(patch);
			}

			if (data.ai)
				await saveAiData({
					apiUrl: data.ai.endpoint ?? "",
					token: data.ai.token ?? "",
				});

			await onSubmit(
				{
					name: data.name,
					icon: data.icon,
					path: data.path,
					settings: data.settings,
				},
				onCloseHandler,
			);
			onSubmitParent?.(data as ClientWorkspaceConfig);
		})();
	}, [form, originalProps, updateSettings, saveAiData, onSubmit, onCloseHandler, onSubmitParent]);

	// The unsaved-changes guard's "Save and close" submits this form.
	useRegisterSettingsSave(submitForm);

	const formSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		return submitForm();
	};

	const formProps: FormProps = useMemo(() => ({ labelClassName: "w-max" }), []);

	const renderGeneral = () => (
		<SectionContainer>
			<FormField
				control={({ field }) => (
					<Input {...field} autoFocus data-qa={t("name")} placeholder={t("workspace.enter-name")} />
				)}
				layout="vertical"
				name="name"
				required
				title={t("name")}
				{...formProps}
			/>
			<FormField
				control={({ field }) => (
					<PopoverIconPicker
						disable={["emoji", "file-input", "color"]}
						label={field.value ? field.value : t("icon")}
						onChange={(value) => "code" in value && field.onChange(value.code)}
						onClear={() => field.onChange(undefined)}
						value={field.value ? { code: field.value } : undefined}
					/>
				)}
				layout="vertical"
				name="icon"
				title={t("icon")}
				{...formProps}
			/>
			{askPath && (
				<FormField
					control={({ field }) => (
						<Input
							{...field}
							data-qa={t("working-directory")}
							placeholder={pathPlaceholder}
							readOnly
							title={field.value}
						/>
					)}
					layout="vertical"
					name="path"
					required
					title={t("working-directory")}
					{...formProps}
				/>
			)}
		</SectionContainer>
	);

	const renderAppearance = () =>
		originalProps.path ? (
			<EditCustomTheme {...workspaceStyleProps} {...workspaceLogoProps} form={form} formProps={formProps} />
		) : (
			<div className="text-sm text-muted">{t("workspace.appearance")}</div>
		);

	const renderAi = () => <AiSettingsFields isChecking={isAiChecking} labelClassName="w-44" prefix="ai" />;

	const renderServices = () => <ServicesSection disabled={isDocportal} prefix="settings.services" />;

	const renderTab = () => {
		if (activeTab === "appearance") return renderAppearance();
		if (activeTab === "services") return renderServices();
		if (activeTab === "ai") return renderAi();
		return renderGeneral();
	};

	return (
		<Form asChild {...form}>
			<form className="flex flex-col h-full min-h-0" onSubmit={formSubmit}>
				<div className="flex-1 min-h-0 overflow-hidden">{renderTab()}</div>
				<FormFooter
					className="flex-shrink-0"
					leftContent={
						<Button onClick={() => removeWorkspace(onCloseHandler)} type="button" variant="text">
							{t("delete")}
						</Button>
					}
					primaryButton={
						<Button disabled={!!isAiChecking || isAiSaving || isDocportal} type="submit" variant="primary">
							{isAiSaving && <Loader size="sm" />}
							{t("save")}
						</Button>
					}
				/>
			</form>
		</Form>
	);
};

export default EditWorkspaceFormBody;
