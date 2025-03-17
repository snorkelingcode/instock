
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-red-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo and Title */}
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/9955d37d-dda9-41f4-99af-f7307dddce93.png" 
            alt="TCG In-Stock Tracker" 
            className="h-10 mr-3"
          />
          <span className="text-xl font-bold">TCG In-Stock Tracker</span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-white focus:outline-none z-50"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="hover:text-red-200 transition-colors">
            Home
          </Link>
          <Link
            to="/products"
            className="hover:text-red-200 transition-colors"
          >
            Products
          </Link>
          <Link to="/news" className="hover:text-red-200 transition-colors">
            News
          </Link>
          <Link to="/sets" className="hover:text-red-200 transition-colors">
            Sets
          </Link>
          <Link
            to="/about"
            className="hover:text-red-200 transition-colors"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="hover:text-red-200 transition-colors"
          >
            Contact
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:text-red-200 transition-colors bg-transparent text-white">
                  My Account
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {isAdmin && (
                  <>
                    <DropdownMenuItem>
                      <Link to="/admin/articles" className="w-full">
                        Manage Articles
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/admin/pokemon-releases" className="w-full">
                        Manage Pokémon Releases
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/sets/sync" className="w-full">
                        Sync TCG Sets
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem>
                  <button onClick={signOut} className="w-full text-left">
                    Sign Out
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link 
              to="/auth" 
              className="hover:text-red-200 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden fixed top-16 left-0 right-0 bg-red-600 p-4 flex flex-col space-y-4 z-40">
            <Link
              to="/"
              className="hover:text-red-200 transition-colors"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="hover:text-red-200 transition-colors"
              onClick={toggleMenu}
            >
              Products
            </Link>
            <Link
              to="/news"
              className="hover:text-red-200 transition-colors"
              onClick={toggleMenu}
            >
              News
            </Link>
            <Link
              to="/sets"
              className="hover:text-red-200 transition-colors"
              onClick={toggleMenu}
            >
              Sets
            </Link>
            <Link
              to="/about"
              className="hover:text-red-200 transition-colors"
              onClick={toggleMenu}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="hover:text-red-200 transition-colors"
              onClick={toggleMenu}
            >
              Contact
            </Link>
            
            {user ? (
              <>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/articles"
                      className="hover:text-red-200 transition-colors"
                      onClick={toggleMenu}
                    >
                      Manage Articles
                    </Link>
                    <Link
                      to="/admin/pokemon-releases"
                      className="hover:text-red-200 transition-colors"
                      onClick={toggleMenu}
                    >
                      Manage Pokémon Releases
                    </Link>
                    <Link
                      to="/sets/sync"
                      className="hover:text-red-200 transition-colors"
                      onClick={toggleMenu}
                    >
                      Sync TCG Sets
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    signOut();
                    toggleMenu();
                  }}
                  className="text-left hover:text-red-200 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="hover:text-red-200 transition-colors"
                onClick={toggleMenu}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
