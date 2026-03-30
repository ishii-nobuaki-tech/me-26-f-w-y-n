import React, { useState, useEffect } from 'react';
import EffectCalculator from './components/EffectCalculator';

const App: React.FC = () => {
  const checkAccess = () => {
    try {
      // 1. 通常のiframe判定
      const inIframe = window.self !== window.top;
      
      // 2. ローカル開発環境やAI Studioプレビュー環境での直接アクセスは許可する（開発用）
      const isDevOrPreview = window.location.hostname === 'localhost' || window.location.hostname.includes('.run.app');

      // 3. URLパラメータによる判定（SharePoint等でiframe判定が効かない場合の確実な方法）
      const urlParams = new URLSearchParams(window.location.search);
      const hasEmbedParam = urlParams.get('embed') === 'true';

      // 4. リファラー（リンク元）による判定
      const referrer = document.referrer.toLowerCase();
      const isFromSharePoint = referrer.includes('sharepoint.com');

      // いずれかの条件を満たせばアクセス許可
      return inIframe || isDevOrPreview || hasEmbedParam || isFromSharePoint;
    } catch (e) {
      // クロスオリジン制約でエラーが出た場合は確実にiframe内
      return true;
    }
  };

  const [isAllowed] = useState<boolean>(checkAccess());

  // デバッグ用に現在の状態を取得
  const debugInfo = {
    hostname: window.location.hostname,
    selfEqualsTop: window.self === window.top,
    selfEqualsParent: window.self === window.parent,
    referrer: document.referrer,
    search: window.location.search,
    userAgent: navigator.userAgent
  };

  // If not in an iframe, show a message instead of null to help debug
  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-4">アクセスが制限されています</h2>
          <p className="text-gray-600 mb-4">
            このツールは直接アクセスできません。<br />
            指定されたポータルサイト（SharePoint等）からご利用ください。
          </p>
          <div className="text-left text-xs text-gray-400 bg-gray-100 p-4 rounded-lg overflow-auto">
            <p className="font-bold mb-2">デバッグ情報（管理者用）:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
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