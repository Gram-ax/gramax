const createAwaiter = (timeout: number = 20, callback: () => boolean) => {
	let attempt = 0;
	const interval = setInterval(() => {
		if (attempt >= 9 || callback()) return clearInterval(interval);
		attempt++;
	}, timeout);
};

export default createAwaiter