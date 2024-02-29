const symbols = {};

const trollCaller = (id: symbol, func: () => Promise<any>, time: number) => {
	if (symbols[id]) {
		clearTimeout(symbols[id]);
		delete symbols[id];
	}
	symbols[id] = setTimeout(() => void func(), time);
};

export default trollCaller;
