import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import t from "@ext/localization/locale/translate";
import { Field } from "@ui-kit/Field";
import { Icon } from "@ui-kit/Icon";
import { TextInput } from "@ui-kit/Input";
import { useAddUserSheet } from "../hooks/useAddUserSheet";

interface AddUserSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingKeys?: Set<string>;
	onCreate: (value: string) => void;
}

export const AddUserSheet = (props: AddUserSheetProps) => {
	const { open, onOpenChange, existingKeys, onCreate } = props;
	const { value, error, handleBlur, handleChange, handleAdd } = useAddUserSheet({
		open,
		onOpenChange,
		existingKeys,
		onCreate,
	});

	return (
		<SheetComponent
			cancelButton={<CancelButton />}
			confirmButton={
				<Button onClick={handleAdd}>
					<Icon icon="plus" />
					{t("save")}
				</Button>
			}
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
								placeholder={t("enterprise.admin.users.email-placeholder")}
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
			title={t("enterprise.admin.users.adding")}
		/>
	);
};
