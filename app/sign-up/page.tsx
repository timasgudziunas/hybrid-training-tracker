import Link from "next/link";
import AuthPageShell from "@/app/auth/auth-page-shell";
import SignUpForm from "./sign-up-form";
import { safeRedirectPath } from "@/lib/auth/safe-redirect-path";

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const searchParams = await props.searchParams;
  const redirectTo = safeRedirectPath(searchParams.redirect);
  const inviteRequired = Boolean(process.env.APP_PASSPHRASE);

  return (
    <AuthPageShell title="Create your account">
      <SignUpForm redirectTo={redirectTo} inviteRequired={inviteRequired} />
      <p className="text-sm text-ink-tertiary">
        Already have one?{" "}
        <Link href={`/sign-in?redirect=${encodeURIComponent(redirectTo)}`} className="text-ink-primary underline">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
