import React, { useState, useEffect } from 'react';
import EffectCalculator from './components/EffectCalculator';

const App: React.FC = () => {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
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

    setIsAllowed(checkAccess());
  }, []);

  // Show nothing while checking
  if (isAllowed === null) {
    return null;
  }

  // If not in an iframe, show absolutely nothing to hide the app completely
  if (!isAllowed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EffectCalculator />
    </div>
  );
};

export default App;