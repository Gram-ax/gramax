import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import useLocalize from "../../localization/useLocalize";
import InitSource from "../../storage/components/InitSource";
import InitStorage from "../../storage/components/InitStorage";

const ConnectStorage = () => {
	const catalogProps = CatalogPropsService.value;
	const storageName = catalogProps.sourceName;
	const trigger = <StatusBarElement iconCode="cloud-slash" tooltipText={useLocalize("connectStorage")} />;

	return storageName ? <InitSource trigger={trigger} /> : <InitStorage trigger={trigger} />;
};

export default ConnectStorage;
