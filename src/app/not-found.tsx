import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <h2>That page doesn&apos;t exist</h2>
      <p>The address may be mistyped, or the page was moved.</p>
      <Link href="/" className="btn btn-primary">
        Go to Home
      </Link>
    </div>
  );
}
