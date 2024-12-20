import Notification from "@components/Atoms/Notification";
import CatalogSyncService from "@core-ui/ContextServices/CatalogSync";
import t, { pluralize } from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";

const CatalogFetchNotification = ({ catalogLink }: { catalogLink: CatalogLink }) => {
	const syncCount = CatalogSyncService.getSyncCount(catalogLink.name);

	if (!(syncCount && (syncCount.errorMessage || syncCount.hasChanges))) return null;

	const pull = syncCount.pull > 0 ? syncCount.pull : syncCount.hasChanges && "";
	const message = syncCount.errorMessage ? "!" : pull;

	let tooltip = syncCount.errorMessage;

	if (!tooltip) {
		tooltip = pluralize(syncCount.pull, {
			zero: t("sync-something-changed"),
			one: t("sync-catalog-changed1"),
			few: t("sync-catalog-changed2"),
			many: t("sync-catalog-changed3"),
		});
	} else {
		console.error(catalogLink.name, syncCount.errorMessage);
	}

	return <Notification tooltip={tooltip}>{message}</Notification>;
};

export default CatalogFetchNotification;
