const symbols = {};

const debounceFunction = (id: symbol, func: VoidFunction, time: number) => {
	if (symbols[id]) {
		clearTimeout(symbols[id]);
		delete symbols[id];
	}
	symbols[id] = setTimeout(func, time);
};

export default debounceFunction;
