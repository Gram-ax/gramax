import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";

interface StyleGuideComponentSaveButtonProps {
	isSaving: boolean;
	handleSave: () => void;
	isEqual: boolean;
}

export const StyleGuideComponentSaveButton = ({
	isSaving,
	handleSave,
	isEqual,
}: StyleGuideComponentSaveButtonProps) => {
	return (
		<>
			{isSaving ? (
				<LoadingButtonTemplate text={t("save2")} />
			) : (
				<Button className="gap-2" startIcon="save" onClick={handleSave} disabled={isEqual}>
					{t("save")}
				</Button>
			)}
		</>
	);
};
