import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import { ReactNode } from "react";

const PublishLeftNavContentWrapper = (props: { children: ReactNode }) => {
	const { children } = props;
	const isOpen = LeftNavigationIsOpenService.value;
	return <div style={{ paddingRight: isOpen ? undefined : "30px", height: "100%" }}>{children}</div>;
};

export default PublishLeftNavContentWrapper;
