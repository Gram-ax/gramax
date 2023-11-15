import { Extension, Node } from "@tiptap/core";

export type ExtensionFilter = (extension: Node<any, any> | Extension<any, any>) => boolean;
