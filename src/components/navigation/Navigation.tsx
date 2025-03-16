
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
    <nav className="bg-gray-900 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo and Title */}
        <Link to="/" className="text-xl font-bold">
          TCG In-Stock Tracker
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-white focus:outline-none"
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
          <Link to="/" className="hover:text-blue-400 transition-colors">
            Home
          </Link>
          <Link
            to="/products"
            className="hover:text-blue-400 transition-colors"
          >
            Products
          </Link>
          <Link to="/news" className="hover:text-blue-400 transition-colors">
            News
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:text-blue-400 transition-colors">
                Sets
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem>
                <Link to="/sets/pokemon" className="w-full">
                  Pokemon
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/sets/mtg" className="w-full">
                  Magic: The Gathering
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/sets/yugioh" className="w-full">
                  Yu-Gi-Oh!
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/sets/lorcana" className="w-full">
                  Disney Lorcana
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem>
                  <Link to="/sets/sync" className="w-full">
                    Sync Sets
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            to="/about"
            className="hover:text-blue-400 transition-colors"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="hover:text-blue-400 transition-colors"
          >
            Contact
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-4">
                  My Account
                </Button>
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
            <Button asChild variant="outline" size="sm" className="ml-4">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-gray-900 p-4 flex flex-col space-y-4 z-50">
            <Link
              to="/"
              className="hover:text-blue-400 transition-colors"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="hover:text-blue-400 transition-colors"
              onClick={toggleMenu}
            >
              Products
            </Link>
            <Link
              to="/news"
              className="hover:text-blue-400 transition-colors"
              onClick={toggleMenu}
            >
              News
            </Link>
            <Link
              to="/sets"
              className="hover:text-blue-400 transition-colors"
              onClick={toggleMenu}
            >
              Sets
            </Link>
            <Link
              to="/about"
              className="hover:text-blue-400 transition-colors"
              onClick={toggleMenu}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="hover:text-blue-400 transition-colors"
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
                      className="hover:text-blue-400 transition-colors"
                      onClick={toggleMenu}
                    >
                      Manage Articles
                    </Link>
                    <Link
                      to="/sets/sync"
                      className="hover:text-blue-400 transition-colors"
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
                  className="text-left hover:text-blue-400 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="hover:text-blue-400 transition-colors"
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
