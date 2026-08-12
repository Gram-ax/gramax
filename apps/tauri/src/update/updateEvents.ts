export enum UpdateAcceptance {
	None,
	Accepted,
	Declined,
}

export type UpdateEvent = { type: "update:reset" } | { type: "update:set-accept"; payload: UpdateAcceptance };

const CHANNEL_NAME = "update-events";

export const createUpdateEventsChannel = () => new BroadcastChannel(CHANNEL_NAME);

// A BroadcastChannel never delivers to the object that sent the message, so this
// sender has to be a channel of its own: the checker in the same window listens
// on the one it created in useUpdateChecker.
const sender = createUpdateEventsChannel();

export const postUpdateAcceptance = (payload: UpdateAcceptance) => {
	sender.postMessage({ type: "update:set-accept", payload } satisfies UpdateEvent);
};
