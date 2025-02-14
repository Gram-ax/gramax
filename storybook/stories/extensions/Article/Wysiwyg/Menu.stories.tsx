import MainMenuSrc from "@ext/markdown/core/edit/components/Menu/Menus/Main";
import BlockDecorator from "../../../../styles/decorators/InlineDecorator";

const MenuData = {
	title: "gx/extensions/Article/Wysiwyg/Menu",
	decorators: [BlockDecorator],
};

export const Main = () => {
	return <MainMenuSrc />;
};

export default MenuData;
