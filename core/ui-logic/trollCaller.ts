let _timeoutId = null;

const trollCaller = (func: () => Promise<any>, time: number) => {
	if (_timeoutId) clearTimeout(_timeoutId);
	_timeoutId = setTimeout(() => void func(), time);
};

export default trollCaller;
