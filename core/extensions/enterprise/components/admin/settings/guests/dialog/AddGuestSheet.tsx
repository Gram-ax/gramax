import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import t from "@ext/localization/locale/translate";
import { Field } from "@ui-kit/Field";
import { TextInput } from "@ui-kit/Input";
import { useAddGuestSheet } from "../hooks/useAddGuestSheet";

interface AddGuestSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingKeys?: Set<string>;
	onCreate: (value: string) => void;
	whitelistEnabled?: boolean;
	domains?: string[];
}

export const AddGuestSheet = (props: AddGuestSheetProps) => {
	const { open, onOpenChange, existingKeys, onCreate, whitelistEnabled, domains } = props;
	const { value, error, handleBlur, handleChange, handleAdd } = useAddGuestSheet({
		open,
		onOpenChange,
		existingKeys,
		onCreate,
		whitelistEnabled,
		domains,
	});

	return (
		<SheetComponent
			cancelButton={<CancelButton />}
			confirmButton={<SaveButton onClick={handleAdd} />}
			isOpen={open}
			onOpenChange={onOpenChange}
			sheetContent={
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleAdd();
					}}
				>
					<Field
						control={(props) => (
							<TextInput
								onBlur={handleBlur}
								onChange={handleChange}
								placeholder={t("enterprise.admin.guests.email-placeholder")}
								value={value}
								{...props}
							/>
						)}
						error={error}
						layout="vertical"
						required
						title={t("email")}
					/>
				</form>
			}
			title={t("enterprise.admin.guests.adding")}
		/>
	);
};
