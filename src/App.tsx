import React, { useState, useEffect } from 'react';
import EffectCalculator from './components/EffectCalculator';

const App: React.FC = () => {
  const checkAccess = () => {
    try {
      // 1. iframe内かどうかの判定
      const inIframe = window.self !== window.top || window !== window.parent;
      
      // 2. ローカル開発環境やAI Studioプレビュー環境での直接アクセスは許可する（開発用）
      const isDevOrPreview = window.location.hostname === 'localhost' || window.location.hostname.includes('.run.app');

      // iframe内（SharePoint等）で開かれている、または開発環境であれば許可
      return inIframe || isDevOrPreview;
    } catch (e) {
      // クロスオリジン制約でエラーが出た場合は確実にiframe内
      return true;
    }
  };

  const [isAllowed] = useState<boolean>(checkAccess());

  // If not in an iframe, show a message instead of null to help debug
  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-4">アクセスが制限されています</h2>
          <p className="text-gray-600">
            このツールは直接アクセスできません。<br />
            指定されたポータルサイト（SharePoint等）からご利用ください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EffectCalculator />
    </div>
  );
};

export default App;