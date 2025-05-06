import { PageProps } from "@components/ContextProviders";
import { ReactElement } from "react";

interface ContextService<T = any> {
	Init({ children }: { pageProps?: PageProps; children: ReactElement }): ReactElement;
	Provider?({ children, value }: { children: ReactElement; value: T }): ReactElement;
}

export default ContextService;
