import Link from "next/link";

const Header = () => {
    return (
        <header>
            <nav className="md:flex space-x-8 text-sm font-medium mt-8 mb-8">
                <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Список комнат</Link>
                <Link href="/bookings" className="text-gray-600 hover:text-blue-600 transition-colors">Список броней</Link>
            </nav>
        </header>
    );
}

export default Header;
