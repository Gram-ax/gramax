import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import t from "@ext/localization/locale/translate";
import { AsyncSearchSelect } from "@ui-kit/AsyncSearchSelect";
import { Field } from "@ui-kit/Field";
import { useAddRepoSheet } from "../hooks/useAddRepoSheet";

interface AddRepoSheetProps {
	open: boolean;
	repoCandidates: string[];
	onOpenChange: (open: boolean) => void;
	onCreate: (resourceId: string) => void;
}

export const AddRepoSheet = (props: AddRepoSheetProps) => {
	const { open, repoCandidates, onOpenChange, onCreate } = props;
	const { repository, setRepository, loadRepoOptions, handleSave } = useAddRepoSheet({
		open,
		repoCandidates,
		onOpenChange,
		onCreate,
	});

	return (
		<SheetComponent
			cancelButton={<CancelButton />}
			confirmButton={<SaveButton disabled={!repository} onClick={handleSave} />}
			isOpen={open}
			onOpenChange={onOpenChange}
			sheetContent={
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSave();
					}}
				>
					<Field
						control={() => (
							<AsyncSearchSelect
								emptyText={t("enterprise.admin.resources.repository-not-found")}
								loadOptions={loadRepoOptions}
								onChange={setRepository}
								placeholder={t("enterprise.admin.resources.select-repository-placeholder")}
								searchPlaceholder={t("enterprise.admin.search")}
								value={repository}
							/>
						)}
						description={t("enterprise.admin.resources.select-repository-description")}
						layout="vertical"
						required
						title={t("repository")}
					/>
				</form>
			}
			title={t("enterprise.admin.resources.adding")}
		/>
	);
};
