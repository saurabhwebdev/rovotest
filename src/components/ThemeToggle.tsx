'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setIsChanging(true);
    setTheme(theme === 'dark' ? 'light' : 'dark');
    
    // Add a small sound effect when toggling
    try {
      const audio = new Audio('/sounds/ding.mp3');
      audio.volume = 0.2;
      audio.play();
    } catch (e) {
      console.error('Could not play toggle sound', e);
    }
    
    // Reset animation state after transition completes
    setTimeout(() => {
      setIsChanging(false);
    }, 500);
  };

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 relative overflow-hidden tooltip-wrapper"
      aria-label="Toggle dark mode"
    >
      <div className={`relative z-10 transition-all duration-500 ${isChanging ? 'scale-110 rotate-180' : isHovering ? 'scale-125 rotate-12' : 'scale-100'}`}>
        {theme === 'dark' ? (
          // Sun icon for light mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-300 transition-all duration-500 ease-in-out"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Moon icon for dark mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-700 transition-all duration-500 ease-in-out"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </div>
      <span 
        className={`absolute inset-0 rounded-md transition-all duration-500 ${
          isChanging ? 'opacity-25 scale-100' : isHovering ? 'opacity-10 scale-110' : 'opacity-0 scale-90'
        } ${theme === 'dark' ? 'bg-yellow-200' : 'bg-blue-900'}`}
      />
      
      {/* Animated rays/stars for hover effect */}
      {theme === 'dark' ? (
        <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
          {[...Array(6)].map((_, i) => (
            <span 
              key={i}
              className={`absolute w-1 h-1 rounded-full bg-yellow-300 transition-all duration-500`}
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 60}deg) translateX(${isHovering ? 14 : 8}px)`,
                opacity: isHovering ? 1 : 0,
                transitionDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      ) : (
        <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
          {[...Array(5)].map((_, i) => (
            <span 
              key={i}
              className={`absolute w-1 h-1 rounded-full bg-blue-400 transition-all duration-500`}
              style={{
                top: `${35 + Math.random() * 30}%`,
                left: `${35 + Math.random() * 30}%`,
                transform: `scale(${isHovering ? 1.5 : 0.8})`,
                opacity: isHovering ? 0.8 : 0,
                transitionDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      )}
      
      <span className="tooltip">{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
    </button>
  );
}