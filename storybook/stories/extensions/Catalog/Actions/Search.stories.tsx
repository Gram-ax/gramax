import SearchSource from "@components//Actions/Modal/Search";
import { Meta } from "@storybook/react";

export default {
	title: "gx/extensions/Catalog/Actions/Search",
} as Meta<typeof Search>;

export const Search = () => {
	return <SearchSource isHomePage={true} catalogLinks={[]} />;
};
