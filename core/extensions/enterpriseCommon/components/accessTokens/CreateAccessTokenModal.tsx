import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Calendar } from "@ui-kit/Calendar";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: t("must-be-not-empty") }),
	expiresAt: z
		.string()
		.min(1, { message: t("must-be-not-empty") })
		.refine((value) => !Number.isNaN(new Date(value).getTime()), {
			message: t("must-be-not-empty"),
		}),
});

type FormData = z.infer<typeof formSchema>;

export interface TokenCreatePayload {
	name: string;
	expiresAt: string;
}

interface TokenCreateModalProps {
	onCreate: (payload: TokenCreatePayload) => Promise<void>;
	onClose: () => void;
}

export const CreateAccessTokenModal = ({ onCreate, onClose }: TokenCreateModalProps) => {
	const [open, setOpen] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const onOpenChangeHandler = useCallback(
		(value: boolean) => {
			setOpen(value);
			if (!value) onClose();
		},
		[onClose],
	);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			name: "",
			expiresAt: "",
		},
	});

	const handleCreate = useCallback(
		async (values: FormData) => {
			if (isLoading) return;

			setIsLoading(true);
			try {
				await onCreate({ name: values.name.trim(), expiresAt: values.expiresAt });
				form.reset();
				onOpenChangeHandler(false);
			} finally {
				setIsLoading(false);
			}
		},
		[form, onCreate, isLoading, onOpenChangeHandler],
	);

	const handleCancel = useCallback(() => {
		if (!isLoading) {
			form.reset();
			onOpenChangeHandler(false);
		}
	}, [form, isLoading, onOpenChangeHandler]);

	const isSubmitDisabled = isLoading || !form.formState.isValid;

	return (
		<Dialog onOpenChange={onOpenChangeHandler} open={open}>
			<DialogContent data-modal-root>
				<Form asChild {...form}>
					<form onSubmit={form.handleSubmit(handleCreate)}>
						<FormHeader
							description={t("enterprise-cloud.org-settings.tokens.create-form.description")}
							icon="key-round"
							title={t("enterprise-cloud.org-settings.tokens.create-form.title")}
						/>
						<DialogBody>
							<FormStack>
								<FormField
									control={({ field }) => (
										<Input
											placeholder={t("enterprise-cloud.org-settings.tokens.name-placeholder")}
											{...field}
										/>
									)}
									layout="vertical"
									name="name"
									required
									title={t("enterprise-cloud.org-settings.tokens.name")}
								/>
								<FormField
									control={({ field }) => (
										<ExpiresAtPicker onChange={field.onChange} value={field.value} />
									)}
									labelClassName="w-full"
									layout="vertical"
									name="expiresAt"
									required
									title={t("enterprise-cloud.org-settings.tokens.expires-at")}
								/>
							</FormStack>
						</DialogBody>
						<FormFooter
							primaryButton={
								isLoading ? (
									<LoadingButtonTemplate
										text={t("enterprise-cloud.org-settings.tokens.create")}
										variant="primary"
									/>
								) : (
									<Button disabled={isSubmitDisabled} type="submit">
										{t("enterprise-cloud.org-settings.tokens.create")}
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

interface ExpiresAtPickerProps {
	value: string;
	onChange: (value: string) => void;
}

const formatLocalDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string): Date | undefined => {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return undefined;
	const [, year, month, day] = match;
	return new Date(Number(year), Number(month) - 1, Number(day));
};

const ExpiresAtPicker = ({ value, onChange }: ExpiresAtPickerProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const selectedDate = value ? parseLocalDate(value) : undefined;

	const handleSelect = (date: Date | undefined) => {
		if (!date) return;
		onChange(formatLocalDate(date));
		setIsOpen(false);
	};

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTriggerButton
				className="w-full justify-start pr-2.5 pl-3 py-1.5 font-normal"
				containerClassName="w-full justify-start"
				variant="outline"
			>
				<Icon icon="calendar" />
				{selectedDate
					? selectedDate.toLocaleDateString()
					: t("enterprise-cloud.org-settings.tokens.expires-at-placeholder")}
				<Icon className="ml-auto text-muted" icon="chevron-down" />
			</PopoverTriggerButton>
			<PopoverContent className="p-0 w-auto">
				<Calendar
					className="border-0 shadow-none bg-transparent"
					defaultMonth={selectedDate}
					disabled={{ before: tomorrow }}
					mode="single"
					onSelect={handleSelect}
					selected={selectedDate}
				/>
			</PopoverContent>
		</Popover>
	);
};
