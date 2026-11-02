import { test } from "node:test";
import assert from "node:assert/strict";
import { approvedUser, workspaceId, appMode } from "../lib/access";
test("deny access by default and only admit exact approved identities", () => {
  assert.equal(approvedUser("alice", ""), false);
  assert.equal(approvedUser("alice", "bob"), false);
  assert.equal(approvedUser("alice", " alice, bob "), true);
  assert.equal(approvedUser("ali", "alice"), false);
});
test("workspace keys must come from verified UUID identities", () => {
  assert.throws(() => workspaceId(""));
  assert.throws(() => workspaceId("main"));
  assert.throws(() => workspaceId("../alice"));
  const a = workspaceId("11111111-1111-4111-8111-111111111111"),
    b = workspaceId("22222222-2222-4222-8222-222222222222");
  assert.notEqual(a, b);
});
test("invalid application modes cannot silently disable authentication", () => {
  assert.equal(appMode("demo"), "demo");
  assert.equal(appMode("production"), "production");
  assert.throws(() => appMode("prod"));
});
