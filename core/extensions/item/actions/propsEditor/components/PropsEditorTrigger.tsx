import Icon from "@components/Atoms/Icon";
import {
	UsePropsEditorActionsParams,
	usePropsEditorActions,
} from "@ext/item/actions/propsEditor/logic/usePropsEditorAcitions";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { FC } from "react";

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
