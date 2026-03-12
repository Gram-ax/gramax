import Icon from "@components/Atoms/Icon";
import {
	type UsePropsEditorActionsParams,
	usePropsEditorActions,
} from "@ext/item/actions/propsEditor/logic/usePropsEditorAcitions";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { type FC, useCallback } from "react";

interface PropsEditorTriggerProps extends Omit<UsePropsEditorActionsParams, "onExternalClose"> {
	onOpenChange?: (open: boolean) => void;
	setItemPropsData: (path: string) => void;
}

const PropsEditorTrigger: FC<PropsEditorTriggerProps> = (props) => {
	const { onOpenChange, setItemPropsData, itemLink, ...hookParams } = props;

	const onUpdate = useCallback(() => {
		setItemPropsData(itemLink.ref.path);
	}, [itemLink.ref.path, setItemPropsData]);

	const { openModal } = usePropsEditorActions({
		...hookParams,
		itemLink,
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
