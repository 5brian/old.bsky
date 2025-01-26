import { Feed } from "@/components/feed";
import { Sidebar } from "@/components/sidebar";

export default function Home() {
  return (
    <main className="container mx-auto grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
      <div className="md:col-span-3">
        <Feed />
      </div>
      <div className="md:col-span-1">
        <Sidebar />
      </div>
    </main>
  );
}
