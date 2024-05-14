import CommandErrors from "@app/types/CommandErrors";
import CommandNotFoundError from "@components/Commands/CommandNotFoundError";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import { ComponentProps, ReactNode } from "react";

const getCommandsErrors = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	[CommandErrors.CommandNotFound]: CommandNotFoundError,
});

export default getCommandsErrors;
