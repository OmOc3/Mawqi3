"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateUserProfileAction, type UserActionResult } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { updateUserProfileSchema, type UpdateUserProfileValues } from "@/lib/validation/users";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

export function UserProfileForm({
  disabled,
  embedded = false,
  user,
}: {
  disabled?: boolean;
  embedded?: boolean;
  user: Pick<AppUser, "uid" | "displayName" | "image">;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<UserActionResult | null>(null);

  const form = useForm<UpdateUserProfileValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      displayName: user.displayName,
    },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } else {
      setImagePreview(null);
    }
  }

  async function onSubmit(values: UpdateUserProfileValues) {
    setResult(null);

    try {
      let imageUrl = user.image || undefined;
      
      if (imageFile) {
        const fileForm = new FormData();
        fileForm.set("image", imageFile);
        fileForm.set("uid", user.uid);
        
        const res = await fetch("/api/upload-profile-image", { method: "POST", body: fileForm });
        if (!res.ok) {
          throw new Error("فشل رفع الصورة. يرجى المحاولة مرة أخرى.");
        }
        const { url } = await res.json();
        imageUrl = url;
      }

      const formData = new FormData();
      formData.set("displayName", values.displayName);
      if (imageUrl) {
        formData.set("image", imageUrl);
      }

      const actionResult = await updateUserProfileAction(user.uid, formData);
      setResult(actionResult);

      if (actionResult.success) {
        setImageFile(null);
        // We keep imagePreview as it represents the current uploaded state
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
      setResult({ error: errorMessage });
    }
  }

  const isSubmitting = form.formState.isSubmitting;
  const isFormDisabled = disabled || isSubmitting;

  return (
    <form
      className={cn(
        "space-y-4",
        embedded ? null : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card",
      )}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <h3 className="section-heading text-base">تحديث الملف الشخصي</h3>
      
      {result?.success && (
        <div className="rounded-lg border px-3 py-2 text-sm border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300">
          تم تحديث الملف الشخصي بنجاح.
        </div>
      )}
      
      {result?.error && (
        <div className="rounded-lg border px-3 py-2 text-sm border-[var(--danger-muted)] bg-[var(--danger-soft)] text-[var(--danger)]">
          {result.error}
        </div>
      )}

      <TextField
        error={form.formState.errors.displayName?.message ?? result?.fieldErrors?.displayName?.[0]}
        id={`name-${user.uid}`}
        label="الاسم"
        disabled={isFormDisabled}
        {...form.register("displayName")}
      />
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[var(--foreground)]" htmlFor={`image-${user.uid}`}>
          تحديث الصورة
        </label>
        
        <div className="flex items-center gap-4">
          {(imagePreview || user.image) && (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-subtle)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imagePreview || user.image || ""} 
                alt="Profile Preview" 
                className="h-full w-full object-cover" 
              />
            </div>
          )}
          
          <input
            accept="image/*"
            className="block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-900/30 dark:file:text-teal-300"
            id={`image-${user.uid}`}
            onChange={handleImageChange}
            type="file"
            disabled={isFormDisabled}
          />
        </div>
      </div>

      <Button disabled={isFormDisabled} isLoading={isSubmitting} type="submit" variant="secondary" className="w-full">
        حفظ التعديلات
      </Button>
    </form>
  );
}
