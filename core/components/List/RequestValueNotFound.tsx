import ItemByUikit from "@components/List/ItemByUikit";
import t from "@ext/localization/locale/translate";

const RequestValueNotFound = () => (
	<ItemByUikit
		content={{
			element: t("list.no-results-found"),
			labelField: "",
		}}
		style={{ color: "var(--color-primary-general-inverse)" }}
	/>
);

export default RequestValueNotFound;
