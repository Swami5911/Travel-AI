import React from 'react';
import { User } from '../types';
import { CompassIcon, UserIcon, BackIcon } from '../constants';

interface HeaderProps {
  user: User | null;
  onBack: () => void;
  showBackButton: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onBack, showBackButton }) => {
  return (
    <header className="glass-card sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <button 
              onClick={onBack} 
              className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
              aria-label="Go back"
            >
              <BackIcon className="h-6 w-6 text-slate-300" />
            </button>
          )}
          <CompassIcon className="h-8 w-8 gradient-text" />
          <h1 className="text-2xl font-poppins font-bold text-slate-100 tracking-tight">
            AI Travel Planner
          </h1>
        </div>
        {user && (
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-2 rounded-full">
            <UserIcon className="h-5 w-5 text-slate-400"/>
            <span className="font-medium text-slate-300">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;