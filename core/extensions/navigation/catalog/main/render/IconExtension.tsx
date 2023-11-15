import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import { ItemLink } from "../../../NavigationLinks";

const IconExtension = styled(({ item, className }: { item: ItemLink; className?: string }) => {
	return <>{item?.icon ? <Icon code={item.icon} className={className} style={{}} /> : null}</>;
})`
	font-size: 0.7em;
	font-weight: 600;
	padding-left: 0.5em;
	vertical-align: 1px;
`;

export default IconExtension;
