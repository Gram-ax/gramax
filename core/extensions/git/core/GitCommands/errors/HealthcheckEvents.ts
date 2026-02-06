import { createEventEmitter, type Event } from "@core/Event/EventEmitter";

export type HealthcheckEvents = Event<"healthcheck-failed", { repoPath: string; error: Error }>;

export const healthcheckEvents = createEventEmitter<HealthcheckEvents>();
