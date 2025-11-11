import { ModalComponent } from "@ext/enterprise/components/admin/ui-kit/ModalComponent";
import { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { TextInput } from "@ui-kit/Input";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TriggerAddButtonTemplate } from "../../components/TriggerAddButtonTemplate";
import { isValidEmailDomain } from "../utils/isValidEmailDomain";

interface GuestsToolbarAddBtnProps {
	onAddDomain: (domain: string) => void;
	disabled?: boolean;
	existingDomains?: string[];
}

const createFormSchema = (existingDomains: string[]) => z.object({
	domain: z
		.string()
		.min(1, "Введите домен")
		.refine((domain) => isValidEmailDomain(domain), "Некорректный домен")
		.refine((domain) => !existingDomains.includes(domain.trim()), "Домен уже существует в списке")
});

export const GuestsToolbarAddBtn = ({ onAddDomain, disabled, existingDomains = [] }: GuestsToolbarAddBtnProps) => {
	const [isOpen, setIsOpen] = useState(false);
	
	const formSchema = createFormSchema(existingDomains);
	
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			domain: ""
		}
	});

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const trimmedDomain = values.domain.trim();
		onAddDomain(trimmedDomain);
		handleCancel();
	};

	const handleCancel = () => {
		form.reset();
		setIsOpen(false);
	};

	const cancelButtonProps = useMemo(() => ({ variant: "secondary", onClick: handleCancel }) as ButtonProps, []);
	const confirmButtonProps = useMemo(
		() =>
			({
				onClick: form.handleSubmit(onSubmit)
			}) as ButtonProps,
		[form, onSubmit]
	);

	return (
		<ModalComponent
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			modalContent={
				<Form asChild {...form}>
					<form className="contents">
						<FormStack>
							<FormField
								name="domain"
								title="Домен"
								layout="vertical"
								description="Введите домен для добавления в список разрешенных"
								control={({ field }) => (
									<TextInput
										placeholder="example.com"
										{...field}
									/>
								)}
							/>
						</FormStack>
					</form>
				</Form>
			}
			trigger={<TriggerAddButtonTemplate disabled={disabled} />}
			title="Добавить домен"
			confirmButtonText="Добавить"
			cancelButtonText="Отмена"
			cancelButtonProps={cancelButtonProps}
			confirmButtonProps={confirmButtonProps}
		/>
	);
};
