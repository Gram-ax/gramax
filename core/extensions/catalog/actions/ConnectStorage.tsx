import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import t from "@ext/localization/locale/translate";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import InitSource from "../../storage/components/InitSource";
import InitStorage from "../../storage/components/InitStorage";

const ConnectStorage = () => {
	const hasRemoteStorage = useHasRemoteStorage();
	const trigger = (
		<div data-qa="qa-connect-storage">
			<StatusBarElement
				iconCode="crossed-cloud"
				iconStyle={{ fontSize: "15px", fill: "white" }}
				tooltipText={t("connect-storage")}
			/>
		</div>
	);

	return hasRemoteStorage ? <InitSource trigger={trigger} /> : <InitStorage trigger={trigger} />;
};

export default ConnectStorage;
