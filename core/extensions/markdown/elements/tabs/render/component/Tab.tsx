import type { ReactElement } from "react";
import TabCase from "./TabCase";

type TabProps = {
	idx: number;
	name?: string;
	icon?: string;
	isPrint?: boolean;
	children?: ReactElement;
};

const Tab = ({ idx, name, icon, isPrint, children }: TabProps): ReactElement => {
	if (isPrint) {
		return (
			<div className="tab">
				<TabCase icon={icon} idx={idx} name={name} />
				<div className="content">{children}</div>
			</div>
		);
	}

	return <div className={`tab c-${idx}`}>{children}</div>;
};

export default Tab;
