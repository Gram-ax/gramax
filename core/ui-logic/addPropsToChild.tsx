import React from "react";

const addPropsToChild = (children: JSX.Element | JSX.Element[], props: any): JSX.Element[] => {
	return React.Children.map(children, (child) => {
		if (React.isValidElement(child)) return React.cloneElement(child, { ...props });
		return child;
	});
};

export default addPropsToChild;
