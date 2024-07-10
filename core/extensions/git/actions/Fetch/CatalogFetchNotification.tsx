import Notification from "@components/Atoms/Notification";
import CatalogSyncService from "@core-ui/ContextServices/CatalogSync";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useBareLocalize from "@ext/localization/useLocalize/useBareLocalize";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";

const CatalogFetchNotification = ({ catalogLink }: { catalogLink: CatalogLink }) => {
	const l = PageDataContextService.value.lang;
	const syncCount = CatalogSyncService.getSyncCount(catalogLink.name);

	if (!syncCount || !syncCount.hasChanges) return null;

	const pull = syncCount.pull > 0 ? syncCount.pull : syncCount.hasChanges && "";
	const message = syncCount.errorMessage ? "!" : pull;

	let tooltip =
		syncCount.errorMessage &&
		(useBareLocalize(syncCount.errorMessage as any, l) ?? useBareLocalize("unableToGetSyncCount", l));

	if (!tooltip) {
		const lastDigit = syncCount.pull % 10;
		const lastTwoDigits = syncCount.pull % 100;
		if (syncCount.pull == 0) {
			tooltip = useBareLocalize("syncSomethingChanged", l);
		} else if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
			tooltip = syncCount.pull + " " + useBareLocalize("syncCatalogChanged3", l);
		} else if (lastDigit === 1) {
			tooltip = syncCount.pull + " " + useBareLocalize("syncCatalogChanged1", l);
		} else if (lastDigit >= 2 && lastDigit <= 4) {
			tooltip = syncCount.pull + " " + useBareLocalize("syncCatalogChanged2", l);
		} else {
			tooltip = syncCount.pull + " " + useBareLocalize("syncCatalogChanged3", l);
		}
	} else {
		console.error(catalogLink.name, syncCount.errorMessage);
	}

	return <Notification tooltip={tooltip}>{message}</Notification>;
};

export default CatalogFetchNotification;
