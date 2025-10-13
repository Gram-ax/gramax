import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { createContext, ElementType, forwardRef, HTMLAttributes, ReactNode, RefObject, useContext } from "react";

const NodeViewContext = createContext<NodeViewProps>({
	decorations: [],
	deleteNode: () => {},
	editor: null,
	getPos: () => 0,
	node: null,
	selected: false,
	updateAttributes: () => {},
	view: null,
	innerDecorations: null,
	extension: null,
	HTMLAttributes: {},
});

interface NodeViewContextableProps extends Partial<HTMLAttributes<HTMLElement>> {
	children: ReactNode;
	props: NodeViewProps;
}

interface NodeViewContextableWrapperProps extends NodeViewContextableProps {
	as?: ElementType;
}

export const useNodeViewContext = () => {
	const context = useContext(NodeViewContext);
	return context;
};

export const NodeViewContextableWrapper = forwardRef(
	({ children, props, as, ...rest }: NodeViewContextableWrapperProps, ref: RefObject<HTMLElement>) => {
		return (
			<NodeViewWrapper {...rest} ref={ref} as={as}>
				<NodeViewContext.Provider value={props}>
					<div className="flex flex-col">{children}</div>
				</NodeViewContext.Provider>
			</NodeViewWrapper>
		);
	},
);
