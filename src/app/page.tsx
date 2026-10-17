import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-sm p-6 space-y-4 text-center">
      <h1 className="text-3xl font-bold">Kredo</h1>
      <p className="text-gray-600">Your work, your proof.</p>
      <Link
        href="/login"
        className="block bg-green-600 hover:bg-green-700 text-white font-medium rounded p-2"
      >
        Get started
      </Link>
    </main>
  );
}
