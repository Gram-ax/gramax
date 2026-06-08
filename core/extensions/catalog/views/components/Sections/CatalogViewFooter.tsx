import { useCatalogViewSettingsContext } from "@ext/catalog/views/components/Context/CatalogViewSettingsContext";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";

interface CatalogViewFooterProps {
	onCancel: () => void;
}

export const CatalogViewFooter = ({ onCancel }: CatalogViewFooterProps) => {
	const { form } = useCatalogViewSettingsContext();
	const name = form.watch("name");

	return (
		<>
			<Button className="w-full" onClick={onCancel} size="xs" type="button" variant="outline">
				{t("cancel")}
			</Button>
			<Button className="w-full" disabled={!name?.trim()} size="xs" type="submit" variant="primary">
				{t("save")}
			</Button>
		</>
	);
};
