let _timeoutId = null;

const trollCaller = (func: () => void, time: number) => {
	if (_timeoutId) clearTimeout(_timeoutId);
	const tID = setTimeout(func, time);
	_timeoutId = tID;
};

export default trollCaller;
