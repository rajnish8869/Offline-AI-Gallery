
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 bg-dark text-slate-100 overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Content Layer */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
};
