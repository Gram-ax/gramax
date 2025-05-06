export const call = async <O>(command: string, args?: any): Promise<O> => {
	if (command === "is_init") return Promise.resolve(false as O);
	throw new Error("git call not supported in static environment");
};
