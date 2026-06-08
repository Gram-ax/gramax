import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { GesCloudConnectStorage } from "@ext/enterprise-cloud/components/Catalog/ConnectStorage";
import t from "@ext/localization/locale/translate";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import InitSource from "../../storage/components/InitSource";
import InitStorage from "../../storage/components/InitStorage";

const DefaultConnectStorage = () => {
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

const ConnectStorage = () => {
	const { url: gesCloudUrl, enabled: cloudEnabled } = PageDataContextService.value.conf.enterpriseCloud;
	if (gesCloudUrl && cloudEnabled) return <GesCloudConnectStorage />;
	return <DefaultConnectStorage />;
};

export default ConnectStorage;
