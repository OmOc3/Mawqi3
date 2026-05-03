import { NextRequest, NextResponse } from "next/server";
import { buildCloudinaryProxyTargetUrl } from "@/lib/cloudinary/utils";

interface CloudinaryImageRouteProps {
  params: Promise<{
    path: string[];
  }>;
}

export const runtime = "nodejs";

function getCloudinaryCloudName(): string | null {
  return process.env.CLOUDINARY_CLOUD_NAME?.trim() || null;
}

function createForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const forwardedHeaderNames = ["accept", "if-modified-since", "if-none-match", "range"] as const;

  forwardedHeaderNames.forEach((headerName) => {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  });

  return headers;
}

function createResponseHeaders(upstreamResponse: Response): Headers {
  const headers = new Headers();
  const copiedHeaderNames = [
    "accept-ranges",
    "cache-control",
    "content-disposition",
    "content-range",
    "content-type",
    "etag",
    "expires",
    "last-modified",
    "x-cld-error",
  ] as const;

  copiedHeaderNames.forEach((headerName) => {
    const value = upstreamResponse.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  });

  if (!headers.has("cache-control") && upstreamResponse.ok) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  }

  return headers;
}

async function proxyCloudinaryImage(request: NextRequest, { params }: CloudinaryImageRouteProps): Promise<NextResponse> {
  const cloudName = getCloudinaryCloudName();

  if (!cloudName) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  }

  const { path } = await params;

  if (path.length === 0) {
    return NextResponse.json({ error: "Cloudinary image path is missing." }, { status: 404 });
  }

  const targetUrl = buildCloudinaryProxyTargetUrl(path, cloudName, request.nextUrl.search);
  const upstreamResponse = await fetch(targetUrl, {
    headers: createForwardHeaders(request),
    method: request.method,
    redirect: "follow",
  });
  const responseBody = request.method === "HEAD" || upstreamResponse.status === 304 ? null : upstreamResponse.body;

  return new NextResponse(responseBody, {
    headers: createResponseHeaders(upstreamResponse),
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}

export async function GET(request: NextRequest, props: CloudinaryImageRouteProps): Promise<NextResponse> {
  return proxyCloudinaryImage(request, props);
}

export async function HEAD(request: NextRequest, props: CloudinaryImageRouteProps): Promise<NextResponse> {
  return proxyCloudinaryImage(request, props);
}
