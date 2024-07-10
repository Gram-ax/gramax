import { getExecutingEnvironment } from "@app/resolveModule/env";
import Bugsnag, { OnErrorCallback } from "@bugsnag/js";
import normalizeStack from "@ext/bugsnag/logic/normalizeStacktrace";
import { ErrorBoundaryProps } from "@ext/errorHandlers/client/components/ErrorBoundary";
import React from "react";
import sendBug from "../logic/sendBug";
class BugsnagErrorBoundary extends React.Component<ErrorBoundaryProps> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		if (!props.context.conf.bugsnagApiKey || typeof window === "undefined") return;
		const onError: OnErrorCallback = (e) => {
			const target = getExecutingEnvironment().toUpperCase();
			e.errors.forEach((e) => {
				if (!e.errorMessage.includes(target)) e.errorMessage = `[${target}:ui] ${e.errorMessage}`;
				normalizeStack(e.stacktrace);
			});
			e.addMetadata("ui_props", { context: { ...props.context, sourceDatas: [], userInfo: null } });
		};
		if (Bugsnag.isStarted()) Bugsnag.addOnError(onError);
		else {
			Bugsnag.start({
				releaseStage: "production",
				apiKey: props.context.conf.bugsnagApiKey,
				appVersion: props.context.conf.buildVersion,
				onError,
			});
		}
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
