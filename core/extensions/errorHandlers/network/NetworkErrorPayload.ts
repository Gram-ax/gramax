import type DefaultError from "@ext/errorHandlers/logic/DefaultError";

export const isNetworkErrorPayload = (error: DefaultError): boolean => {
	return error?.props?.errorCode === "network" || error?.type === "Network";
};
