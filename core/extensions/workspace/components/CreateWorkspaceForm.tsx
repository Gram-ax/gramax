import resolveModule from "@app/resolveModule/frontend";
import useLucideIconLists, { useIconFilter } from "@components/Atoms/Icon/lucideIconList";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type { FormProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import { useCreateWorkspaceActions } from "@ext/workspace/components/logic/useCreateWorkspaceActions";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { LazySearchSelect } from "@ui-kit/LazySearchSelect";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { type FormEvent, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface WorkspaceSettingsModalProps {
	onSubmit?: (props: ClientWorkspaceConfig) => void;
}

const CreateWorkspaceForm = (props: WorkspaceSettingsModalProps) => {
	const { onSubmit: onSubmitParent } = props;

	const { open, setOpen, originalProps, workspaces, pathPlaceholder, onSubmit } = useCreateWorkspaceActions();
	const { isTauri } = usePlatform();
	const askPath = isTauri;

	const isNameUnique = (name: string) => name.length > 0 && !workspaces.find((w) => w.name === name);
	const isPathValid = (path: string) => path.length > 0 && !workspaces.find((w) => w.path === path);

	const formSchema = z.object({
		name: z
			.string()
			.min(2, { message: t("space-name-min-length") })
			.refine(isNameUnique, { message: t("cant-be-same-name") }),
		icon: z.optional(z.string()),
		path: z.optional(
			z
				.string()
				.min(2, { message: t("space-name-min-length") })
				.refine(isPathValid, { message: t("cant-be-same-path") }),
		),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: originalProps,
		mode: "onChange",
	});

	const formSubmit = (e: FormEvent) => {
		form.handleSubmit(async (data) => {
			await onSubmit({ name: data.name, icon: data.icon, path: data.path }, onCloseHandler);
			onSubmitParent?.(data as ClientWorkspaceConfig);
			form.reset();
		})(e);
	};

	const onCloseHandler = useCallback(() => {
		setOpen(false);
		ModalToOpenService.resetValue();
	}, []);

	const formProps: FormProps = useMemo(() => {
		return {
			labelClassName: "w-44",
		};
	}, []);

	return (
		<Modal
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) onCloseHandler();
			}}
			open={open}
		>
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
												<div className="flex gap-4">
													<Input
														{...field}
														data-qa={t("working-directory")}
														placeholder={pathPlaceholder}
														readOnly
														title={field.value}
													/>
													<Button
														onClick={async () => {
															const module = await resolveModule(
																"openDirectory" as any,
															)();
															const dir = module || field.value;
															field.onChange(dir);
														}}
														style={{ height: "auto", minWidth: "max-content" }}
														type="button"
													>
														{t("open")}
													</Button>
												</div>
											)}
											name="path"
											required
											title={t("working-directory")}
											{...formProps}
										/>
									)}
								</FormStack>
							</ModalBody>
							<FormFooter
								primaryButton={<Button children={t("save")} type="submit" variant="primary" />}
								secondaryButton={
									<Button
										children={t("cancel")}
										onClick={onCloseHandler}
										type="button"
										variant="text"
									/>
								}
							/>
						</form>
					</Form>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default CreateWorkspaceForm;
