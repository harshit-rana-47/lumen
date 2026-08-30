import { redirect } from "next/navigation";

/** Legacy path — V1 account surface is /you */
export default function SettingsRedirectPage() {
  redirect("/you");
}
