import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import useWatch from "@core-ui/hooks/useWatch";
import type CatalogPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import t from "@ext/localization/locale/translate";
import { useIsRepoOk } from "@ext/storage/logic/utils/useStorage";
import { Dialog, DialogBody, DialogContent, DialogFooterTemplate, DialogHeader, DialogTitle } from "@ui-kit/Dialog";
import { type ComponentProps, useCallback, useRef, useState } from "react";
import ApiUrlCreatorService from "../../../ui-logic/ContextServices/ApiUrlCreator";

const DocRootMissingModal = ({ onClose }: { onClose: () => void }) => {
	const [isMainModalOpen, setIsMainModalOpen] = useState(true);
	const [isEditorOpen, setIsEditorOpen] = useState(false);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const needSaveDefaultProps = useRef(true);

	const isRepoOk = useIsRepoOk(null, false);

	const setDefaultProps = useCallback(async () => {
		await FetchService.fetch(apiUrlCreator.updateCatalogProps(), JSON.stringify({}));
	}, [apiUrlCreator]);

	const onMainModalClose = useCallback(() => {
		setIsMainModalOpen(false);
		if (isEditorOpen) return;
		onClose();
		void setDefaultProps();
	}, [isEditorOpen, onClose, setDefaultProps]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsMainModalOpen(open);
			if (!open) onMainModalClose();
		},
		[onMainModalClose],
	);

	useWatch(() => {
		if (isEditorOpen) {
			setIsMainModalOpen(false);
		}
	}, [isEditorOpen]);

	const onEditorClose = useCallback(() => {
		setIsEditorOpen(false);
		onClose();
		if (!needSaveDefaultProps.current) return;
		void setDefaultProps();
	}, [onClose, setDefaultProps]);

	const startUpdatingProps = useCallback(() => {
		needSaveDefaultProps.current = false;
	}, []);

	const onPrimaryClick = useCallback(() => {
		ModalToOpenService.setValue<ComponentProps<typeof CatalogPropsEditor>>(ModalToOpen.CatalogPropsEditor, {
			onClose: () => {
				onEditorClose();
				ModalToOpenService.resetValue();
			},
			onSubmit: () => {
				startUpdatingProps();
			},
		});
	}, [onEditorClose, startUpdatingProps]);

	const onSecondaryClick = useCallback(() => {
		setIsMainModalOpen(false);
	}, []);

	if (!isRepoOk) return null;

	return (
		<Dialog onOpenChange={onOpenChange} open={isMainModalOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("catalog.missing-config.title")}</DialogTitle>
				</DialogHeader>
				<DialogBody>{t("catalog.missing-config.description")}</DialogBody>
				<DialogFooterTemplate
					primaryButton={t("catalog.missing-config.open-settings")}
					primaryButtonProps={{ onClick: onPrimaryClick, variant: "primary" }}
					secondaryButton={t("cancel")}
					secondaryButtonProps={{ onClick: onSecondaryClick, variant: "outline" }}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default DocRootMissingModal;
