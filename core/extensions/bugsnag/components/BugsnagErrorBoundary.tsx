import type { Environment } from "@app/resolveModule/env";
import type { OnErrorCallback } from "@bugsnag/js";
import bugsnag from "@dynamicImports/bugsnag";
import normalizeStack from "@ext/bugsnag/logic/normalizeStacktrace";
import type { ErrorBoundaryProps } from "@ext/errorHandlers/client/components/ErrorBoundary";
import React from "react";
import sendBug from "../logic/sendBug";

type BugsnagErrorBoundaryProps = ErrorBoundaryProps & { environment: Environment };

class BugsnagErrorBoundary extends React.Component<BugsnagErrorBoundaryProps> {
	constructor(props: BugsnagErrorBoundaryProps) {
		super(props);
		if (!props.context.conf.bugsnagApiKey || typeof window === "undefined") return;
		const onError: OnErrorCallback = (e) => {
			const target = props.environment.toUpperCase();
			e.errors.forEach((e) => {
				if (!e.errorMessage.includes(target)) e.errorMessage = `[${target}:ui] ${e.errorMessage}`;
				normalizeStack(e.stacktrace);
			});
			e.addMetadata("ui_props", { context: { ...props.context, sourceDatas: [], userInfo: null } });
		};
		void bugsnag().then(({ default: Bugsnag }) => {
			if (Bugsnag.isStarted()) Bugsnag.addOnError(onError);
			else {
				Bugsnag.start({
					releaseStage: "production",
					apiKey: props.context.conf.bugsnagApiKey,
					appVersion: props.context.conf.buildVersion,
					onError,
				});
			}
		});
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
