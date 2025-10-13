import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import t from "@ext/localization/locale/translate";
import { Textarea } from "@ui-kit/Textarea";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Button } from "@ui-kit/Button";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import { useBugsnag } from "@ext/bugsnag/logic/useBugsnag";
import BugsnagMessageDetails from "@ext/bugsnag/components/BugsnagMessageDetails";
import Icon from "@components/Atoms/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import styled from "@emotion/styled";

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const BugsnagModal = ({ itemLogicPath, onClose }: { itemLogicPath: string; onClose: () => void }) => {
	const [open, setOpen] = useState(true);

	const { onSubmit, getTechDetails } = useBugsnag(itemLogicPath);

	const schema = z.object({
		description: z.string().optional().default(""),
		detail: z.boolean().default(false),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		mode: "onChange",
	});

	const formSubmit = (e) => {
		form.handleSubmit((data) => {
			onSubmit({
				description: data.description,
				bAttach: data.detail,
			});
		})(e);
	};

	const onOpenChange = (open: boolean) => {
		setOpen(open);
		if (!open) onClose?.();
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalContent data-modal-root>
				<ModalErrorHandler onError={() => {}} onClose={() => onOpenChange(false)}>
					<Form asChild {...form}>
						<form className="contents ui-kit" onSubmit={formSubmit}>
							<FormHeader
								icon={"bug"}
								title={t("bug-report.modal.title")}
								description={t("bug-report.modal.description")}
							/>
							<ModalBody>
								<FormStack>
									<FormField
										name="description"
										title={t("description")}
										labelClassName="w-20"
										control={({ field }) => (
											<Textarea {...field} rows={5} placeholder={t("bug-report.describe")} />
										)}
									/>
								</FormStack>
							</ModalBody>
							<FormFooter
								primaryButton={<Button type="submit">{t("send")}</Button>}
								leftContent={
									<Wrapper>
										<CheckboxField
											label={t("bug-report.attach-tech-details")}
											onCheckedChange={(checked) =>
												form.setValue("detail", checked as unknown as boolean)
											}
											checked={form.watch("detail")}
										/>
										<Tooltip delayDuration={0}>
											<TooltipContent>{t("bug-report.this-will-help-us")}</TooltipContent>
											<TooltipTrigger asChild className="text-gray-500">
												<Icon code="circle-question-mark" isAction />
											</TooltipTrigger>
										</Tooltip>
										<BugsnagMessageDetails getDetails={getTechDetails} />
									</Wrapper>
								}
							/>
						</form>
					</Form>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default BugsnagModal;
