"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div
      className="max-w-md w-full flex flex-col items-center font-sans"
      data-testid="register-page"
    >
      <div className="text-center mb-6">
        <span className="text-[11px] font-semibold text-terracotta-600 uppercase tracking-wider block mb-1">
          B2B Wholesale Access
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
          Apply for Wholesale Buyer Account
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-sm mx-auto">
          Unlock direct factory pricing, GST input tax invoices, and Net 60 financing across verified Indian fashion mills.
        </p>
      </div>

      {/* Trust Highlights */}
      <div className="w-full grid grid-cols-2 gap-2 p-3 bg-sand-50 rounded-xl border border-stone-200 text-[11px] text-stone-700 mb-6">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-700 inline-block" />
          <span>GST Input Tax Credit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600 inline-block" />
          <span>Net 60 Financing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-charcoal-900 inline-block" />
          <span>Direct Mill Pack Pricing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
          <span>Pan-India Logistics</span>
        </div>
      </div>

      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="First name"
              name="first_name"
              required
              autoComplete="given-name"
              data-testid="first-name-input"
            />
            <Input
              label="Last name"
              name="last_name"
              required
              autoComplete="family-name"
              data-testid="last-name-input"
            />
          </div>

          <Input
            label="Business / Store Name"
            name="company_name"
            autoComplete="organization"
            placeholder="e.g. Amber Boutique or Fab Retail Ltd."
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="GSTIN (Optional)"
              name="tax_id"
              placeholder="22AAAAA0000A1Z5"
            />
            <Input
              label="City / Pincode"
              name="city"
              placeholder="e.g. Mumbai, 400001"
            />
          </div>

          <Input
            label="Business Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />

          <Input
            label="Phone / WhatsApp (+91)"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
            placeholder="e.g. 98765 43210"
          />

          <Input
            label="Create Password"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>

        <ErrorMessage error={message} data-testid="register-error" />

        <span className="text-center text-stone-500 text-xs mt-5">
          By applying, you agree to FactoryTribe Wholesale&apos;s{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline hover:text-charcoal-900"
          >
            Buyer Terms
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline hover:text-charcoal-900"
          >
            Privacy Policy
          </LocalizedClientLink>
          .
        </span>

        <SubmitButton
          className="w-full mt-5 h-11 rounded-full bg-charcoal-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-xs"
          data-testid="register-button"
        >
          Submit Wholesale Application &rarr;
        </SubmitButton>
      </form>

      <span className="text-center text-stone-600 text-xs mt-6">
        Already registered?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="font-semibold text-terracotta-600 underline underline-offset-2"
        >
          Sign in to your wholesale account
        </button>
      </span>
    </div>
  )
}

export default Register
