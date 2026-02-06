import isMobileService from "@core-ui/ContextServices/isMobileService";
import { EditorProps } from "@tiptap/pm/view";
import { useMemo } from "react";

const getDesktopProps = () => ({
	attributes: {
		role: "textbox",
		tabindex: "0",
		autocomplete: "off",
		autocorrect: "off",
		autocapitalize: "off",
		"aria-multiline": "true",
		"aria-label": "Main content area, start typing to enter text.",
	},
});

const getMobileProps = () => ({
	attributes: {
		role: "textbox",
		tabindex: "0",
		autocomplete: "off",
		autocorrect: "off",
		autocapitalize: "off",
		"aria-multiline": "true",
		"aria-label": "Main content area, start typing to enter text.",
	},
	scrollThreshold: 80,
	scrollMargin: 80,
});

export const useGetEditorProps = (): EditorProps => {
	const isMobile = isMobileService.value;
	return useMemo(() => (isMobile ? getMobileProps() : getDesktopProps()), [isMobile]);
};
