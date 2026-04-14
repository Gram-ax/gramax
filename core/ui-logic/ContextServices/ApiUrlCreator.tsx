import type { PageProps } from "@components/Pages/models/Pages";
import { useRouter } from "@core/Api/useRouter";
import type ContextService from "@core-ui/ContextServices/ContextService";
import { createContext, type ReactElement, useContext, useMemo } from "react";
import ApiUrlCreator from "../ApiServices/ApiUrlCreator";

const ApiUrlCreatorContext = createContext<ApiUrlCreator>(undefined);

/**
 * @deprecated Consider using `useApi(..)` hook instead
 */
class ApiUrlCreatorService implements ContextService {
	Init({ children, pageProps }: { children: ReactElement; pageProps: PageProps }): ReactElement {
		const basePath = useRouter().basePath;
		const isArticlePage = pageProps?.page === "article";
		const articleData = isArticlePage ? pageProps?.data : null;
		const catalogName = articleData?.catalogProps?.name ?? null;
		const articlePath = articleData?.articleProps?.ref?.path ?? null;

		const apiUrlCreator = useMemo(
			() => new ApiUrlCreator(basePath, catalogName, articlePath),
			[basePath, catalogName, articlePath],
		);

		return <ApiUrlCreatorContext.Provider value={apiUrlCreator}>{children}</ApiUrlCreatorContext.Provider>;
	}

	Provider({ value, children }: { value: ApiUrlCreator; children: ReactElement }) {
		return <ApiUrlCreatorContext.Provider value={value}>{children}</ApiUrlCreatorContext.Provider>;
	}

	/**
	 * @deprecated Consider using `useApi(..)` hook instead
	 */
	get value(): ApiUrlCreator {
		return useContext(ApiUrlCreatorContext);
	}
}

export default new ApiUrlCreatorService();
