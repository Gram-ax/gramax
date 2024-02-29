import ButtonLink from "@components/Molecules/ButtonLink";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import Clone from "../../git/actions/Clone/components/Clone";
import CreateCatalog from "./CreateCatalog";
import useLocalize from "@ext/localization/useLocalize";

const AddCatalogMenu = () => {
	return (
		<PopupMenuLayout trigger={<ButtonLink iconCode="plus" text={useLocalize("addCatalog")} />}>
			<IsReadOnlyHOC>
				<CreateCatalog trigger={<ButtonLink iconCode="plus" text={useLocalize("createNew")} />} />
			</IsReadOnlyHOC>
			<Clone trigger={<ButtonLink iconCode="cloud" text={useLocalize("loadExisting")} />} />
		</PopupMenuLayout>
	);
};

export default AddCatalogMenu;
