import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import { ReactNode } from "react";

const PublishLeftNavContentWrapper = (props: { children: ReactNode }) => {
	const { children } = props;
	const isOpen = SidebarsIsOpenService.value.left;
	return <div style={{ paddingRight: isOpen ? undefined : "30px", height: "100%" }}>{children}</div>;
};

export default PublishLeftNavContentWrapper;
