import Link from "next/link";
import AuthPageShell from "@/app/auth/auth-page-shell";
import SignInForm from "./sign-in-form";
import { safeRedirectPath } from "@/lib/auth/safe-redirect-path";

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const searchParams = await props.searchParams;
  const redirectTo = safeRedirectPath(searchParams.redirect);
  const notice =
    searchParams.notice === "confirmation-failed"
      ? "That confirmation link did not work. Try signing in, or sign up again."
      : null;

  return (
    <AuthPageShell title="Sign in">
      {notice ? <p className="max-w-xs text-center text-sm text-warning">{notice}</p> : null}
      <SignInForm redirectTo={redirectTo} />
      <p className="text-sm text-ink-tertiary">
        New here?{" "}
        <Link href={`/sign-up?redirect=${encodeURIComponent(redirectTo)}`} className="text-ink-primary underline">
          Create an account
        </Link>
      </p>
    </AuthPageShell>
  );
}
