import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChecklistIcon } from './icons';

interface BottomNavigationProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onAdd?: () => void;
  disabled?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
  onAdd,
  disabled = false
}) => {
  return (
    <div
      className="safe-area-bottom bg-white border-t border-gray-200 flex flex-col justify-end"
      style={{ backgroundColor: 'var(--exora-primary)', minHeight: '80px' }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!canGoBack || disabled}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full
            transition-all duration-200
            ${canGoBack && !disabled
              ? 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
            }
          `}
        >
          <ChevronLeftIcon size={24} />
        </button>

        {/* Add Button (FAB) */}
        <button
          onClick={onAdd}
          disabled={disabled}
          className={`
            flex items-center justify-center w-14 h-14 rounded-full
            shadow-lg transition-all duration-200
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-105 active:scale-95'
            }
          `}
          style={{ backgroundColor: 'var(--exora-light-yellow)' }}
        >
          <ChecklistIcon size={26} style={{ color: '#555BF6' }} />
        </button>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!canGoForward || disabled}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full
            transition-all duration-200
            ${canGoForward && !disabled
              ? 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
            }
          `}
        >
          <ChevronRightIcon size={24} />
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
