const MULTI_ACTION_REASON =
	"baseline_single_action_violation: one assistant response contained more than one tool call";

function toolCallsFromAssistantMessage(message) {
	if (!message || !Array.isArray(message.content)) {
		throw new TypeError("assistantMessage.content must be an array");
	}
	return message.content.filter((item) => item?.type === "toolCall");
}

/**
 * Pi's provider hooks accept an unknown payload. Baseline only supports JSON
 * object payloads because `parallel_tool_calls` is a top-level request field.
 * A new object is returned so the provider's payload is not mutated in place.
 */
export function forceParallelToolCallsFalse(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		throw new TypeError("provider payload must be a non-array object");
	}
	return { ...payload, parallel_tool_calls: false };
}

/**
 * Mechanical `beforeToolCall` guard for pi-agent-core. When a response contains
 * multiple tool calls, every call is blocked; executing only the first could
 * create partial business side effects.
 */
export function singleActionBeforeToolCall({ assistantMessage }) {
	const actionCount = toolCallsFromAssistantMessage(assistantMessage).length;
	if (actionCount <= 1) {
		return undefined;
	}
	return {
		block: true,
		reason: `${MULTI_ACTION_REASON}; observed=${actionCount}`,
	};
}

export const baselineAdapterContract = Object.freeze({
	parallelToolCalls: false,
	maxToolCallsPerAssistantResponse: 1,
	multiActionDisposition: "block_all",
});
