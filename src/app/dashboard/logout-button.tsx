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
      className="text-sm border rounded px-3 py-1 hover:bg-white/10"
    >
      Log out
    </button>
  );
}
