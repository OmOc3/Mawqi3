import { NextResponse } from "next/server";
import { uploadProfileImageToCloudinary } from "@/lib/cloudinary/profile-images";
import { requireRole } from "@/lib/auth/server-session";
import { writeAuditLog } from "@/lib/audit";
import { getAppUser } from "@/lib/db/repositories";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/types";

function getUploadedImageFile(value: FormDataEntryValue | null): File | null {
  return typeof File !== "undefined" && value instanceof File && value.size > 0 ? value : null;
}

function canSupervisorUploadForRole(role: UserRole): boolean {
  return role === "client" || role === "technician";
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await requireRole(["client", "technician", "supervisor", "manager"]);

  try {
    const formData = await req.formData();
    const file = getUploadedImageFile(formData.get("image"));
    const requestedUid = formData.get("uid");
    const requestedUidValue = typeof requestedUid === "string" ? requestedUid.trim() : "";
    const uid = requestedUidValue.length > 0 ? requestedUidValue : session.uid;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Only privileged roles can upload images for other users.
    if (uid !== session.uid && session.role !== "manager" && session.role !== "supervisor") {
      return NextResponse.json({ error: "Unauthorized to upload image for other user" }, { status: 403 });
    }

    if (uid !== session.uid && session.role === "supervisor") {
      const targetUser = await getAppUser(uid);

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!canSupervisorUploadForRole(targetUser.role)) {
        return NextResponse.json({ error: "Unauthorized to upload image for this user role" }, { status: 403 });
      }
    }

    const imageUrl = await uploadProfileImageToCloudinary(file, uid);

    await writeAuditLog({
      actorUid: session.uid,
      actorRole: session.role,
      action: "profile_image.upload",
      entityType: "user",
      entityId: uid,
      metadata: {
        uploadedForSelf: uid === session.uid,
      },
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء رفع الصورة." }, { status: 500 });
  }
}
