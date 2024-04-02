import { ReactElement } from "react";

const Tab = ({ idx, children }: { idx: number; children?: ReactElement }): ReactElement => {
	return <div className={`tab c-${idx}`}>{children}</div>;
};

export default Tab;
