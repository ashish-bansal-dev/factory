import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="max-w-md w-full flex flex-col items-center font-sans"
      data-testid="login-page"
    >
      <div className="text-center mb-6">
        <span className="text-[11px] font-semibold text-terracotta-600 uppercase tracking-wider block mb-1">
          Wholesale Portal
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
          Retailer Sign In
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2">
          Sign in to access your net wholesale pricing, manage GST invoices, and track shipments.
        </p>
      </div>

      <form className="w-full flex flex-col gap-y-3" action={formAction}>
        <Input
          label="Registered Business Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          required
          data-testid="email-input"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          data-testid="password-input"
        />

        <ErrorMessage error={message} data-testid="login-error-message" />

        <SubmitButton
          data-testid="sign-in-button"
          className="w-full mt-4 h-11 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-xs"
        >
          Sign In to Wholesale Portal &rarr;
        </SubmitButton>
      </form>

      <span className="text-center text-stone-600 text-xs mt-6">
        New wholesale retailer?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="font-semibold text-terracotta-600 underline underline-offset-2"
          data-testid="register-button"
        >
          Apply for Wholesale Buyer Account
        </button>
      </span>
    </div>
  )
}

export default Login
