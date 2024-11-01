import React from 'react';
import booksBg from '../assets/books-bg.jpg';

const AuthBackground = () => {
  return (
    <div className="fixed inset-0 z-0">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ 
          backgroundImage: `url(${booksBg})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          filter: 'saturate(0.8) brightness(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-paper/70 via-cream/80 to-parchment/70 backdrop-blur-[1px]" />
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-float-1 absolute top-20 left-1/4 w-32 h-32 bg-leather/10 rounded-lg transform rotate-12" />
        <div className="animate-float-2 absolute top-1/3 right-1/4 w-40 h-40 bg-burgundy/10 rounded-lg transform -rotate-12" />
        <div className="animate-float-3 absolute bottom-20 left-1/3 w-36 h-36 bg-wood/10 rounded-lg transform rotate-45" />
      </div>
    </div>
  );
};

export default AuthBackground;