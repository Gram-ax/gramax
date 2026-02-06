import { topMenuItemClassName } from "@components/HomePage/TopMenu";
import { classNames } from "@components/libs/classNames";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { MenuItemRichTemplate } from "@ui-kit/MenuItem";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import CreateCatalog from "./CreateCatalog";
import { useButtonsHandlers } from "./logic/useButtonsHandlers";

const itemClassName = "w-full flex items-center gap-2";

const AddCatalogMenu = () => {
	const { onCloneClick, onImportClick } = useButtonsHandlers();
	const isMobile = isMobileService.value;

	return (
		<DropdownMenu>
			{isMobile ? (
				<DropdownMenuTriggerButton
					className={classNames("aspect-square p-2", {}, [topMenuItemClassName])}
					data-qa="qa-clickable"
					data-testid="add-catalog"
					style={{ overflow: "visible" }}
					variant="ghost"
				>
					<Icon className="stroke-[1.6]" icon="plus" size="xl" />
				</DropdownMenuTriggerButton>
			) : (
				<DropdownMenuTriggerButton
					className={topMenuItemClassName}
					data-qa="qa-clickable"
					data-testid="add-catalog"
					style={{ overflow: "visible" }}
					variant="ghost"
				>
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
										description={t("catalog.new-3")}
										icon={"plus"}
										title={t("catalog.new-2")}
									/>
								}
							/>
						</DropdownMenuItem>
					</IsReadOnlyHOC>

					<DropdownMenuItem data-qa="qa-clickable" onSelect={onCloneClick}>
						<MenuItemRichTemplate
							description={t("catalog.clone-4")}
							icon={"cloud-download"}
							title={t("catalog.clone-2")}
						/>
					</DropdownMenuItem>

					<IsReadOnlyHOC>
						<DropdownMenuItem data-qa="qa-clickable" onSelect={onImportClick}>
							<MenuItemRichTemplate
								description={t("catalog.import-3")}
								icon={"import"}
								title={t("catalog.import-2")}
							/>
						</DropdownMenuItem>
					</IsReadOnlyHOC>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default AddCatalogMenu;
