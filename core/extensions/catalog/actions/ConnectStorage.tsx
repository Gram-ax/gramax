import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import t from "@ext/localization/locale/translate";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import InitSource from "../../storage/components/InitSource";
import InitStorage from "../../storage/components/InitStorage";

const ConnectStorage = () => {
	const hasRemoteStorage = useHasRemoteStorage();
	const trigger = (
		<StatusBarElement iconCode="cloud-off" iconStyle={{ fontSize: "15px" }} tooltipText={t("connect-storage")} />
	);

	return hasRemoteStorage ? <InitSource trigger={trigger} /> : <InitStorage trigger={trigger} />;
};

export default ConnectStorage;
