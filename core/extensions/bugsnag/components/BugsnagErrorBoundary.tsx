import { getExecutingEnvironment } from "@app/resolveModule";
import Bugsnag, { OnErrorCallback } from "@bugsnag/js";
import React from "react";
import PageDataContext from "../../../logic/Context/PageDataContext";
import sendBug from "../logic/sendBug";

class BugsnagErrorBoundary extends React.Component<{ context: PageDataContext; children: JSX.Element }> {
	constructor(props) {
		super(props);
		if (!props.context.bugsnagApiKey) return;
		const onError: OnErrorCallback = (e) => {
			e.addFeatureFlag("env", getExecutingEnvironment());
			e.addMetadata("props", { ...props.context, sourceDatas: [], userInfo: null });
		};
		if (Bugsnag.isStarted()) Bugsnag.addOnError(onError);
		else Bugsnag.start({ apiKey: props.context.bugsnagApiKey, onError });
	}

	static getDerivedStateFromError(error) {
		return { error };
	}

	override componentDidCatch(error) {
		sendBug(error);
	}

	override render() {
		return <>{this.props.children}</>;
	}
}

export default BugsnagErrorBoundary;
