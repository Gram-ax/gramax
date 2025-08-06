import Icon from "@components/Atoms/Icon";
import ButtonLink from "@components/Molecules/ButtonLink";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import styled from "@emotion/styled";
import Mode from "@ext/git/actions/Clone/model/Mode";
import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent } from "@ui-kit/Dropdown";
import { MenuItemRichTemplate } from "@ui-kit/MenuItem";
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuTriggerButton } from "ics-ui-kit/components/dropdown";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import CreateCatalog from "./CreateCatalog";

// Delete when swap dropdown
export const MobileButtonLink = styled(ButtonLink)`
	i + span {
		display: block;
	}
`;
const itemClassName = "w-full flex items-center gap-2";
const AddCatalogMenu = () => {
	const isMobile = isMobileService.value;

	return (
		<DropdownMenu>
			{isMobile ? (
				<DropdownMenuTriggerButton variant="ghost" className="aspect-square p-2" data-qa="qa-clickable">
					<Icon code="plus" />
				</DropdownMenuTriggerButton>
			) : (
				<DropdownMenuTriggerButton variant="ghost" data-qa="qa-clickable">
					{t("catalog.add")}
					<Icon code="chevron-down" />
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

					<DropdownMenuItem
						data-qa="qa-clickable"
						onClick={() => {
							ModalToOpenService.setValue(ModalToOpen.Clone, {
								mode: Mode.clone,
								onClose: () => {
									ModalToOpenService.resetValue();
								},
							});
						}}
					>
						<MenuItemRichTemplate
							icon={"cloud-download"}
							title={t("catalog.clone-2")}
							description={t("catalog.clone-4")}
						/>
					</DropdownMenuItem>

					<IsReadOnlyHOC>
						<DropdownMenuItem
							data-qa="qa-clickable"
							onClick={() => {
								ModalToOpenService.setValue(ModalToOpen.Clone, {
									mode: Mode.import,
									onClose: () => {
										ModalToOpenService.resetValue();
									},
								});
							}}
						>
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
