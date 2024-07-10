import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import useLocalize from "@ext/localization/useLocalize";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import Clone from "../../git/actions/Clone/components/Clone";
import CreateCatalog from "./CreateCatalog";

const AddCatalogMenu = () => {
	return (
		<PopupMenuLayout
			trigger={<ButtonLink iconCode="plus" iconViewBox="3 3 18 18" text={useLocalize("addCatalog")} />}
		>
			<IsReadOnlyHOC>
				<CreateCatalog
					trigger={<ButtonLink iconCode="plus" iconViewBox="3 3 18 18" text={useLocalize("createNew")} />}
				/>
			</IsReadOnlyHOC>

			<Clone
				trigger={<ButtonLink iconCode="cloud-download" text={useLocalize("loadExisting")} />}
				forClone={true}
			/>

			<IsReadOnlyHOC>
				<Clone trigger={<ButtonLink iconCode="import" text={useLocalize("import")} />} forClone={false} />
			</IsReadOnlyHOC>
		</PopupMenuLayout>
	);
};

export default AddCatalogMenu;
