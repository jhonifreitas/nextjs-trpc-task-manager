import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="mt-2 text-gray-600">This task or page doesn&apos;t exist. It may have been deleted.</p>
      <Link href="/" className="mt-4 inline-block font-medium text-blue-600 hover:underline">
        Back to tasks
      </Link>
    </div>
  );
}
