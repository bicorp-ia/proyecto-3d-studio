import React from 'react';
import { Box, Calendar, FileText, Layers, LogIn, LogOut, Moon, Shield, Sun, UploadCloud, User, UserCheck } from 'lucide-react';
import { B2BProfile } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'quote' | 'portal' | 'catalog';
  onTabChange: (tab: 'quote' | 'portal' | 'catalog') => void;
  b2bProfile: B2BProfile;
  isB2BMode: boolean;
  onToggleB2BMode: () => void;
  onOpenMeeting: () => void;
  onUploadClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  b2bProfile,
  isB2BMode,
  onToggleB2BMode,
  onOpenMeeting,
  onUploadClick,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const { currentUser, signInWithGoogle, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('quote');
            }}
            className="text-lg font-bold tracking-tight text-neutral-100 flex items-center gap-2 group"
          >
            <span className="w-7 h-7 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-sm group-hover:bg-amber-300 transition-colors shadow-sm">
              3D
            </span>
            <span>Proyect3d</span>
          </a>
        </div>

        {/* Zone 2: 4-5 Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-300">
          <button
            onClick={() => onTabChange('quote')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'quote'
                ? 'border-amber-400 text-neutral-100 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-100'
            }`}
          >
            Cotizador & Visor 3D
          </button>
          <button
            onClick={() => onTabChange('catalog')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'catalog'
                ? 'border-amber-400 text-neutral-100 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-100'
            }`}
          >
            Catálogo de Materiales
          </button>
          <button
            onClick={() => onTabChange('portal')}
            className={`transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'portal'
                ? 'border-amber-400 text-neutral-100 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-100'
            }`}
          >
            Portal B2B
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
              {b2bProfile.tier}
            </span>
          </button>
          <button
            onClick={onOpenMeeting}
            className="border-b-2 border-transparent text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            Ingeniería DFAM
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Action Points */}
        <div className="flex items-center gap-2.5">
          {/* Quick upload trigger */}
          <button
            onClick={onUploadClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 transition-colors whitespace-nowrap shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
            <span>Cargar CAD</span>
          </button>

          {/* Firebase Authentication Sign-In / Account Badge */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-1 pr-2">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Usuario'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">
                  {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                </div>
              )}
              <span className="text-xs text-neutral-200 font-medium max-w-[100px] truncate hidden sm:inline">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Acceso Google</span>
              <span className="sm:hidden">Acceso</span>
            </button>
          )}

          {/* Schedule Meeting CTA */}
          <button
            onClick={onOpenMeeting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors whitespace-nowrap shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cita Técnica</span>
          </button>
        </div>
      </div>
    </header>
  );
};
