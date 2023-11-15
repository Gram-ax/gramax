import SearchSource from "@components//Actions/Modal/Search";
import { ComponentMeta } from "@storybook/react";

export default {
	title: "DocReader/extensions/Catalog/Actions/Search",
} as ComponentMeta<typeof Search>;

export const Search = () => {
	return <SearchSource isHomePage={true} catalogLinks={[]} />;
};
