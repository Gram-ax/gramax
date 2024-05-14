import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import useLocalize from "../../localization/useLocalize";
import InitSource from "../../storage/components/InitSource";
import InitStorage from "../../storage/components/InitStorage";

const ConnectStorage = () => {
	const hasRemoteStorage = useHasRemoteStorage();
	const trigger = (
		<StatusBarElement
			iconCode="cloud-off"
			iconStyle={{ fontSize: "15px" }}
			tooltipText={useLocalize("connectStorage")}
		/>
	);

	return hasRemoteStorage ? <InitSource trigger={trigger} /> : <InitStorage trigger={trigger} />;
};

export default ConnectStorage;
