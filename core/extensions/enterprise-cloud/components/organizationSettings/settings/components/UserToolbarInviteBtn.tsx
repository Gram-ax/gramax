import validateEmail from "@core/utils/validateEmail";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createFormSchema = (existingUsers: string[]) =>
	z.object({
		email: z
			.string()
			.trim()
			.refine((email) => validateEmail(email), {
				message: t("enterprise-guest.validationErrors.emailInvalidFormat"),
			})
			.refine((email) => !existingUsers.includes(email), {
				message: t("enterprise.admin.users.errors.exists"),
			}),
	});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface UserInviteModalProps {
	onInvite: (email: string) => Promise<void>;
	existingUsers: string[];
	onClose: () => void;
}

export const GesCloudInviteUserModal = ({ onInvite, existingUsers, onClose }: UserInviteModalProps) => {
	const [open, setOpen] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const onOpenChangeHandler = useCallback(
		(value: boolean) => {
			setOpen(value);
			if (!value) onClose();
		},
		[onClose],
	);

	const formSchema = createFormSchema(existingUsers);
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
		},
	});

	const handleInviteUser = useCallback(
		async (data: FormData) => {
			if (isLoading) return;

			setIsLoading(true);
			try {
				await onInvite(data.email);
				form.reset();
				onOpenChangeHandler(false);
			} finally {
				setIsLoading(false);
			}
		},
		[form, onInvite, isLoading, onOpenChangeHandler],
	);

	const handleCancel = useCallback(() => {
		if (!isLoading) {
			form.reset();
			onOpenChangeHandler(false);
		}
	}, [form, isLoading, onOpenChangeHandler]);

	const email = form.watch("email");

	const isSubmitDisabled = !email || isLoading || !form.formState.isValid;

	return (
		<Dialog onOpenChange={onOpenChangeHandler} open={open}>
			<DialogContent data-modal-root>
				<Form asChild {...form}>
					<form onSubmit={form.handleSubmit(handleInviteUser)}>
						<FormHeader
							description={t("enterprise-cloud.org-settings.users.invite-form.description")}
							icon="user-plus"
							title={t("enterprise-cloud.org-settings.users.invite-form.title")}
						/>
						<DialogBody>
							<FormStack>
								<FormField
									control={({ field }) => (
										<Input
											placeholder={t("enterprise-cloud.org-settings.users.email-placeholder")}
											type="email"
											{...field}
										/>
									)}
									layout="vertical"
									name="email"
									required
									title={t("enterprise-cloud.org-settings.users.email")}
								/>
							</FormStack>
						</DialogBody>
						<FormFooter
							primaryButton={
								isLoading ? (
									<LoadingButtonTemplate
										text={t("enterprise-cloud.org-settings.users.invite")}
										variant="primary"
									/>
								) : (
									<Button disabled={isSubmitDisabled} type="submit">
										{t("enterprise-cloud.org-settings.users.invite")}
									</Button>
								)
							}
							secondaryButton={
								<Button disabled={isLoading} onClick={handleCancel} type="button" variant="outline">
									{t("cancel")}
								</Button>
							}
						/>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

interface UserToolbarInviteBtnProps {
	disabled?: boolean;
	onInvite: (email: string) => Promise<void>;
	existingUsers?: string[];
}

export const UserToolbarInviteBtn = ({
	disabled: disable,
	onInvite,
	existingUsers = [],
}: UserToolbarInviteBtnProps) => {
	const handleClick = useCallback(() => {
		const modalId = ModalToOpenService.addModal(ModalToOpen.GesCloudInviteUser, {
			onInvite,
			existingUsers,
			onClose: () => ModalToOpenService.removeModal(modalId),
		});
	}, [onInvite, existingUsers]);

	return (
		<Button className="ml-auto" disabled={disable} onClick={handleClick} startIcon="user-plus" variant="outline">
			{t("enterprise-cloud.org-settings.users.invite")}
		</Button>
	);
};
