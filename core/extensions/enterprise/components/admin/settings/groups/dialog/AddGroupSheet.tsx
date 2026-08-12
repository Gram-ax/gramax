import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import t from "@ext/localization/locale/translate";
import { Field } from "@ui-kit/Field";
import { TextInput } from "@ui-kit/Input";
import { useAddGroupSheet } from "../hooks/useAddGroupSheet";

interface AddGroupSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingKeys?: Set<string>;
	onCreate: (id: string) => void;
}

export const AddGroupSheet = (props: AddGroupSheetProps) => {
	const { open, onOpenChange, existingKeys, onCreate } = props;
	const { value, error, handleBlur, handleChange, handleAdd } = useAddGroupSheet({
		open,
		onOpenChange,
		existingKeys,
		onCreate,
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
								placeholder={t("enterprise.admin.groups.name-placeholder")}
								value={value}
								{...props}
							/>
						)}
						error={error}
						layout="vertical"
						required
						title={t("name")}
					/>
				</form>
			}
			title={t("enterprise.admin.groups.adding")}
		/>
	);
};
