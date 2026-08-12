import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { ModalComponent } from "@ext/enterprise/components/admin/ui-kit/ModalComponent";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { TextInput } from "@ui-kit/Input";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isValidEmailDomain } from "../utils/isValidEmailDomain";

interface GuestsToolbarAddBtnProps {
	onAddDomain: (domain: string) => void;
	disabled?: boolean;
	existingDomains?: string[];
}

const createFormSchema = (existingDomains: string[]) =>
	z.object({
		domain: z
			.string()
			.min(1, t("enterprise.admin.guests.errors.domain-required"))
			.refine((domain) => isValidEmailDomain(domain), t("enterprise.admin.guests.errors.domain-invalid"))
			.refine(
				(domain) => !existingDomains.includes(domain.trim()),
				t("enterprise.admin.guests.errors.domain-exists"),
			),
	});

export const GuestsToolbarAddBtn = ({ onAddDomain, disabled, existingDomains = [] }: GuestsToolbarAddBtnProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const formSchema = createFormSchema(existingDomains);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			domain: "",
		},
	});

	const handleCancel = useCallback(() => {
		form.reset();
		setIsOpen(false);
	}, [form.reset]);

	const onSubmit = useCallback(
		(values: z.infer<typeof formSchema>) => {
			const trimmedDomain = values.domain.trim();
			onAddDomain(trimmedDomain);
			handleCancel();
		},
		[onAddDomain, handleCancel],
	);

	const cancelButtonProps = useMemo(
		() => ({ variant: "outline", onClick: handleCancel }) as ButtonProps,
		[handleCancel],
	);
	const confirmButtonProps = useMemo(
		() =>
			({
				onClick: form.handleSubmit(onSubmit),
			}) as ButtonProps,
		[form, onSubmit],
	);

	return (
		<ModalComponent
			cancelButtonProps={cancelButtonProps}
			cancelButtonText={t("enterprise.admin.cancel")}
			confirmButtonProps={confirmButtonProps}
			confirmButtonText={t("add")}
			isOpen={isOpen}
			modalContent={
				<Form asChild {...form}>
					<form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
						<FormStack>
							<FormField
								control={({ field }) => <TextInput placeholder="example.com" {...field} />}
								description={t("enterprise.admin.guests.domains.add-domain-hint")}
								layout="vertical"
								name="domain"
								title={t("enterprise.admin.guests.domains.title")}
							/>
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={setIsOpen}
			title={t("enterprise.admin.guests.domains.add-domain")}
			trigger={<AddButton disabled={disabled} />}
		/>
	);
};
