"use client";

import { useRouter } from "next/navigation";
import { logout } from "./actions";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await logout();
        router.push("/login");
      }}
      className="min-h-10 px-2 font-semibold text-stamp underline underline-offset-4"
    >
      Log out
    </button>
  );
}
