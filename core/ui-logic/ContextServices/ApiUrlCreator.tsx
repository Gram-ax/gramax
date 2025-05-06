import { PageProps } from "@components/ContextProviders";
import ContextService from "@core-ui/ContextServices/ContextService";
import { useRouter } from "@core/Api/useRouter";
import { createContext, ReactElement, useContext, useMemo } from "react";
import ApiUrlCreator from "../ApiServices/ApiUrlCreator";

const ApiUrlCreatorContext = createContext<ApiUrlCreator>(undefined);

class ApiUrlCreatorService implements ContextService {
	Init({ children, pageProps }: { children: ReactElement; pageProps: PageProps }): ReactElement {
		const basePath = useRouter().basePath;
		const isArticlePage = pageProps?.context?.isArticle;

		const apiUrlCreator = useMemo(() => {
			return new ApiUrlCreator(
				basePath,
				isArticlePage ? pageProps?.data?.catalogProps?.name : null,
				isArticlePage ? pageProps?.data?.articleProps?.ref?.path : null,
			);
		}, [basePath, isArticlePage, pageProps?.data?.catalogProps?.name, pageProps?.data?.articleProps?.ref?.path]);

		return <ApiUrlCreatorContext.Provider value={apiUrlCreator}>{children}</ApiUrlCreatorContext.Provider>;
	}

	Provider({ value, children }: { value: ApiUrlCreator; children: ReactElement }) {
		return <ApiUrlCreatorContext.Provider value={value}>{children}</ApiUrlCreatorContext.Provider>;
	}

	get value(): ApiUrlCreator {
		return useContext(ApiUrlCreatorContext);
	}
}

export default new ApiUrlCreatorService();
