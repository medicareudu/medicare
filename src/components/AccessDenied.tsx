import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const AccessDenied: React.FC<{ message?: string }> = ({
  message = 'You do not have permission to access this page.',
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
    <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
      <ShieldAlert size={22} />
    </div>
    <h3 className="text-sm font-bold text-slate-800">Access Restricted</h3>
    <p className="text-xs text-slate-500 max-w-md mx-auto">{message}</p>
  </div>
);
