import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";

interface CheckComponentSaveButtonProps {
	isSaving: boolean;
	handleSave: () => void;
	isEqual: boolean;
}

export const CheckComponentSaveButton = ({ isSaving, handleSave, isEqual }: CheckComponentSaveButtonProps) => {
	return (
		<>
			{isSaving ? (
				<LoadingButtonTemplate text={t("save2")} />
			) : (
				<Button className="gap-2" onClick={handleSave} disabled={isEqual}>
					<Icon icon="save" />
					{t("save")}
				</Button>
			)}
		</>
	);
};
