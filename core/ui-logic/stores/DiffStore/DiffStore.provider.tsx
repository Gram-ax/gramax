import type { ArticleDiffData } from "@core/SitePresenter/types/ArticlePage";
import { createDiffStore, type DiffStore } from "@core-ui/stores/DiffStore/DiffStore";
import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

type DiffStoreApi = ReturnType<typeof createDiffStore>;

const DiffStoreContext = createContext<DiffStoreApi | undefined>(undefined);

interface DiffStoreProviderProps {
	children: ReactNode;
	diff: ArticleDiffData | undefined;
}

export const DiffStoreProvider = ({ children, diff }: DiffStoreProviderProps) => {
	const storeRef = useRef<DiffStoreApi>(null);

	if (storeRef.current === null) {
		storeRef.current = createDiffStore({ diff });
	}

	useEffect(() => {
		storeRef.current?.setState({ diff });
	}, [diff]);

	if (storeRef.current === null) return null;
	return <DiffStoreContext.Provider value={storeRef.current}>{children}</DiffStoreContext.Provider>;
};

export const useDiffStore = <T,>(
	selector: (store: DiffStore) => T,
	equalityFn?: ((a: T, b: T) => boolean) | "shallow",
): T => {
	const ctx = useContext(DiffStoreContext);
	if (!ctx) return selector({ diff: undefined, setDiff: () => undefined });

	const actualEqualityFn = equalityFn === "shallow" ? shallow : equalityFn;
	return useStoreWithEqualityFn(ctx, selector, actualEqualityFn);
};

export const useDiff = (): ArticleDiffData | undefined => useDiffStore((s) => s.diff);
