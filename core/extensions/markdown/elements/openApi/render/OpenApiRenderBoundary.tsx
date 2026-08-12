import { Component, type PropsWithChildren, type ReactNode } from "react";

// PropsWithChildren rather than a required `children`: only the optional form lets callers (the tests
// included) pass children as createElement's third argument, which is what biome's noChildrenProp wants.
interface OpenApiRenderBoundaryProps extends PropsWithChildren {
	onError: (error: Error) => void;
	/** Reference that changes on the next successful spec load, clearing a caught error without a remount. */
	resetKey?: unknown;
}

interface OpenApiRenderBoundaryState {
	hasError: boolean;
	resetKey?: unknown;
}

/** Catches renderer bugs (D) so the rest of the article keeps working; the caller renders the fallback block. */
class OpenApiRenderBoundary extends Component<OpenApiRenderBoundaryProps, OpenApiRenderBoundaryState> {
	state: OpenApiRenderBoundaryState = { hasError: false, resetKey: this.props.resetKey };

	static getDerivedStateFromError(): Partial<OpenApiRenderBoundaryState> {
		return { hasError: true };
	}

	static getDerivedStateFromProps(
		props: OpenApiRenderBoundaryProps,
		state: OpenApiRenderBoundaryState,
	): Partial<OpenApiRenderBoundaryState> | null {
		if (props.resetKey !== state.resetKey) return { hasError: false, resetKey: props.resetKey };
		return null;
	}

	componentDidCatch(error: Error): void {
		this.props.onError(error);
	}

	render(): ReactNode {
		if (this.state.hasError) return null;
		return this.props.children;
	}
}

export default OpenApiRenderBoundary;
