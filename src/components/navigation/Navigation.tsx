
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { X, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();

  return (
    <nav className="bg-red-600 text-white py-4 relative">
      <div className="container mx-auto px-4 flex justify-between items-center relative z-50">
        {/* Logo only */}
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/3a088818-3512-46b0-898d-16a118d744fa.png" 
            alt="TCG Updates" 
            className="h-16 -my-2" // Keeping the same size adjustments
          />
        </Link>

        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white hover:bg-red-700">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full p-0 bg-white">
            <div className="flex flex-col h-full">
              {/* Logo centered at the top - keeping this full logo with image for the mobile menu */}
              <div className="flex justify-center py-6 border-b border-gray-200">
                <img 
                  src="/lovable-uploads/3a088818-3512-46b0-898d-16a118d744fa.png" 
                  alt="TCG Updates" 
                  className="h-24" // Keeping the same size for mobile menu logo
                />
              </div>
              
              {/* Close button - positioned absolute top right */}
              <SheetClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none">
                <X className="h-6 w-6" color="#ea384c" />
                <span className="sr-only">Close</span>
              </SheetClose>
              
              {/* Navigation Links */}
              <div className="flex flex-col py-4 overflow-y-auto">
                <SheetClose asChild>
                  <Link
                    to="/"
                    className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                  >
                    Home
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/products"
                    className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                  >
                    Products
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/news"
                    className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                  >
                    News
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/sets"
                    className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                  >
                    Sets
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/about"
                    className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                  >
                    About
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/contact"
                    className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                  >
                    Contact
                  </Link>
                </SheetClose>
                
                <SheetClose asChild>
                  <Link
                    to="/forge"
                    className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                  >
                    Forge
                  </Link>
                </SheetClose>
                
                {user ? (
                  <>
                    {isAdmin && (
                      <>
                        <div className="py-2 px-6 text-gray-500 text-sm bg-gray-50 font-medium">
                          Admin Tools
                        </div>
                        <SheetClose asChild>
                          <Link
                            to="/admin/articles"
                            className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                          >
                            Manage Articles
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to="/admin/pokemon-releases"
                            className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                          >
                            Manage Pokémon Releases
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to="/admin/models"
                            className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                          >
                            Manage 3D Models
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to="/sets/sync"
                            className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                          >
                            Sync TCG Sets
                          </Link>
                        </SheetClose>
                      </>
                    )}
                    <SheetClose asChild>
                      <button
                        onClick={signOut}
                        className="py-3 px-6 text-red-600 font-medium text-left hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </SheetClose>
                  </>
                ) : (
                  <SheetClose asChild>
                    <Link
                      to="/auth"
                      className="py-3 px-6 text-red-600 font-medium border-b border-gray-200 hover:bg-red-50 transition-colors text-left"
                    >
                      Sign In
                    </Link>
                  </SheetClose>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

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
          
          <Link
            to="/forge"
            className="hover:text-red-200 transition-colors"
          >
            Forge
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
                      <Link to="/admin/models" className="w-full">
                        Manage 3D Models
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
      </div>
    </nav>
  );
};

export default Navigation;
