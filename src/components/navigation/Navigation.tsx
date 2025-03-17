
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
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-red-600 text-white py-4 relative">
      <div className="container mx-auto px-4 flex justify-between items-center relative z-50">
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

        {/* Mobile Menu - Improved styling */}
        {isOpen && (
          <div className="md:hidden fixed top-[72px] left-0 right-0 bottom-0 bg-white z-40 overflow-y-auto">
            <div className="flex flex-col py-4">
              <Link
                to="/"
                className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                onClick={toggleMenu}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                onClick={toggleMenu}
              >
                Products
              </Link>
              <Link
                to="/news"
                className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                onClick={toggleMenu}
              >
                News
              </Link>
              <Link
                to="/sets"
                className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                onClick={toggleMenu}
              >
                Sets
              </Link>
              <Link
                to="/about"
                className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                onClick={toggleMenu}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                onClick={toggleMenu}
              >
                Contact
              </Link>
              
              {user ? (
                <>
                  {isAdmin && (
                    <>
                      <div className="py-2 px-6 text-gray-500 text-sm bg-gray-50 font-medium">
                        Admin Tools
                      </div>
                      <Link
                        to="/admin/articles"
                        className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                        onClick={toggleMenu}
                      >
                        Manage Articles
                      </Link>
                      <Link
                        to="/admin/pokemon-releases"
                        className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                        onClick={toggleMenu}
                      >
                        Manage Pokémon Releases
                      </Link>
                      <Link
                        to="/sets/sync"
                        className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
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
                    className="py-3 px-6 text-red-600 font-medium text-left hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors"
                  onClick={toggleMenu}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
