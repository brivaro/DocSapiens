import React from 'react';
import UserAvatar from '../assets/docsapiens.png'; // Añade una imagen de avatar de placeholder

const Navbar: React.FC = () => {
  return (
    <header className="flex items-center justify-end h-16 bg-white border-b border-gray-200 px-6">
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-gray-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex items-center gap-3">
          <img className="w-9 h-9 rounded-full object-cover" src={UserAvatar} alt="User avatar" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Brian</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;