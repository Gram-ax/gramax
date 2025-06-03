import { initModules as initModulesFrontend } from "@app/resolveModule/frontend";
import ContextProviders from "@components/ContextProviders";
import IsMacService from "@core-ui/ContextServices/IsMac";
import Language from "@core-ui/ContextServices/Language";
import { StoryContext } from "@storybook/react";
import { useEffect, useState } from "react";
import pagePropsJSON from "storybook/data/pageProps";

const pageProps = pagePropsJSON;

let init = false;

const Context = (Story: any, context: StoryContext) => {
	pageProps.context.theme = context.globals.theme;
	IsMacService.value = context.globals.isMac == "true";

	const [isModulesInit, setIsModulesInit] = useState(init);

	useEffect(() => {
		Language.setUiLanguage(context.globals.lang);
	}, []);

	if (!init) {
		init = true;
		initModulesFrontend().then(() => setIsModulesInit(true));
	}

	if (!isModulesInit) return null;

	return (
		<ContextProviders pageProps={pagePropsJSON} refreshPage={() => alert("Called refresh page")} platform="next">
			<Story />
		</ContextProviders>
	);
};

export default Context;
