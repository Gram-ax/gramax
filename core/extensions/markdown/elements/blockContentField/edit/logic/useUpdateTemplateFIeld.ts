import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import { JSONContent } from "@tiptap/core";
import { Fragment, Node } from "@tiptap/pm/model";
import { useCallback, useState } from "react";

const isUpdate = (value: JSONContent) => {
	const valueExists = value.length && value[0].content?.length;
	const manyNodes = value.length >= 1 && value[0].type !== "paragraph";

	return valueExists || manyNodes;
};

const useUpdateTemplateField = (node: Node) => {
	const [content, setContent] = useState<string>(JSON.stringify(node.content.toJSON()));
	const debouncedUpdate = useDebounce((id: string, content: Fragment) => {
		update(id, content);
	}, 200);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const deleteHandler = useCallback(
		(id: string) => {
			const url = apiUrlCreator.removeTemplateArticleField(id);
			void FetchService.fetch(url);
		},
		[apiUrlCreator],
	);

	const updateHandler = useCallback(
		(id: string, value?: string) => {
			const url = apiUrlCreator.updateTemplateArticleField(id);
			void FetchService.fetch(url, value);
		},
		[apiUrlCreator],
	);

	const update = useCallback(
		(id: string, newContent: Fragment) => {
			if (!id) return;
			const value = newContent.toJSON();
			const stringifiedValue = JSON.stringify(value);

			if (stringifiedValue === content) return;
			isUpdate(value) ? updateHandler(id, stringifiedValue) : deleteHandler(id);
			setContent(stringifiedValue);
		},
		[deleteHandler, updateHandler, content],
	);

	useWatch(() => {
		debouncedUpdate.cancel();
		debouncedUpdate.start(node.attrs.bind, node.content);
	}, [node.content]);
};

export default useUpdateTemplateField;
