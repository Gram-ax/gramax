import { iconFilter, toListItem, lucideIconListForUikit } from "@components/Atoms/Icon/lucideIconList";
import ListLayoutByUikit from "@components/List/ListLayoutByUikit";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { FormProps } from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import Footer from "@ext/catalog/actions/propsEditor/components/ModalFooter";
import Header from "@ext/catalog/actions/propsEditor/components/ModalHeader";
import t from "@ext/localization/locale/translate";
import EditAIServer from "@ext/workspace/components/EditAIServer";
import EditCustomTheme from "@ext/workspace/components/EditCustomTheme";
import { useWorkspaceEditorActions } from "@ext/workspace/components/logic/useWorkspaceEditorActions";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Form, FormField, FormSectionTitle } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { useCallback, useMemo, SetStateAction, Dispatch } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface WorkspaceSettingsModalProps {
	workspace: ClientWorkspaceConfig;
	onSubmit?: (props: ClientWorkspaceConfig) => void;
	onClose?: () => void;
	onOpenChange?: Dispatch<SetStateAction<boolean>>;
	trigger?: JSX.Element;
}

const EditWorkspaceForm = (props: WorkspaceSettingsModalProps) => {
	const { workspace, onOpenChange, onSubmit: onSubmitParent, onClose, trigger } = props;

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

	const { isTauri } = usePlatform();
	const askPath = isTauri;

	const isNameUnique = (name: string) =>
		name.length > 0 && !workspaces.find((w) => w.path !== originalProps.path && w.name === name);

	const isPathValid = (path: string) => path.length > 0;

	const formSchema = z.object({
		name: z
			.string()
			.min(1)
			.refine(isNameUnique, { message: t("cant-be-same-name") }),
		icon: z.optional(z.string()),
		path: z.optional(
			z
				.string()
				.min(1)
				.refine(isPathValid, { message: t("cant-be-same-path") }),
		),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: originalProps,
		mode: "onChange",
	});

	const onOpenChangeHandler = useCallback(
		(value: boolean) => {
			setOpen(value);
			onOpenChange?.(value);
		},
		[onOpenChange],
	);

	const onCloseHandler = useCallback(() => {
		onOpenChangeHandler(false);
		onClose?.();
	}, [onClose, onOpenChangeHandler]);

	const formSubmit = (e) => {
		form.handleSubmit(async (data) => {
			await onSubmit({ name: data.name, icon: data.icon, path: data.path }, onCloseHandler);
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
			{trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
			<ModalContent data-modal-root>
				<Form {...form}>
					<form className="contents" onSubmit={formSubmit}>
						<Header title={t("workspace.edit")} description={t("workspace.configure-your-workspace")} />
						<ModalBody className="space-y-4">
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
										items={lucideIconListForUikit}
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
										formProps={formProps}
									/>
								</>
							)}
						</ModalBody>
						<Footer
							primaryButton={<Button type="submit" variant="primary" children={t("save")} />}
							leftButton={
								<>
									<Button
										onClick={() => removeWorkspace(onCloseHandler)}
										type="button"
										variant="text"
										children={t("delete")}
									/>
									<EditAIServer
										workspacePath={workspace.path}
										trigger={
											<Button
												type="button"
												variant="text"
												children={t("workspace.button-ai-server")}
											/>
										}
									/>
								</>
							}
						/>
					</form>
				</Form>
			</ModalContent>
		</Modal>
	);
};

export default EditWorkspaceForm;
