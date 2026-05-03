import test from "node:test";
import assert from "node:assert/strict";
import { buildCloudinaryProxyTargetUrl, rewriteCloudinaryUrl } from "../lib/cloudinary/utils.ts";

const originalCustomDomain = process.env.CLOUDINARY_CUSTOM_DOMAIN;

test.afterEach(() => {
  if (originalCustomDomain === undefined) {
    delete process.env.CLOUDINARY_CUSTOM_DOMAIN;
  } else {
    process.env.CLOUDINARY_CUSTOM_DOMAIN = originalCustomDomain;
  }
});

test("rewriteCloudinaryUrl maps Cloudinary delivery URLs to the configured app domain", () => {
  process.env.CLOUDINARY_CUSTOM_DOMAIN = "https://api.ecopest.com";

  const rewrittenUrl = rewriteCloudinaryUrl(
    "https://res.cloudinary.com/demo/image/upload/v123/ecopest/reports/report.jpg",
    "demo",
  );

  assert.equal(rewrittenUrl, "https://api.ecopest.com/image/upload/v123/ecopest/reports/report.jpg");
});

test("rewriteCloudinaryUrl leaves unrelated Cloudinary accounts unchanged", () => {
  process.env.CLOUDINARY_CUSTOM_DOMAIN = "https://api.ecopest.com";

  const originalUrl = "https://res.cloudinary.com/other/image/upload/v123/ecopest/reports/report.jpg";

  assert.equal(rewriteCloudinaryUrl(originalUrl, "demo"), originalUrl);
});

test("buildCloudinaryProxyTargetUrl forwards app image paths to Cloudinary", () => {
  const targetUrl = buildCloudinaryProxyTargetUrl(["v123", "ecopest", "reports", "report.jpg"], "demo", "?_a=1");

  assert.equal(targetUrl, "https://res.cloudinary.com/demo/image/upload/v123/ecopest/reports/report.jpg?_a=1");
});
