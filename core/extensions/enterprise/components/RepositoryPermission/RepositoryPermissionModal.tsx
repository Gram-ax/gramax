import LucideIconComponent from "@components/Atoms/Icon/LucideIcon";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import ShareAction from "@ext/catalog/actions/share/components/ShareAction";
import { SettingsProvider } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { GesRepo, MemberAggregate } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useRepoCard } from "@ext/enterprise/components/admin/settings/resources/hooks/useRepoCard";
import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { CloseConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/CloseConfirmationDialog";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { useRepositoryPermission } from "@ext/enterprise/components/RepositoryPermission/useRepositoryPermission";
import EnterpriseService from "@ext/enterprise/EnterpriseService";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import t from "@ext/localization/locale/translate";
import { Dialog, DialogBody, DialogContent, DialogHeaderTemplate } from "@ui-kit/Dialog";
import { FormFooter } from "@ui-kit/Form";
import type { LucideIcon } from "lucide-react";
import { type ReactNode, useEffect, useMemo } from "react";
import { RepoForm } from "../admin/settings/resources/RepoForm";

interface RepositoryPermissionProps {
	gesUrl: string;
	pathName: string;
	catalogName: string;
	sourceName: string;
	onClose: () => void;
}

const RepositoryPermission = (props: RepositoryPermissionProps) => {
	const { gesUrl, pathName, catalogName, sourceName, onClose } = props;
	const sourceDatas = SourceDataService.value;
	const enterpriseService = useMemo(() => new EnterpriseService(gesUrl), [gesUrl]);
	// biome-ignore lint/correctness/useExhaustiveDependencies(sourceDatas): idc
	const token = useMemo(() => getEnterpriseSourceData(sourceDatas, gesUrl)?.token, [gesUrl, sourceDatas]);

	return (
		<SettingsProvider enterpriseService={enterpriseService} token={token}>
			<RepositoryPermissionModal
				catalogName={catalogName}
				onClose={onClose}
				pathName={pathName}
				sourceName={sourceName}
			/>
		</SettingsProvider>
	);
};

interface RepositoryPermissionModalProps {
	pathName: string;
	sourceName: string;
	catalogName: string;
	onClose: () => void;
}

const RepositoryPermissionModal = (props: RepositoryPermissionModalProps) => {
	const { pathName, sourceName, catalogName, onClose } = props;
	const {
		view,
		aggregate,
		isOpen,
		showUnsaved,
		setShowUnsaved,
		setDirty,
		applyAndSave,
		reload,
		requestClose,
		close,
	} = useRepositoryPermission({ pathName, sourceName, catalogName, onClose });

	return (
		<Dialog onOpenChange={(open) => !open && requestClose()} open={isOpen}>
			<DialogContent overlayType="dimmed" size="M">
				<DialogHeaderTemplate
					description={t("enterprise.admin.resources.catalog.permission.description")}
					icon={LucideIconComponent("lock") as LucideIcon}
					title={t("enterprise.admin.resources.repository-permission")}
				/>

				{view.status === "loading" && (
					<StatusBody>
						<TabInitialLoader />
					</StatusBody>
				)}

				{view.status === "error" && (
					<StatusBody>
						<TabErrorBlock code={view.code} onRetry={reload} />
					</StatusBody>
				)}

				{view.status === "ready" && (
					<RepositoryPermissionForm
						aggregate={aggregate}
						onApply={applyAndSave}
						onClose={close}
						onDirtyChange={setDirty}
						onRequestClose={requestClose}
						pathName={pathName}
						repo={view.repo}
					/>
				)}

				<CloseConfirmationDialog isOpen={showUnsaved} onClose={close} onOpenChange={setShowUnsaved} />
			</DialogContent>
		</Dialog>
	);
};

const StatusBody = ({ children }: { children: ReactNode }) => (
	<DialogBody className="flex min-h-40 flex-col justify-center p-6 pt-0">{children}</DialogBody>
);

interface RepositoryPermissionFormProps {
	aggregate: MemberAggregate;
	repo: GesRepo;
	pathName: string;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onDirtyChange: (isDirty: boolean) => void;
	onRequestClose: () => void;
	onClose: () => void;
}

const RepositoryPermissionForm = (props: RepositoryPermissionFormProps) => {
	const { aggregate, repo, pathName, onApply, onDirtyChange, onRequestClose, onClose } = props;

	const card = useRepoCard({ aggregate, repo, repoCandidates: [], onApply, onClose });
	const { hasChanges, saving, saveError, submit } = card.form;

	useEffect(() => {
		if (!saveError.isShown) return;
		const timer = setTimeout(saveError.hide, 4000);
		return () => clearTimeout(timer);
	}, [saveError.isShown, saveError.hide]);

	useEffect(() => {
		onDirtyChange(hasChanges());
	}, [hasChanges, onDirtyChange]);

	return (
		<>
			<DialogBody className="p-6 pt-0 overflow-y-auto">
				<RepoForm state={card.repoFormState} />
			</DialogBody>

			<FormFooter
				leftContent={
					<div className="flex items-center">
						<ShareAction isArticle={false} path={`/${pathName}`} variant="Button" />
					</div>
				}
				primaryButton={<SaveButton isSaving={saving} onClick={submit} />}
				secondaryButton={<CancelButton onClick={onRequestClose} />}
			/>

			<FloatingAlert message={saveError.message} show={saveError.isShown} />
		</>
	);
};

export default RepositoryPermission;
