import { useOpenState } from "@ext/enterprise/components/admin/hooks/useOpenState";
import { useCallback, useState } from "react";

interface UseSheetSlotArgs {
	keyBase?: string;
}

export interface SheetSlot<T> {
	data: T | null;
	isOpen: boolean;
	session: string;
	openWith: (data: T) => void;
	close: () => void;
}

export const useSheetSlot = <T>(args?: UseSheetSlotArgs): SheetSlot<T> => {
	const [data, setData] = useState<T | null>(null);

	const { isOpen, close, open, key } = useOpenState({ keyBase: args?.keyBase });

	const openWith = useCallback(
		(next: T) => {
			setData(next);
			open();
		},
		[open],
	);

	return { isOpen, data, session: key, openWith, close };
};
