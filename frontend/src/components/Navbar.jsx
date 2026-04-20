import React from 'react';
import logo from '../assets/puhindilogo.jpg';
import circularLogo from '../assets/logo.png';

export default function Navbar() {
  return (
    <header className="w-full bg-[#b22222] shadow-md">
      
      <nav className="w-full pl-[40px] md:pl-[120px] pr-1 md:pr-1 py-1 flex items-center justify-between">
        
        <a href="/" className="flex items-center no-underline outline-none">
          <img 
            src={logo} 
            alt="Poornima University Logo" 
            className="h-12 md:h-13 w-auto object-contain" 
          />
        </a>

        <div className="hidden sm:block text-white font-bold text-lg md:text-2xl tracking-wide font-serif">
          Previous Year Question Paper
        </div>
        
        <a 
          href="https://poornima.edu.in/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center transition-transform hover:scale-105 outline-none"
        >
          <img 
            src={circularLogo} 
            alt="PU Seal" 
            className="h-10 md:h-12 w-auto object-contain" 
          />
        </a>

      </nav>
    </header>
  );
}