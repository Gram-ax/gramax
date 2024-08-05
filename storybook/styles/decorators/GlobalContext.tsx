import ContextProviders from "@components/ContextProviders";
import IsMacService from "@core-ui/ContextServices/IsMac";
import Language from "@core-ui/ContextServices/Language";
import { StoryContext } from "@storybook/react";
import { useEffect } from "react";
import pagePropsJSON from "storybook/data/pageProps";

const pageProps = pagePropsJSON;

const Context = (Story: any, context: StoryContext) => {
	pageProps.context.theme = context.globals.theme;
	IsMacService.value = context.globals.isMac == "true";

	useEffect(() => {
		Language.setUiLanguage(context.globals.lang);
	}, []);

	return (
		<ContextProviders pageProps={pagePropsJSON} refreshPage={() => alert("Called refresh page")}>
			<Story />
		</ContextProviders>
	);
};

export default Context;
