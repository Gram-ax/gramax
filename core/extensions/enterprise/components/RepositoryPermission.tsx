import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import ShareAction from "@ext/catalog/actions/share/components/ShareAction";
import { OpenProvider } from "@ext/enterprise/components/admin/contexts/OpenContext";
import { SettingsProvider, useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { ConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/ConfirmationDialog";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import EnterpriseService from "@ext/enterprise/EnterpriseService";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { FormFooter } from "@ui-kit/Form";
import { Modal, ModalContent, ModalHeaderTemplate } from "@ui-kit/Modal";
import { Lock } from "lucide-react";
import { ComponentProps, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import ResourceComponent from "./admin/settings/resources/components/Resource/ResourceComponent";

const getItemId = (pathName: string, sourceName: string, catalogName: string) => {
	const prefix = `${sourceName}/`;
	const withoutSource = pathName.startsWith(prefix) ? pathName.slice(prefix.length) : pathName;
	const segments = withoutSource.split("/").filter(Boolean);
	const catalogIndex = segments.indexOf(catalogName);
	if (catalogIndex === -1) return withoutSource;
	return segments.slice(0, catalogIndex + 1).join("/");
};

export const RepositoryPermission = ({
	gesUrl,
	pathName,
	catalogName,
	sourceName,
	onClose,
}: {
	gesUrl: string;
	pathName: string;
	catalogName: string;
	sourceName: string;
	onClose: () => void;
}) => {
	const [isOpen, setIsOpen] = useState(true);
	const sourceDatas = SourceDataService.value;
	const enterpriseService = useMemo(() => new EnterpriseService(gesUrl), [gesUrl]);
	const token = useMemo(() => getEnterpriseSourceData(sourceDatas, gesUrl)?.token, [gesUrl, sourceDatas]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (!open) onClose();
		},
		[onClose],
	);

	return (
		<Modal onOpenChange={onOpenChange} open={isOpen}>
			<OpenProvider open={isOpen} setOpen={onOpenChange}>
				<SettingsProvider enterpriseService={enterpriseService} token={token}>
					<RepositoryPermissionModalContent
						catalogName={catalogName}
						onClose={onClose}
						pathName={pathName}
						setIsOpen={setIsOpen}
						sourceName={sourceName}
					/>
				</SettingsProvider>
			</OpenProvider>
		</Modal>
	);
};

const RepositoryPermissionModalContent = ({
	pathName,
	sourceName,
	catalogName,
	setIsOpen,
	onClose,
}: {
	pathName: string;
	sourceName: string;
	catalogName: string;
	setIsOpen: (isOpen: boolean) => void;
	onClose: () => void;
}) => {
	const { isInitialLoading, settings, ensureGroupsLoaded, ensureGuestsLoaded, ensureResourcesLoaded, addResource } =
		useSettings();

	const [isSaving, setIsSaving] = useState(false);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

	const resourceId = useMemo(() => getItemId(pathName, sourceName, catalogName), [pathName, sourceName, catalogName]);
	const resourceSettings = useMemo(
		() => settings?.resources?.find((item) => item.id === resourceId),
		[settings?.resources, resourceId],
	);

	const [editedRepository, setEditedRepository] = useState<ResourcesSettings>(resourceSettings);
	const [openedRepository, setOpenedRepository] = useState<ResourcesSettings>(resourceSettings);

	const hasChanges = useMemo(() => {
		if (!editedRepository) return false;
		return JSON.stringify(editedRepository) !== JSON.stringify(openedRepository);
	}, [editedRepository, openedRepository]);

	const closeResourceDialog = useCallback(() => {
		setIsOpen(false);
		setEditedRepository(undefined);
		setOpenedRepository(undefined);
		onClose();
	}, []);

	const handleClose = useCallback(() => {
		if (hasChanges) {
			setShowUnsavedDialog(true);
			return;
		}
		closeResourceDialog();
	}, [hasChanges, closeResourceDialog]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await addResource(editedRepository);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
			closeResourceDialog();
		}
	};

	useEffect(() => {
		ensureGroupsLoaded();
		ensureGuestsLoaded();
		ensureResourcesLoaded();
	}, []);

	useEffect(() => {
		if (resourceSettings) {
			setEditedRepository(resourceSettings);
			setOpenedRepository(resourceSettings);
		}
	}, [resourceSettings]);

	return (
		<ModalContent size="M">
			<ModalHeaderTemplate
				description={t("enterprise.admin.resources.catalog.permission.description")}
				icon={Lock}
				title={t("enterprise.admin.resources.catalog.permission.title")}
			/>

			{isInitialLoading("resources") ? (
				<TabInitialLoader />
			) : (
				<>
					<div className="p-6 pt-0 overflow-y-auto">
						<ResourceComponent
							isAddingMode={false}
							onChange={setEditedRepository}
							resourceSettings={editedRepository}
						/>
					</div>
					<FormFooter
						leftContent={
							<div className="flex items-center">
								<ShareAction isArticle={false} path={`/${pathName}`} variant="Button" />
							</div>
						}
						primaryButton={
							<>
								{isSaving ? (
									<LoadingButtonTemplate text={`${t("save2")}...`} />
								) : (
									<Button disabled={!hasChanges || isSaving} onClick={handleSave}>
										<Icon code="save" />
										{t("save")}
									</Button>
								)}
							</>
						}
						secondaryButton={
							<Button onClick={handleClose} variant="outline">
								{t("cancel")}
							</Button>
						}
					/>
				</>
			)}
			<ConfirmationDialog
				isOpen={showUnsavedDialog}
				onClose={closeResourceDialog}
				onOpenChange={setShowUnsavedDialog}
				onSave={handleSave}
			/>
		</ModalContent>
	);
};

const RepositoryPermissionTrigger = ({
	gesUrl,
	catalogName,
	pathName,
	sourceName,
	children,
}: {
	gesUrl: string;
	catalogName: string;
	pathName: string;
	sourceName: string;
	children: ReactNode;
}) => {
	const onClick = () => {
		ModalToOpenService.setValue<ComponentProps<typeof RepositoryPermission>>(ModalToOpen.RepositoryPermission, {
			gesUrl,
			pathName,
			catalogName,
			sourceName,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<CatalogItem
			renderLabel={(Component) => (
				<Component onSelect={onClick}>
					<Icon code="lock" />
					{t("enterprise.admin.resources.repository-permission")}
				</Component>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default RepositoryPermissionTrigger;
