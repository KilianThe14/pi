import test from "node:test";
import assert from "node:assert/strict";
import {
	baselineAdapterContract,
	forceParallelToolCallsFalse,
	singleActionBeforeToolCall,
} from "../src/baseline-adapter.mjs";

test("forces parallel_tool_calls=false without mutating the provider payload", () => {
	const payload = { model: "test-model", parallel_tool_calls: true, input: [] };
	const adapted = forceParallelToolCallsFalse(payload);

	assert.notStrictEqual(adapted, payload);
	assert.equal(adapted.parallel_tool_calls, false);
	assert.equal(payload.parallel_tool_calls, true);
	assert.deepEqual(adapted.input, []);
});

test("rejects payload shapes that cannot carry the top-level provider field", () => {
	for (const payload of [null, undefined, "text", [], 1]) {
		assert.throws(() => forceParallelToolCallsFalse(payload), TypeError);
	}
});

test("allows zero or one tool call", () => {
	const noAction = { content: [{ type: "text", text: "done" }] };
	const oneAction = { content: [{ type: "toolCall", id: "1", name: "lookup", arguments: {} }] };

	assert.equal(singleActionBeforeToolCall({ assistantMessage: noAction }), undefined);
	assert.equal(singleActionBeforeToolCall({ assistantMessage: oneAction }), undefined);
});

test("blocks every tool execution when one response contains multiple actions", () => {
	const assistantMessage = {
		content: [
			{ type: "toolCall", id: "1", name: "lookup", arguments: {} },
			{ type: "text", text: "and" },
			{ type: "toolCall", id: "2", name: "price", arguments: {} },
		],
	};

	for (const toolCall of assistantMessage.content.filter((item) => item.type === "toolCall")) {
		const result = singleActionBeforeToolCall({ assistantMessage, toolCall });
		assert.equal(result.block, true);
		assert.match(result.reason, /observed=2/);
	}
});

test("publishes the neutral adapter contract", () => {
	assert.deepEqual(baselineAdapterContract, {
		parallelToolCalls: false,
		maxToolCallsPerAssistantResponse: 1,
		multiActionDisposition: "block_all",
	});
	assert.equal(Object.isFrozen(baselineAdapterContract), true);
});
