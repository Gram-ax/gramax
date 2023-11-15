import MainMenuSrc from "@ext/markdown/core/edit/components/Menu/Menus/Main";
import TableMenuSrc from "../../../../../core/extensions/markdown/elements/table/edit/components/TableMenu";
import BlockDecorator from "../../../../styles/decorators/InlineDecorator";

const MenuData = {
	title: "DocReader/extensions/Article/Wysiwyg/Menu",
	decorators: [BlockDecorator],
};

export const Main = () => {
	return <MainMenuSrc />;
};

export const Table = () => {
	return <TableMenuSrc />;
};

export default MenuData;
