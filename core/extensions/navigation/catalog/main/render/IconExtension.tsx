import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import { ItemLink } from "../../../NavigationLinks";

const IconExtension = styled(({ item, className }: { item: ItemLink; className?: string }) => {
	return item?.icon ? <Icon className={className} code={item.icon} strokeWidth="2" /> : null;
})`
	font-size: 0.7em;
	font-weight: 600;
	padding-left: 0.5em;
	vertical-align: 1px;
`;

export default IconExtension;
