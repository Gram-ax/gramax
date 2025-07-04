import Notification from "@components/Atoms/Notification";
import { useSyncCount } from "@core-ui/ContextServices/SyncCount/useSyncCount";
import t, { pluralize } from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";

const CatalogFetchNotification = ({ catalogLink }: { catalogLink: CatalogLink }) => {
	const { syncCount } = useSyncCount(catalogLink.name);

	if (!syncCount || (!syncCount.errorMessage && !syncCount.hasChanges)) {
		return null;
	}

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
	}

	return <Notification tooltip={tooltip}>{message}</Notification>;
};

export default CatalogFetchNotification;
