import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function NotFound() {
  return <><Header locale="en" /><main className="empty-state"><span>🧭</span><h1>Place not found</h1><p>This merchant page does not exist.</p><Link className="primary-button" href="/en">Back to places</Link></main><Footer /></>;
}
