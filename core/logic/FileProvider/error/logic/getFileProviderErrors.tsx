import { ComponentProps, ReactNode } from "react";
import GetErrorComponent from "../../../../extensions/errorHandlers/logic/GetErrorComponent";
import NotFountErrorComponent from "../components/NotFountError";

const getFileProviderErrors = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	ENOENT: NotFountErrorComponent,
});

export default getFileProviderErrors;
