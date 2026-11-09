import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-indigo-400 mb-2">
          BalanceVault
        </h1>
        <p className="text-slate-400 text-lg max-w-xl">
          Money movement with a ledger you can prove. Secure account onboarding, role-based access control, and tamper-resistant audit logging.
        </p>
      </div>
    </BrowserRouter>
  );
}
