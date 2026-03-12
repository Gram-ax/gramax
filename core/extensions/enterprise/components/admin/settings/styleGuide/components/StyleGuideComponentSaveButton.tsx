import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";

interface StyleGuideComponentSaveButtonProps {
	isSaving: boolean;
	handleSave: () => void;
	isEqual: boolean;
	disabled?: boolean;
}

export const StyleGuideComponentSaveButton = ({
	isSaving,
	handleSave,
	isEqual,
	disabled,
}: StyleGuideComponentSaveButtonProps) => {
	return (
		<>
			{isSaving ? (
				<LoadingButtonTemplate text={t("save2")} />
			) : (
				<Button className="gap-1" disabled={disabled || isEqual} onClick={handleSave} startIcon="save">
					{t("save")}
				</Button>
			)}
		</>
	);
};
