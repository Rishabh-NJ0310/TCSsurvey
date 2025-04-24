import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
return (
    <nav className="bg-blue-600 text-white shadow-lg">
    <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
        Bank OCR Loan Processing
        </Link>
        <div>
        <Link to="/new" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100">
            New Application
        </Link>
        </div>
    </div>
    </nav>
);
};

export default Navbar;