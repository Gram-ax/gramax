import type TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import type { ReactElement } from "react";
import TabCase from "./TabCase";

type TabProps = TabAttrs & {
	isPrint?: boolean;
	children?: ReactElement;
};

const Tab = ({ idx, name, icon, isPrint, children }: TabProps): ReactElement => {
	if (isPrint) {
		return (
			<div className="tab">
				<TabCase icon={icon} idx={idx} isPrint name={name} />
				<div className="content">{children}</div>
			</div>
		);
	}

	return <div className={`tab c-${idx}`}>{children}</div>;
};

export default Tab;
