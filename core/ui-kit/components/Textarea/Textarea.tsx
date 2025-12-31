"use client";

import dynamic from "next/dynamic";

export const Textarea = dynamic(
	() => import("ics-ui-kit/components/textarea").then((mod) => ({ default: mod.Textarea })),
	{ ssr: false },
);
