import { ComponentProps, ReactNode } from "react";
import GetErrorComponent from "../../../../extensions/errorHandlers/logic/GetErrorComponent";
import NotFoundErrorComponent from "../components/NotFoundError";

const getFileProviderErrors = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	ENOENT: NotFoundErrorComponent,
});

export default getFileProviderErrors;
