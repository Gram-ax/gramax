import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

const TabsMenuButton = ({ editor }: { editor: Editor }) => {
	return (
		<Button
			onClick={() => editor.chain().focus().setTabs().run()}
			icon={"browser"}
			tooltipText={"Табы"}
			nodeValues={{ action: "tabs" }}
		/>
	);
};

export default TabsMenuButton;
