import test from "node:test";
import assert from "node:assert/strict";
import { extractStationIdFromQrValue } from "@ecopest/shared/qr";

test("extractStationIdFromQrValue reads station report URLs", () => {
  assert.equal(
    extractStationIdFromQrValue("https://ecopest.example/station/000123/report?qr=token"),
    "000123",
  );
  assert.equal(extractStationIdFromQrValue("/station/ABC-123/report"), "ABC-123");
});

test("extractStationIdFromQrValue reads legacy client-station QR values", () => {
  assert.equal(
    extractStationIdFromQrValue("client-station:000123:5b28c4e1-b91e-4e6f-99ce-dc8ef9fd0d57"),
    "000123",
  );
});

test("extractStationIdFromQrValue rejects unrelated QR values", () => {
  assert.equal(extractStationIdFromQrValue("https://ecopest.example/scan"), null);
  assert.equal(extractStationIdFromQrValue("client-station:"), null);
});
