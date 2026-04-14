import type FileStructueErrorCode from "@core/FileStructue/error/model/FileStructueErrorCode";
import type { ComponentProps, ReactNode } from "react";
import type GetErrorComponent from "../../../../extensions/errorHandlers/logic/GetErrorComponent";
import ArticleNotFoundErrorComponent from "../components/NotFoundError";

const getFileStructueErrors = (): {
	[key in FileStructueErrorCode]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	ArticleNotFoundError: ArticleNotFoundErrorComponent,
});

export default getFileStructueErrors;
