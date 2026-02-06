import useLucideIconLists, { useIconFilter } from "@components/Atoms/Icon/lucideIconList";
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
import { Description } from "@ui-kit/Description";
import { Divider } from "@ui-kit/Divider";
import { Form, FormField, FormFooter, FormHeader, FormSectionTitle, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input, TextInput } from "@ui-kit/Input";
import { LazySearchSelect } from "@ui-kit/LazySearchSelect";
import { Loader } from "@ui-kit/Loader";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
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
		<Modal onOpenChange={onOpenChangeHandler} open={open}>
			<ModalContent data-modal-root>
				<ModalErrorHandler onClose={onCloseHandler} onError={() => {}}>
					<Form asChild {...form}>
						<form className="contents" onSubmit={formSubmit}>
							<FormHeader
								description={t("workspace.configure-your-workspace")}
								icon={"settings"}
								title={t("workspace.edit")}
							/>
							<ModalBody>
								<FormStack>
									<FormField
										control={({ field }) => (
											<Input
												{...field}
												autoFocus
												data-qa={t("name")}
												placeholder={t("workspace.enter-name")}
											/>
										)}
										name="name"
										required
										title={t("name")}
										{...formProps}
									/>
									<FormField
										control={({ field }) => {
											const iconFilter = useIconFilter();
											return (
												<LazySearchSelect
													filter={iconFilter}
													onChange={(value) => {
														form.setValue("icon", `${value}`);
														field.value = `${value}`;
													}}
													options={useLucideIconLists().lucideIconListForUikitOptions}
													placeholder={t("icon")}
													renderOption={({ option, type }) => (
														<>
															<div className="flex items-center gap-2">
																<Icon icon={option.value as string} />
																{option.value}
															</div>
															{type === "list" && field.value === option.value && (
																<Icon className="ml-auto" icon="check" />
															)}
														</>
													)}
													value={field.value}
												/>
											);
										}}
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
											name="path"
											required
											title={t("working-directory")}
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
									<Description
										className="font-sans text-sm font-normal tracking-tight text-muted"
										style={{ marginTop: "0.25rem" }}
									>
										{t("workspace.set-ai-server-description")}
										<a
											href="https://gram.ax/resources/docs/space/ai-open-source"
											rel="noreferrer"
											target="_blank"
										>
											<Button className="h-auto pt-0 pb-0 px-2" type="button" variant="link">
												{t("more")}
											</Button>
										</a>
									</Description>
									<FormField
										control={({ field }) => (
											<TextInput
												{...field}
												endIcon={isAiChecking && <Loader size="md" style={{ padding: 0 }} />}
												placeholder="https://your-ai-server.com"
											/>
										)}
										description={t("workspace.ai-server-url-description")}
										name="ai.apiUrl"
										title={t("workspace.ai-server-url")}
										{...formProps}
									/>
									<FormField
										control={({ field }) => (
											<TextInput {...field} placeholder="your-server-token" type="password" />
										)}
										description={t("workspace.ai-server-token-description")}
										name="ai.token"
										title={t("workspace.ai-server-token")}
										{...formProps}
									/>
								</FormStack>
							</ModalBody>
							<FormFooter
								leftContent={
									<>
										<Button
											children={t("delete")}
											onClick={() => removeWorkspace(onCloseHandler)}
											type="button"
											variant="text"
										/>
									</>
								}
								primaryButton={
									<Button disabled={!!isAiChecking || isAiSaving} type="submit" variant="primary">
										{isAiSaving && <Icon icon="loader-circle" />}
										{t("save")}
									</Button>
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
