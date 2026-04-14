import type { PageProps } from "@components/Pages/models/Pages";
import type { ReactElement } from "react";

// biome-ignore lint/suspicious/noExplicitAny: expected
interface ContextService<T = any> {
	Init({ children }: { pageProps?: PageProps; children: ReactElement }): ReactElement;
	Provider?({ children, value }: { children: ReactElement; value: T }): ReactElement;
}

export default ContextService;
