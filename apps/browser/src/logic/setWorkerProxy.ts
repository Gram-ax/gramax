const setWorkerProxy = (corsProxy: string) => {
	(window as any).wasm.postMessage({ type: "set-proxy", corsProxy });
};

export default setWorkerProxy;
