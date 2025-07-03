import ItemByUikit from "@components/List/ItemByUikit";
import t from "@ext/localization/locale/translate";

const RequestValueNotFound = () => (
	<ItemByUikit
		style={{ color: "var(--color-primary-general-inverse)" }}
		content={{
			element: t("list.no-results-found"),
			labelField: "",
		}}
	/>
);

export default RequestValueNotFound;
