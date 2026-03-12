import { useCallback, useState } from "react";

export const useActiveRule = () => {
	const [activeProvider, setActiveProvider] = useState<"lgt" | "llm">("lgt");
	const [selectedLgtGuid, setSelectedLgtGuid] = useState<string | null>(null);
	const [selectedLlmGuid, setSelectedLlmGuid] = useState<string | null>(null);

	const getSelectedGuid = useCallback(
		() => (activeProvider === "lgt" ? selectedLgtGuid : selectedLlmGuid),
		[activeProvider, selectedLgtGuid, selectedLlmGuid],
	);

	const setSelectedGuid = useCallback(
		(guid: string | null) => {
			if (activeProvider === "lgt") setSelectedLgtGuid(guid);
			else setSelectedLlmGuid(guid);
		},
		[activeProvider],
	);

	const activate = useCallback((provider: "lgt" | "llm", guid: string) => {
		setActiveProvider(provider);
		if (provider === "lgt") setSelectedLgtGuid(guid);
		else setSelectedLlmGuid(guid);
	}, []);

	return {
		activeProvider,
		selectedLgtGuid,
		selectedLlmGuid,
		getSelectedGuid,
		setSelectedGuid,
		activate,
	};
};
