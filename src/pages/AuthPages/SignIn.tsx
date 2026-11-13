import SignInForm from "../../components/auth/SignInForm";
import PageMeta from "../../components/common/PageMeta";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Iniciar sesión | The Frozen Bar"
        description="Acceso al sistema de The Frozen Bar"
      />
      <SignInForm />
    </>
  );
}
