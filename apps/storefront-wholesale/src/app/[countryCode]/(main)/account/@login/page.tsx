import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Wholesale Sign In | FactoryTribe",
  description: "Sign in to your FactoryTribe Wholesale Buyer account.",
}

export default function Login() {
  return <LoginTemplate />
}
