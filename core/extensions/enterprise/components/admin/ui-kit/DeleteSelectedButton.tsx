import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Counter } from "@ui-kit/Counter";
import { Icon } from "@ui-kit/Icon";

interface DeleteSelectedButtonProps {
	onClick: () => void;
	selectedCount: number;
	hidden?: boolean;
}

export const DeleteSelectedButton = ({ onClick, selectedCount, hidden }: DeleteSelectedButtonProps) => {
	if (hidden) return null;

	return (
		<Button onClick={onClick} type="button" variant="outline">
			<Icon icon="trash" />
			{t("delete")} <Counter variant="text">{selectedCount}</Counter>
		</Button>
	);
};
