import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { GesRepo, MemberAggregate } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useRepoCard } from "@ext/enterprise/components/admin/settings/resources/hooks/useRepoCard";
import { RepoForm } from "@ext/enterprise/components/admin/settings/resources/RepoForm";
import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { CloseConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/CloseConfirmationDialog";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { SheetTitleValue } from "@ext/enterprise/components/admin/ui-kit/SheetTitleValue";
import t from "@ext/localization/locale/translate";

interface RepoCardProps {
	open: boolean;
	repo?: GesRepo;
	repoCandidates: string[];
	aggregate: MemberAggregate;
	onClose: () => void;
	onApply: (changes: AccessChange[]) => Promise<void>;
}

export function RepoCard(props: RepoCardProps) {
	const { open } = props;
	const { isAdd, form, repoFormState } = useRepoCard(props);

	return (
		<>
			<SheetComponent
				cancelButton={
					<CancelButton
						onClick={(e) => {
							e.preventDefault();
							form.requestClose();
						}}
					/>
				}
				confirmButton={
					<SaveButton
						disabled={!repoFormState.data.repoId}
						isSaving={form.saving}
						onClick={(e) => {
							e.preventDefault();
							form.submit();
						}}
					/>
				}
				connectionError={form.saveError}
				isOpen={open}
				onOpenChange={(next) => !next && form.requestClose()}
				sheetContent={<RepoForm state={repoFormState} />}
				title={
					isAdd ? (
						t("enterprise.admin.resources.adding")
					) : (
						<SheetTitleValue
							label={t("enterprise.admin.resources.editing")}
							value={repoFormState.data.repoId}
						/>
					)
				}
			/>
			<CloseConfirmationDialog
				isOpen={form.showUnsaved}
				onClose={form.close}
				onOpenChange={form.setShowUnsaved}
			/>
		</>
	);
}
