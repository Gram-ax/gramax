import type Context from "@core/Context/Context";
import { AsyncLocalStorage } from "async_hooks";

const withContext = <T>(ctx: Context, fn: () => Promise<T>): Promise<T> => {
	if (!global.hook) global.hook = new AsyncLocalStorage<{ ctx: Context }>();
	return global.hook.run({ ctx }, fn);
};

export default withContext;
