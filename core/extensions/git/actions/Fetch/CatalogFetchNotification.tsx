import Notification from "@components/Atoms/Notification";
import CatalogSyncService from "@core-ui/ContextServices/CatalogSync";
import t from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";

const CatalogFetchNotification = ({ catalogLink }: { catalogLink: CatalogLink }) => {
	const syncCount = CatalogSyncService.getSyncCount(catalogLink.name);

	if (!(syncCount && (syncCount.errorMessage || syncCount.hasChanges))) return null;

	const pull = syncCount.pull > 0 ? syncCount.pull : syncCount.hasChanges && "";
	const message = syncCount.errorMessage ? "!" : pull;

	let tooltip = syncCount.errorMessage;

	if (!tooltip) {
		const lastDigit = syncCount.pull % 10;
		const lastTwoDigits = syncCount.pull % 100;
		if (syncCount.pull == 0) {
			tooltip = t("sync-something-changed");
		} else if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
			tooltip = syncCount.pull + " " + t("sync-catalog-changed3");
		} else if (lastDigit === 1) {
			tooltip = syncCount.pull + " " + t("sync-catalog-changed1");
		} else if (lastDigit >= 2 && lastDigit <= 4) {
			tooltip = syncCount.pull + " " + t("sync-catalog-changed2");
		} else {
			tooltip = syncCount.pull + " " + t("sync-catalog-changed3");
		}
	} else {
		console.error(catalogLink.name, syncCount.errorMessage);
	}

	return <Notification tooltip={tooltip}>{message}</Notification>;
};

export default CatalogFetchNotification;
