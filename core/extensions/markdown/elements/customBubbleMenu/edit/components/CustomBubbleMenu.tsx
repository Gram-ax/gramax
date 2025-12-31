import {
	BubbleMenuPluginProps,
	CustomBubbleMenuPlugin,
} from "@ext/markdown/elements/customBubbleMenu/edit/logic/customBubbleMenuPlugin";
import { useCurrentEditor } from "@tiptap/react";
import React, { useEffect, useState } from "react";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type BubbleMenuProps = Omit<Optional<BubbleMenuPluginProps, "pluginKey">, "element" | "editor"> & {
	editor: BubbleMenuPluginProps["editor"] | null;
	className?: string;
	children: React.ReactNode;
	updateDelay?: number;
};

export const CustomBubbleMenu = (props: BubbleMenuProps) => {
	const [element, setElement] = useState<HTMLDivElement | null>(null);
	const { editor: currentEditor } = useCurrentEditor();

	useEffect(() => {
		if (!element) {
			return;
		}

		if (props.editor?.isDestroyed || currentEditor?.isDestroyed) {
			return;
		}

		const { pluginKey = "bubbleMenu", editor, tippyOptions = {}, updateDelay, shouldShow = null } = props;

		const menuEditor = editor || currentEditor;

		if (!menuEditor) {
			console.warn(
				"BubbleMenu component is not rendered inside of an editor component or does not have editor prop.",
			);
			return;
		}

		const plugin = CustomBubbleMenuPlugin({
			updateDelay,
			editor: menuEditor,
			element,
			pluginKey,
			shouldShow,
			tippyOptions,
		});

		menuEditor.registerPlugin(plugin);
		return () => {
			menuEditor.unregisterPlugin(pluginKey);
		};
	}, [props.editor, currentEditor, element, props?.shouldShow]);

	return (
		<div ref={setElement} className={props.className} style={{ visibility: "hidden" }}>
			{props.children}
		</div>
	);
};
