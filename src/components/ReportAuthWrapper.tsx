import React, { useState } from 'react';
import AuthView from '../views/AuthView';

export default function ReportAuthWrapper({ children }: { children: React.ReactNode }) {
  // We force re-authentication for reports to ensure that if the POS is left open,
  // unauthorized employees cannot view sensitive 6-monthly/bi-yearly financial reports.
  const [isVerified, setIsVerified] = useState(false);

  if (!isVerified) {
    return (
      <div className="relative h-screen w-full">
        <AuthView onLogin={() => setIsVerified(true)} />
        {/* We add an overlay banner to make it clear this is a security checkpoint */}
        <div className="fixed top-6 left-0 w-full text-center z-[9999] pointer-events-none print:hidden">
          <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
            Security Checkpoint: Re-authentication Required
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
