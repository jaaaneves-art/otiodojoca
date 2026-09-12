import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <ResetPasswordForm />
    </div>
  );
}
