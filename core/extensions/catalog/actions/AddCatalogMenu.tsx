import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import Clone from "../../git/actions/Clone/components/Clone";
import useLocalize from "../../localization/useLocalize";
import CreateCatalog from "./CreateCatalog";

const AddCatalogMenu = () => {
	return (
		<PopupMenuLayout
			trigger={
				<a data-qa="qa-clickable">
					<Icon code={"plus"} />
					<span>{useLocalize("addCatalog")}</span>
				</a>
			}
		>
			<>
				<IsReadOnlyHOC>
					<CreateCatalog
						trigger={
							<div data-qa="qa-clickable">
								<Icon code="plus" faFw />
								<span>{useLocalize("createNew")}</span>
							</div>
						}
					/>
				</IsReadOnlyHOC>
				<Clone
					trigger={
						<div data-qa="qa-clickable">
							<Icon code="cloud" faFw />
							<span>{`${useLocalize("load")} ${useLocalize("existing")}`}</span>
						</div>
					}
				/>
			</>
		</PopupMenuLayout>
	);
};

export default AddCatalogMenu;
