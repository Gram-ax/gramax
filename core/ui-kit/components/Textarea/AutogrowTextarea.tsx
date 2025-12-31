"use client";

import dynamic from "next/dynamic";

export const AutogrowTextarea = dynamic(
	() => import("ics-ui-kit/components/textarea").then((mod) => ({ default: mod.AutogrowTextarea })),
	{ ssr: false },
);
