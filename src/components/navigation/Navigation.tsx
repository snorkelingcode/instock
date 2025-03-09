
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  return (
    <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col">
      <div className="flex justify-between items-center w-full">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/9955d37d-dda9-41f4-99af-f7307dddce93.png" 
            alt="TCG In-Stock Tracker Logo" 
            className="h-10 w-auto"
          />
        </Link>
        
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600">Home</Link>
          <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-blue-600">About</Link>
          <Link to="/sets" className="text-sm font-medium text-gray-600 hover:text-blue-600">Sets</Link>
          <Link to="/products" className="text-sm font-medium text-gray-600 hover:text-blue-600">Products</Link>
          <Link to="/news" className="text-sm font-medium text-gray-600 hover:text-blue-600">News</Link>
          <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-blue-600">Contact</Link>
        </div>
        
        <Button 
          className="md:hidden" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          Menu
        </Button>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden w-full mt-4 flex flex-col space-y-3 pt-3 border-t border-gray-200">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Home</Link>
          <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2">About</Link>
          <Link to="/sets" className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Sets</Link>
          <Link to="/products" className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Products</Link>
          <Link to="/news" className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2">News</Link>
          <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Contact</Link>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
