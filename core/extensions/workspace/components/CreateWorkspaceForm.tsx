import resolveModule from "@app/resolveModule/frontend";
import useLucideIconLists, { iconFilter, toListItem } from "@components/Atoms/Icon/lucideIconList";
import ListLayoutByUikit from "@components/List/ListLayoutByUikit";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type { FormProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import { useCreateWorkspaceActions } from "@ext/workspace/components/logic/useCreateWorkspaceActions";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { FormEvent, useCallback, useMemo } from "react";
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
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) onCloseHandler();
			}}
		>
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
												<div className="flex gap-4">
													<Input
														{...field}
														readOnly
														placeholder={pathPlaceholder}
														title={field.value}
														data-qa={t("working-directory")}
													/>
													<Button
														type="button"
														style={{ height: "auto", minWidth: "max-content" }}
														onClick={async () => {
															const module = await resolveModule(
																"openDirectory" as any,
															)();
															const dir = module || field.value;
															field.onChange(dir);
														}}
													>
														{t("open")}
													</Button>
												</div>
											)}
											{...formProps}
										/>
									)}
								</FormStack>
							</ModalBody>
							<FormFooter
								primaryButton={<Button type="submit" variant="primary" children={t("save")} />}
								secondaryButton={
									<Button
										onClick={onCloseHandler}
										type="button"
										variant="text"
										children={t("cancel")}
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
