import type Context from "@core/Context/Context";

export const getContext = () => {
	return global.hook?.getStore()?.ctx as Context;
};
