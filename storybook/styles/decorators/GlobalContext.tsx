import ContextProviders from "@components/ContextProviders";
import IsMacService from "@core-ui/ContextServices/IsMac";
import { StoryContext } from "@storybook/react";
import pagePropsJSON from "storybook/data/pageProps";

const pageProps = pagePropsJSON;

const Context = (Story: any, context: StoryContext) => {
	pageProps.context.theme = context.globals.theme;
	pageProps.context.lang = context.globals.lang;
	IsMacService.value = context.globals.isMac == "true";

	return (
		<ContextProviders pageProps={pagePropsJSON}>
			<Story />
		</ContextProviders>
	);
};

export default Context;
