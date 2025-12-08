import isMobileService from "@core-ui/ContextServices/isMobileService";
import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { MenuItemRichTemplate } from "@ui-kit/MenuItem";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuTriggerButton } from "@ui-kit/Dropdown";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import CreateCatalog from "./CreateCatalog";
import CanEditCatalogHOC from "@ext/enterprise/components/CanEditCatalogHOC";
import { useButtonsHandlers } from "./logic/useButtonsHandlers";

const itemClassName = "w-full flex items-center gap-2";
const AddCatalogMenu = () => {
	const { onCloneClick, onImportClick } = useButtonsHandlers();
	const isMobile = isMobileService.value;

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
					<CanEditCatalogHOC>
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
					</CanEditCatalogHOC>

					<DropdownMenuItem data-qa="qa-clickable" onSelect={onCloneClick}>
						<MenuItemRichTemplate
							icon={"cloud-download"}
							title={t("catalog.clone-2")}
							description={t("catalog.clone-4")}
						/>
					</DropdownMenuItem>

					<CanEditCatalogHOC>
						<IsReadOnlyHOC>
							<DropdownMenuItem data-qa="qa-clickable" onSelect={onImportClick}>
								<MenuItemRichTemplate
									icon={"import"}
									title={t("catalog.import-2")}
									description={t("catalog.import-3")}
								/>
							</DropdownMenuItem>
						</IsReadOnlyHOC>
					</CanEditCatalogHOC>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default AddCatalogMenu;
