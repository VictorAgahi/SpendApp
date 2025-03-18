"use client"
import {usePathname, useRouter} from "next/navigation";
import Link from "next/link";
import { Home, Wallet, FileText, User, Banknote } from "lucide-react";
import {Button} from "@/components/ui/button";

const navItems = [
    { name: "Budgets", href: "/dashboard/budget", icon: Wallet },
    { name: "Dépenses", href: "/dashboard/depenses", icon: FileText },
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Salaires", href: "/dashboard/salaires", icon: Banknote },
    { name: "Profil", href: "/dashboard/me", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-r from-gray-900 to-gray-700 p-6 sm:p-8 md:p-12 transition-all ">
            <header className="w-full bg-gray-800 text-white p-4 fixed top-0 left-0 flex justify-between items-center shadow-md z-10 h-16 px-6">
                <h1 className="text-xl font-semibold flex-1 text-center">Spending App</h1>
                <Button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all ease-in-out duration-300 transform hover:scale-105">
                    LOGOUT
                </Button>
            </header>

            <main className="flex-1 w-full pt-12 pb-12 overflow-y-auto flex justify-center">
                <div className="w-full max-w-2xl mx-auto px-1  ">
                    {children}
                </div>
            </main>
            <nav className="fixed bottom-0 left-0 w-full bg-gray-800 shadow-md p-4 flex justify-around h-16 z-10">
                {navItems.map(({ name, href, icon: Icon }) => (
                    <Link key={href} href={href} className="flex flex-col items-center w-full">
                        <Icon className={`h-6 w-6 ${pathname === href ? "text-blue-500" : "text-white"}`} />
                        <span className="text-xs text-white">{name}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}