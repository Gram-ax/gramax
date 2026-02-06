import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import BugsnagMessageDetails from "@ext/bugsnag/components/BugsnagMessageDetails";
import { useBugsnag } from "@ext/bugsnag/logic/useBugsnag";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { Textarea } from "@ui-kit/Textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
		<Modal onOpenChange={onOpenChange} open={open}>
			<ModalContent data-modal-root>
				<ModalErrorHandler onClose={() => onOpenChange(false)} onError={() => {}}>
					<Form asChild {...form}>
						<form className="contents ui-kit" onSubmit={formSubmit}>
							<FormHeader
								description={t("bug-report.modal.description")}
								icon={"bug"}
								title={t("bug-report.modal.title")}
							/>
							<ModalBody>
								<FormStack>
									<FormField
										control={({ field }) => (
											<Textarea {...field} placeholder={t("bug-report.describe")} rows={5} />
										)}
										labelClassName="w-20"
										name="description"
										title={t("description")}
									/>
								</FormStack>
							</ModalBody>
							<FormFooter
								leftContent={
									<Wrapper>
										<CheckboxField
											checked={form.watch("detail")}
											label={t("bug-report.attach-tech-details")}
											onCheckedChange={(checked) =>
												form.setValue("detail", checked as unknown as boolean)
											}
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
								primaryButton={<Button type="submit">{t("send")}</Button>}
							/>
						</form>
					</Form>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default BugsnagModal;
