import { useRef } from "react";

type Callback = () => Promise<void> | void;

function refreshPrevStates<T extends Callback>(ref: { current: unknown[] }, newState: unknown[], callback: T) {
	ref.current = [...newState];
	void callback();
}

function useWatch<T extends Callback>(callback: T, state: unknown[]): void {
	const prevStates = useRef<unknown[] | undefined>(undefined);
	if (!prevStates.current) refreshPrevStates<T>(prevStates, state, callback);

	for (let i = 0; i < state.length; i++) {
		if (Object.is(prevStates.current[i], state[i])) continue;
		refreshPrevStates<T>(prevStates, state, callback);
		return;
	}

	if (state.length !== prevStates.current.length) refreshPrevStates<T>(prevStates, state, callback);
}

export default useWatch;
