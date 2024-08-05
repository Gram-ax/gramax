import lucideIconList, { iconFilter, toListItem } from "@components/Atoms/Icon/lucideIconList";
import { ItemContent, ListItem } from "@components/List/Item";
import TooltipListLayout from "@components/List/TooltipListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { IconEditorProps } from "@ext/markdown/elements/icon/logic/IconProvider";
import { Editor } from "@tiptap/core";
import { useState } from "react";

interface IconMenuButtonProps {
	editor: Editor;
	className?: string;
	onClose?: () => void;
}

const IconMenuButton = ({ editor, onClose, className }: IconMenuButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [customIconsList, setCustomIconsList] = useState<IconEditorProps[]>([]);

	const lucideIconListFiltered = lucideIconList.filter(
		(listItem) => !customIconsList.some((icon) => icon.code === listItem.labelField),
	);

	const iconText = t("icon");
	const iconPlaceholderText = t("icon-cone");

	const getIcons = async () => {
		const res = await FetchService.fetch<IconEditorProps[]>(apiUrlCreator.getCustomIconsList());
		if (!res.ok) return;
		const icons = await res.json();
		if (JSON.stringify(icons) !== JSON.stringify(customIconsList)) {
			setCustomIconsList(icons);
		}
	};

	const itemClickHandler = (labelField: string) => {
		onClose();
		editor.commands.setIcon({ code: labelField, svg: customIconsList.find((i) => i.code === labelField)?.svg });
		editor.commands.focus(editor.state.selection.anchor);
	};

	const titleCustomIcons: ListItem = {
		isTitle: true,
		disable: true,
		element: <div className="itemTitle">{t("catalog-icons-title")}</div>,
	};

	const titleSystemIcons: ListItem = {
		isTitle: true,
		disable: true,
		element: <div className="itemTitle">{t("system-icons-title")}</div>,
	};

	const items: ItemContent[] = (
		customIconsList?.length > 0 ? [titleCustomIcons].concat(customIconsList.map((i) => toListItem(i))) : []
	).concat([titleSystemIcons].concat(lucideIconListFiltered));

	return (
		<TooltipListLayout
			className={className}
			action={"icon"}
			buttonIcon="smile"
			items={items}
			onShow={getIcons}
			tooltipText={iconText}
			onItemClick={itemClickHandler}
			filterItems={iconFilter(customIconsList)}
			placeholder={iconPlaceholderText}
		/>
	);
};

export default styled(IconMenuButton)`
	.itemTitle {
		width: 100%;
		padding: 5px 10px;
		text-transform: uppercase;
		color: var(--color-loader);
		font-weight: 450;
		font-size: 12px;
	}

	i {
		line-height: 1px;
	}
`;
