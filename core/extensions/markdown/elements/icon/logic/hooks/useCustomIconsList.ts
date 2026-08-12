import { useApi } from "@core-ui/hooks/useApi";
import type { IconEditorProps } from "@ext/markdown/elements/icon/edit/model/types";
import { useLayoutEffect, useState } from "react";

export const useCustomIconsList = () => {
	const [customIcons, setCustomIcons] = useState<IconEditorProps[]>([]);

	const { call: fetchIcons } = useApi<IconEditorProps[]>({
		url: (api) => api.getCustomIconsList(),
		onDone: (data) => {
			if (data) setCustomIcons(data);
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		void fetchIcons();
	}, []);

	return customIcons;
};
