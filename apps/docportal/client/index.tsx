import "./logic/polyfills";
import "../../../core/styles/main.css";
import "../../../core/styles/chain-icon.css";
import type { PageProps } from "@components/Pages/models/Pages";
import { Suspense, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./components/App";

declare global {
	interface Window {
		initialData: {
			data: PageProps;
		};
	}
}

const root = document.getElementById("root");
if (root)
	startTransition(() => {
		hydrateRoot(
			root,
			<Suspense>
				<App initialData={window.initialData.data} />
			</Suspense>,
		);
	});
