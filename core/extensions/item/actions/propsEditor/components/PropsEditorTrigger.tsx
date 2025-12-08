import {
	UsePropsEditorActionsParams,
	usePropsEditorActions,
} from "@ext/item/actions/propsEditor/logic/usePropsEditorAcitions";
import t from "@ext/localization/locale/translate";
import { FC } from "react";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import Icon from "@components/Atoms/Icon";

interface PropsEditorTriggerProps extends Omit<UsePropsEditorActionsParams, "onExternalClose"> {
	onUpdate?: () => void;
	onOpenChange?: (open: boolean) => void;
}

const PropsEditorTrigger: FC<PropsEditorTriggerProps> = (props) => {
	const { onOpenChange, onUpdate, ...hookParams } = props;

	const { openModal } = usePropsEditorActions({
		...hookParams,
		onExternalClose: () => onOpenChange?.(false),
		onUpdate,
	});

	const onClick = () => {
		openModal();
		onOpenChange?.(true);
	};

	return (
		<DropdownMenuItem onSelect={onClick}>
			<Icon code="pencil" />
			{t("configure")}
		</DropdownMenuItem>
	);
};

export default PropsEditorTrigger;
