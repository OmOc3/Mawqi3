import test from "node:test";
import assert from "node:assert/strict";
import { clientSignupSchema } from "../lib/validation/auth.ts";

test("clientSignupSchema accepts a valid public client signup payload", () => {
  const result = clientSignupSchema.safeParse({
    accessCode: "CLIENT123",
    addressesText: "القاهرة\nالجيزة",
    displayName: "شركة العميل",
    email: "client@example.com",
    phone: "+20 100 000 0000",
  });

  assert.equal(result.success, true);
});

test("clientSignupSchema rejects weak access codes and invalid phone values", () => {
  const result = clientSignupSchema.safeParse({
    accessCode: "short",
    displayName: "عميل",
    email: "client@example.com",
    phone: "phone<script>",
  });

  assert.equal(result.success, false);
});

test("clientSignupSchema limits address count", () => {
  const result = clientSignupSchema.safeParse({
    accessCode: "CLIENT123",
    addressesText: Array.from({ length: 9 }, (_, index) => `عنوان ${index + 1}`).join("\n"),
    displayName: "شركة العميل",
    email: "client@example.com",
  });

  assert.equal(result.success, false);
});
