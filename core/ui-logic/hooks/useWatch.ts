import { useRef } from "react";

function refreshPrevStates<T extends () => void>(ref: { current: unknown[] }, newState: unknown[], callback: T) {
	ref.current = [...newState];
	callback();
}

function useWatch<T extends () => void>(callback: T, state: unknown[]): void {
	const prevStates = useRef<unknown[]>(Array(state.length));

	for (let i = 0; i < state.length; i++) {
		if (Object.is(prevStates.current[i], state[i])) continue;
		refreshPrevStates<T>(prevStates, state, callback);
		return;
	}

	if (state.length !== prevStates.current.length) refreshPrevStates<T>(prevStates, state, callback);
}

export default useWatch;
