import ButtonLink, { ButtonLinkProps } from "@components/Molecules/ButtonLink";
import { forwardRef, MutableRefObject } from "react";

const ListItem = forwardRef((props: ButtonLinkProps, ref?: MutableRefObject<HTMLLIElement>) => {
	return (
		<li ref={ref} style={{ listStyleType: "none" }}>
			<ButtonLink {...props} />
		</li>
	);
});

export default ListItem;
