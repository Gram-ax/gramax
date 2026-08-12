import type { Dispatch, SetStateAction } from "react";

export const setStateObjectValue = <T extends object, TKey extends keyof T>(
	setter: Dispatch<SetStateAction<T>>,
	key: TKey,
	value: T[TKey],
) => {
	setter((prev) => ({ ...prev, [key]: value }) as T);
};
