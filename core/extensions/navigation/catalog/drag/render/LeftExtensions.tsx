import React from "react";
import CommentCountNavExtension from "../../../../markdown/elements/comment/edit/components/CommentCountNavExtension";
import { ItemLink } from "../../../NavigationLinks";
import IconExtension from "../../main/render/IconExtension";

interface LeftExtensionsProps {
	item: ItemLink;
}

const LeftExtensions: React.FC<LeftExtensionsProps> = ({ item }) => {
	return (
		<>
			<IconExtension item={item} />
			<CommentCountNavExtension item={item} />
		</>
	);
};

export default LeftExtensions;
