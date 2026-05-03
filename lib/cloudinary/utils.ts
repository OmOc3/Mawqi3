const DEFAULT_CLOUDINARY_DELIVERY_BASE_URL = "https://api.ecopest.com";

function normalizeBaseUrl(value: string | undefined): string {
  const candidate = value?.trim() || DEFAULT_CLOUDINARY_DELIVERY_BASE_URL;
  const url = new URL(candidate);

  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export function getCloudinaryDeliveryBaseUrl(): string {
  return normalizeBaseUrl(process.env.CLOUDINARY_CUSTOM_DOMAIN);
}

export function rewriteCloudinaryUrl(url: string, cloudName: string): string {
  try {
    const parsedUrl = new URL(url);
    const cloudinaryPrefix = `/${cloudName}`;

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "res.cloudinary.com" ||
      !parsedUrl.pathname.startsWith(`${cloudinaryPrefix}/`)
    ) {
      return url;
    }

    const deliveryBaseUrl = new URL(getCloudinaryDeliveryBaseUrl());
    const deliveryPathname = deliveryBaseUrl.pathname === "/" ? "" : deliveryBaseUrl.pathname.replace(/\/+$/, "");

    parsedUrl.protocol = deliveryBaseUrl.protocol;
    parsedUrl.host = deliveryBaseUrl.host;
    parsedUrl.pathname = `${deliveryPathname}${parsedUrl.pathname.slice(cloudinaryPrefix.length)}`;

    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export function buildCloudinaryProxyTargetUrl(pathSegments: string[], cloudName: string, search: string): string {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const targetUrl = new URL(`https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${encodedPath}`);

  targetUrl.search = search.startsWith("?") ? search.slice(1) : search;

  return targetUrl.toString();
}
