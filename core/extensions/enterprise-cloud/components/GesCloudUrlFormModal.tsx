import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { type FormEvent, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface GesCloudUrlFormModalProps {
	onClose: () => void;
}

export const GesCloudUrlFormModal = ({ onClose }: GesCloudUrlFormModalProps) => {
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [open, setOpen] = useState(true);

	const formSchema = z.object({
		gesCloudUrl: z.string().min(1),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { gesCloudUrl: gesCloudUrl ?? "" },
		mode: "onChange",
	});

	const onCloseHandler = useCallback(() => {
		setOpen(false);
		onClose();
	}, [onClose]);

	const formSubmit = (e: FormEvent) => {
		void form.handleSubmit(async (data) => {
			await FetchService.fetch(apiUrlCreator.setGesCloudUrl(data.gesCloudUrl));
			if (gesCloudUrl !== data.gesCloudUrl) {
				window.location.reload();
			}
			onCloseHandler();
			const modalId = ModalToOpenService.addModal(ModalToOpen.GesCloudSignIn, {
				gesCloudUrl: data.gesCloudUrl,
				allowContinueWithoutAccount: false,
				onClose: () => ModalToOpenService.removeModal(modalId),
			});
		})(e);
	};

	return (
		<Dialog
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) onCloseHandler();
			}}
			open={open}
		>
			<DialogContent data-modal-root>
				<Form asChild {...form}>
					<form className="contents" onSubmit={formSubmit}>
						<FormHeader
							description={t("enterprise-cloud-url.description")}
							icon="cloud"
							title={t("enterprise-cloud-url.title")}
						/>
						<DialogBody>
							<FormStack>
								<FormField
									control={({ field }) => (
										<Input
											{...field}
											autoFocus
											placeholder={t("enterprise-cloud-url.placeholder")}
										/>
									)}
									name="gesCloudUrl"
									required
									title={t("enterprise-cloud-url.title")}
								/>
							</FormStack>
						</DialogBody>
						<FormFooter
							primaryButton={
								<Button type="submit" variant="primary">
									{t("continue")}
								</Button>
							}
							secondaryButton={
								<Button onClick={onCloseHandler} type="button" variant="text">
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

export default GesCloudUrlFormModal;
