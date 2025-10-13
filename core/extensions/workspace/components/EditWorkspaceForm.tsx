import Icon from "@components/Atoms/Icon";
import useLucideIconLists, { iconFilter, toListItem } from "@components/Atoms/Icon/lucideIconList";
import ListLayoutByUikit from "@components/List/ListLayoutByUikit";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type { FormProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import EditCustomTheme from "@ext/workspace/components/EditCustomTheme";
import { useWorkspaceEditorActions } from "@ext/workspace/components/logic/useWorkspaceEditorActions";
import { useWorkspaceAi } from "@ext/workspace/components/useWorkspaceAi";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Form, FormField, FormFooter, FormHeader, FormSectionTitle, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { TextInput } from "@ui-kit/Input";
import { Loader } from "ics-ui-kit/components/loader";
import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface WorkspaceSettingsModalProps {
	workspace: ClientWorkspaceConfig;
	onSubmit?: (props: ClientWorkspaceConfig) => void;
	onClose?: () => void;
	onOpenChange?: Dispatch<SetStateAction<boolean>>;
}

const EditWorkspaceForm = (props: WorkspaceSettingsModalProps) => {
	const { workspace, onOpenChange, onSubmit: onSubmitParent, onClose } = props;

	const {
		open,
		setOpen,
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

	const { isTauri } = usePlatform();
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
		logo: z
			.object({
				light: z.null().optional(),
				dark: z.null().optional(),
			})
			.optional(),
		path: z.optional(
			z
				.string()
				.min(2, { message: t("space-name-min-length") })
				.refine(isPathValid, { message: t("cant-be-same-path") }),
		),
		ai: z
			.object({
				apiUrl: z.string().optional().or(z.literal("")),
				token: z.string().optional().or(z.literal("")),
			})
			.refine(
				async (val) => {
					if (!val.apiUrl) return true;
					return await checkAiServer(val.apiUrl);
				},
				{ message: t("workspace.ai-server-error"), path: ["apiUrl"] },
			)
			.refine((val) => !(val.apiUrl && !val.token), {
				message: t("workspace.ai-token-set-error"),
				path: ["token"],
			})
			.refine(
				async (val) => {
					if (!val.apiUrl || !val.token) return true;
					return await checkAiToken(val.apiUrl, val.token);
				},
				{ message: t("workspace.ai-token-error"), path: ["token"] },
			)
			.optional(),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: async () => {
			const ai = await getAiData();
			return {
				...originalProps,
				ai: {
					apiUrl: ai?.aiApiUrl,
					token: ai?.aiToken,
				},
			};
		},
		mode: "onChange",
	});

	const onOpenChangeHandler = useCallback(
		(value: boolean) => {
			setOpen(value);
			onOpenChange?.(value);
			if (!value) {
				onClose?.();
				ModalToOpenService.resetValue();
			}
		},
		[onOpenChange, onClose],
	);

	const onCloseHandler = useCallback(() => {
		onOpenChangeHandler(false);
	}, [onOpenChangeHandler]);

	const formSubmit = (e) => {
		form.handleSubmit(async (data) => {
			await onSubmit({ name: data.name, icon: data.icon, path: data.path }, onCloseHandler);
			if (data.ai) await saveAiData({ apiUrl: data.ai.apiUrl, token: data.ai.token });
			onSubmitParent?.(data as ClientWorkspaceConfig);
		})(e);
	};

	const formProps: FormProps = useMemo(() => {
		return {
			labelClassName: "w-44",
		};
	}, []);

	return (
		<Modal open={open} onOpenChange={onOpenChangeHandler}>
			<ModalContent data-modal-root>
				<ModalErrorHandler onError={() => {}} onClose={onCloseHandler}>
					<Form asChild {...form}>
						<form className="contents" onSubmit={formSubmit}>
							<FormHeader
								icon={"settings"}
								title={t("workspace.edit")}
								description={t("workspace.configure-your-workspace")}
							/>
							<ModalBody>
								<FormStack>
									<FormField
										name="name"
										title={t("name")}
										required
										control={({ field }) => (
											<Input
												{...field}
												autoFocus
												placeholder={t("workspace.enter-name")}
												data-qa={t("name")}
											/>
										)}
										{...formProps}
									/>
									<FormField
										name="icon"
										title={t("icon")}
										control={({ field }) => (
											<ListLayoutByUikit
												placeholder={t("icon")}
												openByDefault={false}
												items={useLucideIconLists().lucideIconListForUikit}
												filterItems={iconFilter([], true)}
												item={toListItem({ code: field.value ?? "" })}
												onItemClick={(value) => {
													form.setValue("icon", value);
													field.value = value;
												}}
											/>
										)}
										{...formProps}
									/>
									{askPath && (
										<FormField
											name="path"
											title={t("working-directory")}
											required
											control={({ field }) => (
												<Input
													{...field}
													readOnly
													placeholder={pathPlaceholder}
													title={field.value}
													data-qa={t("working-directory")}
												/>
											)}
											{...formProps}
										/>
									)}
									{originalProps.path && (
										<>
											<Divider />
											<FormSectionTitle children={t("workspace.appearance")} />
											<EditCustomTheme
												{...workspaceStyleProps}
												{...workspaceLogoProps}
												form={form}
												formProps={formProps}
											/>
										</>
									)}

									<Divider />
									<FormSectionTitle children={t("workspace.set-ai-server")} />
									<FormField
										name="ai.apiUrl"
										title={t("workspace.ai-server-url")}
										description={t("workspace.ai-server-url-description")}
										control={({ field }) => (
											<TextInput
												{...field}
												placeholder="https://your-ai-server.com"
												endIcon={isAiChecking && <Loader style={{ padding: 0 }} size="md" />}
											/>
										)}
										{...formProps}
									/>
									<FormField
										name="ai.token"
										title={t("workspace.ai-server-token")}
										description={t("workspace.ai-server-token-description")}
										control={({ field }) => (
											<TextInput {...field} type="password" placeholder="your-server-token" />
										)}
										{...formProps}
									/>
								</FormStack>
							</ModalBody>
							<FormFooter
								primaryButton={
									<Button type="submit" variant="primary" disabled={!!isAiChecking || isAiSaving}>
										{isAiSaving && <Icon code="loader-circle" isLoading />}
										{t("save")}
									</Button>
								}
								leftContent={
									<>
										<Button
											onClick={() => removeWorkspace(onCloseHandler)}
											type="button"
											variant="text"
											children={t("delete")}
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

export default EditWorkspaceForm;
