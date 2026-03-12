const symbols = {};

const debounceFunction = (id: symbol, func: () => void | Promise<void>, time: number) => {
	const cancel = () => {
		if (symbols[id]) {
			clearTimeout(symbols[id]);
			delete symbols[id];
		}
	};
	cancel();

	const callback = async () => {
		await func();
		cancel();
	};

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	symbols[id] = setTimeout(callback, time);

	return cancel;
};

export default debounceFunction;
