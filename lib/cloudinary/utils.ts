export function rewriteCloudinaryUrl(url: string, cloudName: string): string {
  const customDomain = process.env.CLOUDINARY_CUSTOM_DOMAIN || "https://api.ecopest.com";
  // The secure_url returned by Cloudinary is usually https://res.cloudinary.com/<cloudName>/...
  return url.replace(`https://res.cloudinary.com/${cloudName}`, customDomain);
}
