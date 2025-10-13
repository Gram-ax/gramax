import { Icon } from "@ui-kit/Icon";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent } from "@ui-kit/Dropdown";
import { MenuItemRichTemplate } from "@ui-kit/MenuItem";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuTriggerButton } from "ics-ui-kit/components/dropdown";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import CreateCatalog from "./CreateCatalog";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import { ComponentProps } from "react";
import CloneModal from "@ext/git/actions/Clone/components/CloneModal";
import CreateStorageModal from "@ext/storage/components/CreateStorageModal";
import ImportModal from "@ext/import/components/ImportModal";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";

const itemClassName = "w-full flex items-center gap-2";
const AddCatalogMenu = () => {
	const sourceDatas = SourceDataService.value;
	const isEmptyCloneData = !sourceDatas.some((data) => isGitSourceType(data.sourceType));
	const isMobile = isMobileService.value;

	const onCloneClick = () => {
		if (isEmptyCloneData) {
			ModalToOpenService.setValue<ComponentProps<typeof CreateStorageModal>>(ModalToOpen.CreateStorage, {
				onSubmit: (data) => {
					ModalToOpenService.setValue<ComponentProps<typeof CloneModal>>(ModalToOpen.Clone, {
						selectedStorage: getStorageNameByData(data),
						onClose: () => ModalToOpenService.resetValue(),
					});
				},
				onClose: () => ModalToOpenService.resetValue(),
			});
		} else {
			ModalToOpenService.setValue<ComponentProps<typeof CloneModal>>(ModalToOpen.Clone, {
				onSubmit: () => ModalToOpenService.resetValue(),
				onClose: () => ModalToOpenService.resetValue(),
			});
		}
	};

	const onImportClick = () => {
		ModalToOpenService.setValue<ComponentProps<typeof ImportModal>>(ModalToOpen.ImportModal, {
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<DropdownMenu>
			{isMobile ? (
				<DropdownMenuTriggerButton
					variant="ghost"
					className="aspect-square p-2"
					data-qa="qa-clickable"
					style={{ overflow: "visible" }}
				>
					<Icon icon="plus" size="xl" className="stroke-[1.6]" />
				</DropdownMenuTriggerButton>
			) : (
				<DropdownMenuTriggerButton variant="ghost" data-qa="qa-clickable" style={{ overflow: "visible" }}>
					{t("catalog.add")}
					<Icon icon="chevron-down" />
				</DropdownMenuTriggerButton>
			)}
			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					<IsReadOnlyHOC>
						<DropdownMenuItem data-qa="qa-clickable">
							<CreateCatalog
								className={itemClassName}
								trigger={
									<MenuItemRichTemplate
										icon={"plus"}
										title={t("catalog.new-2")}
										description={t("catalog.new-3")}
									/>
								}
							/>
						</DropdownMenuItem>
					</IsReadOnlyHOC>

					<DropdownMenuItem data-qa="qa-clickable" onSelect={onCloneClick}>
						<MenuItemRichTemplate
							icon={"cloud-download"}
							title={t("catalog.clone-2")}
							description={t("catalog.clone-4")}
						/>
					</DropdownMenuItem>

					<IsReadOnlyHOC>
						<DropdownMenuItem data-qa="qa-clickable" onSelect={onImportClick}>
							<MenuItemRichTemplate
								icon={"import"}
								title={t("catalog.import-2")}
								description={t("catalog.import-3")}
							/>
						</DropdownMenuItem>
					</IsReadOnlyHOC>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default AddCatalogMenu;
