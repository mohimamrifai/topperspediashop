import { LoginForm } from "./_components/login-form";
import { Starfield } from "./_components/starfield";

export default function AdminLoginPage() {
  return (
    <>
      <Starfield />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <LoginForm />
      </main>
    </>
  );
}
