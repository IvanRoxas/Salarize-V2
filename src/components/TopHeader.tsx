import SearchBar from "./SearchBar";
import AdminProfile from "./AdminProfile";
import { getSession } from "@/app/actions/auth";

export default async function TopHeader() {
  const session = await getSession();
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex-1 max-w-lg">
        <SearchBar />
      </div>
      <div className="flex items-center space-x-4">
        <AdminProfile username={session?.username as string} role={session?.role as string} />
      </div>
    </header>
  );
}
