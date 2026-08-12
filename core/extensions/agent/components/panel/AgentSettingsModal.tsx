import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { TextInput } from "@ui-kit/Input";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
	key: z.string().min(1, t("agent.settings.key-required")),
});

type FormData = z.infer<typeof schema>;

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (key: string) => void;
	defaultKey?: string;
};

export const AgentSettingsModal = ({ open, onOpenChange, onSave, defaultKey = "" }: Props) => {
	const form = useForm<FormData>({
		resolver: zodResolver(schema),
		mode: "onChange",
		defaultValues: { key: defaultKey },
	});

	useEffect(() => {
		if (open) form.reset({ key: defaultKey });
	}, [open, defaultKey, form]);

	const onSubmit = (data: FormData) => {
		onSave(data.key);
		onOpenChange(false);
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent data-modal-root>
				<Form asChild {...form} className="border-0">
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FormHeader title={t("agent.settings.title")} />
						<DialogBody>
							<FormStack>
								<FormField
									control={({ field }) => (
										<TextInput {...field} placeholder={t("agent.settings.key-placeholder")} />
									)}
									layout="vertical"
									name="key"
									title={t("agent.settings.key-label")}
								/>
							</FormStack>
						</DialogBody>
						<FormFooter
							className="flex flex-col gap-4"
							primaryButton={<Button type="submit">{t("agent.settings.save")}</Button>}
						/>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
