import { Suspense, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { Admin } from "./components/Admin";

const root = document.getElementById("root");
if (root)
	startTransition(() => {
		hydrateRoot(
			root,
			<Suspense>
				<Admin data={window.initialData.data} />
			</Suspense>,
		);
	});
