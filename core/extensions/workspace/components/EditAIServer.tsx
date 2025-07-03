import { FormEvent, MouseEvent, ReactElement, useMemo, useState } from "react";
import t from "@ext/localization/locale/translate";
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from "@ui-kit/Modal";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter, FormStack } from "@ui-kit/Form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import { AiServerConfig } from "@ext/ai/models/types";
import { Input } from "@ui-kit/Input";
import { FormProps } from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import { useWorkspaceAi } from "@ext/workspace/components/useWorkspaceAi";

interface EditAIServerProps {
	trigger: ReactElement;
	workspacePath: string;
}

const EditAIServer = ({ trigger, workspacePath }: EditAIServerProps) => {
	const [open, setOpen] = useState(false);
	const { saveData, checkServer, isEdit, fetchData, deleteData, checkToken } = useWorkspaceAi(workspacePath);

	const validateServer = async ({ apiUrl }: { apiUrl?: string }) => {
		const isAvailable = await checkServer(apiUrl);
		return isAvailable;
	};

	const validateToken = async ({ apiUrl, token }: { apiUrl?: string; token?: string }) => {
		const valid = await checkToken(apiUrl, token);
		return valid;
	};

	const createSchema = z
		.object({
			apiUrl: z.string().min(5).optional().or(z.literal("")),
			token: z.string().min(5).optional().or(z.literal("")),
		})
		.refine(
			async (val) => {
				if (!val.apiUrl.length) return true;
				const valid = await validateServer(val);
				return valid;
			},
			{ message: t("workspace.ai-server-error"), path: ["apiUrl"] },
		)
		.refine(
			async (val) => {
				if (!val.apiUrl.length || !val.token.length) return true;
				const valid = await validateToken(val);
				return valid;
			},
			{ message: t("workspace.ai-token-error"), path: ["token"] },
		);

	const editSchema = z.object({
		apiUrl: z.string().readonly(),
	});

	const form = useForm<z.infer<typeof createSchema | typeof editSchema>>({
		resolver: zodResolver(isEdit ? editSchema : createSchema),
		defaultValues: async () => await fetchData(),
		mode: "onChange",
	});

	const setAiServer = async ({ apiUrl, token }: AiServerConfig) => {
		await saveData({ apiUrl, token });
		setOpen(false);
		refreshPage();
	};

	const formSubmit = (e: FormEvent<HTMLFormElement>) => {
		form.handleSubmit(setAiServer)(e);
		e.stopPropagation();
	};

	const formProps: FormProps = useMemo(() => {
		return {
			labelClassName: "w-44",
		};
	}, []);

	const onDeleteClick = async (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		e.preventDefault();

		if (!(await confirm(t("workspace.delete-ai-server")))) return;

		await deleteData();
		setOpen(false);
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			{trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
			<ModalContent>
				<Form asChild {...form}>
					<form className="contents ui-kit" onSubmit={formSubmit}>
						<ModalHeader>
							<ModalTitle>{t("workspace.set-ai-server")}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<FormStack>
								<FormField
									name="apiUrl"
									title={t("workspace.ai-server-url")}
									description={t("workspace.ai-server-url-description")}
									control={({ field }) => (
										<Input {...field} placeholder="https://your-ai-server.com" readOnly={isEdit} />
									)}
									{...formProps}
								/>
								{!isEdit ? (
									<FormField
										name="token"
										title={t("workspace.ai-server-token")}
										description={t("workspace.ai-server-token-description")}
										control={({ field }) => (
											<Input {...field} type="password" placeholder="your-server-token" />
										)}
										{...formProps}
									/>
								) : null}
							</FormStack>
						</ModalBody>
						<FormFooter
							primaryButton={<Button hidden variant="primary" children={t("save")} disabled={isEdit} />}
							secondaryButton={
								isEdit && <Button variant="text" children={t("delete")} onClick={onDeleteClick} />
							}
						/>
					</form>
				</Form>
			</ModalContent>
		</Modal>
	);
};

export default EditAIServer;
