import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import IsReadOnlyHOC from "../../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import Clone from "../../git/actions/Clone/components/Clone";
import CreateCatalog from "./CreateCatalog";

const AddCatalogMenu = () => {
	return (
		<PopupMenuLayout trigger={<ButtonLink iconCode="plus" iconViewBox="3 3 18 18" text={t("catalog.add")} />}>
			<IsReadOnlyHOC>
				<CreateCatalog
					trigger={<ButtonLink iconCode="plus" iconViewBox="3 3 18 18" text={t("catalog.new")} />}
				/>
			</IsReadOnlyHOC>

			<Clone trigger={<ButtonLink iconCode="cloud-download" text={t("catalog.clone-2")} />} forClone={true} />

			<IsReadOnlyHOC>
				<Clone trigger={<ButtonLink iconCode="import" text={t("catalog.import")} />} forClone={false} />
			</IsReadOnlyHOC>
		</PopupMenuLayout>
	);
};

export default AddCatalogMenu;
