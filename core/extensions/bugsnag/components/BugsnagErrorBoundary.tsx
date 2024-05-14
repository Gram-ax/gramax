import { getExecutingEnvironment } from "@app/resolveModule/env";
import Bugsnag, { OnErrorCallback } from "@bugsnag/js";
import React, { ReactNode } from "react";
import PageDataContext from "../../../logic/Context/PageDataContext";
import sendBug from "../logic/sendBug";

type ErrorBoundaryProps = { context: PageDataContext; children: ReactNode };

class BugsnagErrorBoundary extends React.Component<ErrorBoundaryProps> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		if (!props.context.conf.bugsnagApiKey) return;
		const onError: OnErrorCallback = (e) => {
			e.addFeatureFlag("env", getExecutingEnvironment());
			e.addMetadata("props", { ...props.context, sourceDatas: [], userInfo: null });
		};
		if (Bugsnag.isStarted()) Bugsnag.addOnError(onError);
		else Bugsnag.start({ apiKey: props.context.conf.bugsnagApiKey, onError });
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
