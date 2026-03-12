import CommentCountNavExtension from "../../../../markdown/elements/comment/edit/components/CommentCountNavExtension";
import type { ItemLink } from "../../../NavigationLinks";
import IconExtension from "../../main/render/IconExtension";

interface LeftExtensionsProps {
	item: ItemLink;
}

const LeftExtensions = ({ item }: LeftExtensionsProps) => {
	return (
		<>
			<IconExtension item={item} />
			<CommentCountNavExtension item={item} />
		</>
	);
};

export default LeftExtensions;
