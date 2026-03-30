import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Users, Calendar, RefreshCw, ChevronDown, ChevronUp, HelpCircle, BarChart2, PieChart, AlertCircle, Activity, Copy, Check } from 'lucide-react';
import jstat from 'jstat';

// --- Types ---

interface DetailItem {
  label: string | null;
  formula: string;
  calculation: string;
  result: string;
  unit: string;
}

interface ResultsState {
  primaryMetric: number | string;
  primaryLabel: string;
  sacOrArpu: number;
  sacLabel: string | null;
  profit: number | string;
  roi: number | string;
  isProfit: boolean;
  details: DetailItem[];
  isValid: boolean;
  error?: string;
}

interface CategoryDef {
  id: string;
  name: string;
  number: string;
}

type CharacterVariant = 'normal' | 'fun' | 'sad';

// --- Constants ---

const CATEGORIES: Record<string, CategoryDef> = {
  ACQUISITION: { id: 'acquisition', name: '① 獲得', number: '①' },
  RETURN: { id: 'return', name: '② 呼び戻す', number: '②' },
  CHURN: { id: 'churn', name: '③ 解約抑止・継続促進', number: '③' },
  UPSELL: { id: 'upsell', name: '④ アップセル', number: '④' },
  CROSSSELL: { id: 'crosssell', name: '④ クロスセル', number: '④' },
};

const LTV_ACQUISITION = {
  OVERALL: 14832,
  PRO_BASEBALL: 17716,
  F1: 14539,
  HALLYU: 10843,
  BASIC: 32081,
  OTHERS: 10293
};

const LTV_RETURN = {
  OVERALL: 5879,
  PRO_BASEBALL: 8273,
  F1: 5855,
  HALLYU: 3876,
  BASIC: 24336,
  OTHERS: 4599
};

const UPSELL_DURATIONS = {
  PRO_BASEBALL: 6.3,
  F1: 6.3,
  HALLYU: 6.2,
  BASIC: 16.1,
  OTHERS: 5.6
};

const CROSSSELL_DURATIONS = {
  PRO_BASEBALL: 10.0,
  F1: 11.3,
  HALLYU: 8.9,
  BASIC: 29.7,
  OTHERS: 11.4
};

const UPSELL_DURATION_OVERALL = 7.1;
const CROSSSELL_DURATION_OVERALL = 12.8;

function calculateChiSquare(tCount: number, tChurn: number, cCount: number, cChurn: number) {
  if (tCount <= 0 || cCount <= 0 || tChurn <= 0 || cChurn <= 0) {
    return { pValue: 1, isSignificant: false, chiSqResult: "" };
  }
  const tChurnCount = Math.round(tCount * (tChurn / 100));
  const tRetainCount = tCount - tChurnCount;
  const cChurnCount = Math.round(cCount * (cChurn / 100));
  const cRetainCount = cCount - cChurnCount;

  const observed = [
    [tChurnCount, tRetainCount],
    [cChurnCount, cRetainCount]
  ];

  const rowTotals = [tCount, cCount];
  const colTotals = [tChurnCount + cChurnCount, tRetainCount + cRetainCount];
  const total = tCount + cCount;

  let chiSq = 0;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / total;
      if (expected > 0) {
        chiSq += Math.pow(observed[i][j] - expected, 2) / expected;
      }
    }
  }

  const pValue = 1 - jstat.chisquare.cdf(chiSq, 1);
  const isSignificant = pValue < 0.05;
  const chiSqResult = `p値: ${pValue.toFixed(4)} (${isSignificant ? '有意差あり' : '有意差なし'})`;

  return { pValue, isSignificant, chiSqResult };
}

// --- Sub Components ---

const SukappyIcon: React.FC<{ className?: string; variant?: CharacterVariant }> = ({ className = "", variant = 'normal' }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sukappyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#FFA500" />
      </linearGradient>
    </defs>
    <path d="M100 50 L100 20" stroke="#FFA500" strokeWidth="8" strokeLinecap="round" />
    <circle cx="100" cy="20" r="8" fill="#FFA500" />
    <ellipse cx="100" cy="120" rx="60" ry="50" fill="url(#sukappyGrad)" />
    <g fill="white">
      <ellipse cx="80" cy="110" rx="15" ry="18" />
      <ellipse cx="120" cy="110" rx="15" ry="18" />
    </g>
    <g fill="black">
      <circle cx="80" cy="110" r="5" />
      <circle cx="120" cy="110" r="5" />
    </g>
    {variant === 'fun' ? (
      <path d="M90 135 Q100 145 110 135" stroke="#d97706" strokeWidth="3" fill="none" />
    ) : variant === 'sad' ? (
      <>
        <path d="M90 140 Q100 130 110 140" stroke="#d97706" strokeWidth="3" fill="none" />
        <path d="M70 115 Q65 125 70 135" stroke="#3eb6e6" strokeWidth="2" fill="#a5f3fc" />
        <path d="M130 115 Q135 125 130 135" stroke="#3eb6e6" strokeWidth="2" fill="#a5f3fc" />
      </>
    ) : (
      <path d="M90 135 Q100 140 110 135" stroke="#d97706" strokeWidth="3" fill="none" />
    )}
    {variant === 'fun' ? (
      <>
        <path d="M45 120 Q30 110 40 90" stroke="#FFA500" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M155 120 Q170 110 160 90" stroke="#FFA500" strokeWidth="8" strokeLinecap="round" fill="none" />
      </>
    ) : variant === 'sad' ? (
      <>
        <path d="M45 110 Q30 130 40 140" stroke="#FFA500" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M155 110 Q170 130 160 140" stroke="#FFA500" strokeWidth="8" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <path d="M45 120 Q30 110 40 90" stroke="#FFA500" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M155 115 Q165 125 160 135" stroke="#FFA500" strokeWidth="8" strokeLinecap="round" fill="none" />
      </>
    )}
  </svg>
);

const SukappyImage: React.FC<{ variant: CharacterVariant }> = ({ variant }) => {
  const [imgError, setImgError] = useState(false);
  const happyImage = import.meta.env.BASE_URL + "skappy_fun.png";
  const sadImage = import.meta.env.BASE_URL + "skappy_sad.png";
  const normalImage = import.meta.env.BASE_URL + "skappy_normal.png";

  useEffect(() => { setImgError(false); }, [variant]);

  let currentImage = normalImage;
  let altText = "スカッピー";

  switch (variant) {
    case 'fun': currentImage = happyImage; altText = "大喜びのスカッピー"; break;
    case 'sad': currentImage = sadImage; altText = "悲しむスカッピー"; break;
    case 'normal': default: currentImage = normalImage; altText = "通常のスカッピー"; break;
  }

  if (imgError) {
    return (
      <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
        <SukappyIcon className="w-full h-full animate-bounce-slow drop-shadow-xl" variant={variant} />
      </div>
    );
  }

  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40 transition-transform duration-500 hover:scale-110">
      <img
        src={currentImage}
        alt={altText}
        onError={() => setImgError(true)}
        className="w-full h-full object-contain drop-shadow-xl animate-bounce-slow"
      />
    </div>
  );
};

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  icon?: React.ElementType;
  suffix?: string;
  placeholder?: string;
  step?: string;
  error?: boolean;
  compact?: boolean;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, icon: Icon, suffix, placeholder, step, error, compact = false, className = "" }) => {
  const getDisplayValue = (val: string | number) => {
    if (val === '' || val === null || val === undefined) return '';
    const strVal = val.toString();
    
    // Split into integer and decimal parts to preserve trailing zeros and dots during typing
    if (strVal.includes('.')) {
      const parts = strVal.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];
      const formattedInteger = integerPart === '' ? '' : 
        (isNaN(Number(integerPart)) ? integerPart : new Intl.NumberFormat('ja-JP').format(Number(integerPart)));
      return `${formattedInteger}.${decimalPart}`;
    }
    
    const num = parseFloat(strVal);
    if (isNaN(num)) return strVal;
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove commas from the input value to get the raw string
    let rawValue = e.target.value.replace(/,/g, '');
    
    // Allow empty string, or a string that contains only digits and at most one decimal point
    if (rawValue === '' || /^-?\d*\.?\d*$/.test(rawValue)) {
      // If the user typed '0' at the beginning and then another digit (e.g., '05'), strip the leading zero
      if (rawValue.length > 1 && rawValue.startsWith('0') && !rawValue.startsWith('0.')) {
        rawValue = rawValue.replace(/^0+/, '');
      }
      onChange(rawValue);
    }
  };

  const marginClass = className.includes('mb-') ? '' : (compact ? 'mb-0' : 'mb-5');

  return (
    <div className={`${marginClass} ${className} group`}>
      <label className={`block ${compact ? 'text-xs' : 'text-xs uppercase tracking-wider'} font-bold text-gray-500 ${compact ? 'mb-1.5' : 'mb-2'} flex items-center gap-1.5 transition-colors group-focus-within:text-[#29a1c0]`}>
        {Icon && <Icon size={compact ? 14 : 16} className={error ? "text-red-500" : "text-gray-400 group-focus-within:text-[#29a1c0] transition-colors"} />}
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={getDisplayValue(value)}
          onChange={handleChange}
          className={`w-full ${compact ? 'p-2 pl-3 text-sm' : 'p-3.5 pl-4 pr-12 text-lg'} border-0 rounded-2xl transition-all font-semibold shadow-sm placeholder-gray-300
            ${error 
              ? "bg-red-50 text-red-700 ring-2 ring-red-100 focus:ring-red-300" 
              : "bg-gray-50 text-gray-800 hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#29a1c0]/20 ring-1 ring-gray-100"
            } focus:outline-none`}
          placeholder={placeholder}
        />
        {suffix && (
          <span className={`absolute ${compact ? 'right-3' : 'right-4'} top-1/2 -translate-y-1/2 font-bold ${compact ? 'text-xs' : 'text-sm'} ${error ? "text-red-400" : "text-gray-400"}`}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

const ResultCard: React.FC<{ label: string; value: string | number; unit: string; highlight?: boolean; subtitle?: string; disabled?: boolean }> = ({ label, value, unit, highlight = false, subtitle, disabled = false }) => (
  <div className={`relative overflow-hidden p-4 md:p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between min-h-[90px] ${
    disabled 
      ? 'bg-gray-50 border border-gray-100 text-gray-300'
      : highlight
        ? 'bg-gradient-to-br from-[#29a1c0] to-[#3eb6e6] text-white shadow-xl shadow-cyan-200/50 scale-[1.02]'
        : 'bg-white border border-gray-100 text-gray-800 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1'
  }`}>
    <div className="relative z-10">
      <div className={`text-[10px] uppercase tracking-widest mb-1 truncate opacity-90 font-bold ${disabled ? 'text-gray-300' : highlight ? 'text-cyan-50' : 'text-gray-400'}`}>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`text-xl md:text-2xl lg:text-3xl font-black tracking-tight ${disabled ? 'text-gray-300' : highlight ? 'text-white' : 'text-slate-800'} ${value === '有意差なし' ? 'text-lg md:text-xl lg:text-2xl' : ''}`}>
          {disabled ? '---' : value}
        </span>
        {value !== '有意差なし' && (
          <span className={`text-xs font-bold ${disabled ? 'text-gray-300' : highlight ? 'text-cyan-100' : 'text-gray-400'}`}>
            {disabled ? '' : unit}
          </span>
        )}
      </div>
      {subtitle && <div className={`text-[10px] mt-1 ${disabled ? 'text-gray-300' : highlight ? 'text-cyan-100' : 'text-gray-400'}`}>{subtitle}</div>}
    </div>
    {/* Decorative background element */}
    <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-3xl ${highlight ? 'bg-white/20' : 'bg-gray-100'}`}></div>
  </div>
);

const DetailRow: React.FC<DetailItem> = ({ label, formula, calculation, result, unit }) => (
  <div className="py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded-lg">
    <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#29a1c0]"></div>
      {label}
    </div>
    <div className="text-[10px] text-slate-400 font-mono mb-1.5 pl-3.5 leading-tight">{formula}</div>
    <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 ml-3.5">
      <span className="font-mono text-slate-600 break-all">{calculation}</span>
      <span className="text-slate-300">=</span>
      <span className="font-bold text-[#29a1c0] whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{result}<span className="text-[10px] ml-0.5 font-normal">{unit}</span></span>
    </div>
  </div>
);

export default function EffectCalculator() {
  const [category, setCategory] = useState(CATEGORIES.ACQUISITION.id);
  const [activeTab, setActiveTab] = useState<'single' | 'regular'>('single');
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDetails = () => {
    if (!results.isValid) return;
    
    const categoryObj = Object.values(CATEGORIES).find(c => c.id === category);
    const categoryName = categoryObj ? categoryObj.name : '';

    let textToCopy = `【${categoryName}】\n`;
    textToCopy += `■ 施策効果\n`;
    textToCopy += `${results.primaryLabel}: ${formatNumber(results.primaryMetric)}人\n`;
    if (results.sacLabel) {
      textToCopy += `${results.sacLabel}: ¥${formatCurrency(results.sacOrArpu)}\n`;
    }
    textToCopy += `利益: ${results.profit === '有意差なし' ? '有意差なし' : `¥${formatCurrency(results.profit)}`}\n`;
    textToCopy += `ROI: ${formatCurrency(results.roi)}${results.roi === '有意差なし' ? '' : '%'}\n\n`;
    
    textToCopy += `■ 施策効果の計測式\n`;
    results.details.forEach(d => {
      textToCopy += `[${d.label}]\n`;
      textToCopy += `計算式: ${d.formula}\n`;
      textToCopy += `計算: ${d.calculation}\n`;
      textToCopy += `結果: ${d.result} ${d.unit}\n\n`;
    });

    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
 
  // Inputs (Standard)
  const [targetCount, setTargetCount] = useState('');
  const [cost, setCost] = useState('');
  const [duration, setDuration] = useState('');
 
  // Ratios (Acquisition/Return/Upsell/Crosssell Specific)
  const [ratioProBaseball, setRatioProBaseball] = useState('0');
  const [ratioF1, setRatioF1] = useState('0');
  const [ratioHallyu, setRatioHallyu] = useState('0');
  const [ratioBasic, setRatioBasic] = useState('0');
  const [ratioOthers, setRatioOthers] = useState('0');

  // ARPU (Acquisition/Return Specific)
  const [arpuProBaseball, setArpuProBaseball] = useState('0');
  const [arpuF1, setArpuF1] = useState('0');
  const [arpuHallyu, setArpuHallyu] = useState('0');
  const [arpuBasic, setArpuBasic] = useState('0');
  const [arpuOthers, setArpuOthers] = useState('0');

  // Churn Rate (Acquisition/Return Specific)
  const [churnProBaseball, setChurnProBaseball] = useState('0');
  const [churnF1, setChurnF1] = useState('0');
  const [churnHallyu, setChurnHallyu] = useState('0');
  const [churnBasic, setChurnBasic] = useState('0');
  const [churnOthers, setChurnOthers] = useState('0');

  // Inputs (Upsell/Crosssell)
  const [priceAfter, setPriceAfter] = useState('');
  const [priceBefore, setPriceBefore] = useState('');

  // Inputs (Churn A/B Test)
  const [testGroupCount, setTestGroupCount] = useState('');
  const [testGroupChurn, setTestGroupChurn] = useState('');
  const [controlGroupCount, setControlGroupCount] = useState('');
  const [controlGroupChurn, setControlGroupChurn] = useState('');
  const [churnArpuInput, setChurnArpuInput] = useState('');

  const [results, setResults] = useState<ResultsState>({
    primaryMetric: 0,
    primaryLabel: '',
    sacOrArpu: 0,
    sacLabel: '',
    profit: 0,
    roi: 0,
    isProfit: true,
    details: [],
    isValid: true
  });

  const currentLtvSet = category === CATEGORIES.ACQUISITION.id ? LTV_ACQUISITION : LTV_RETURN;

  useEffect(() => {
    const numCost = parseFloat(cost) || 0;
    const numDuration = parseFloat(duration) || 1;
    const isRegular = activeTab === 'regular';
    const effectiveDuration = isRegular ? numDuration : 1;
   
    let primaryMetric: number | string = 0;
    let primaryLabel = '';
    let sacOrArpu = 0;
    let sacLabel: string | null = '';
    let profit: number | string = 0;
    let roi: number | string = 0;
    let details: DetailItem[] = [];
    let isValid = true;
    let error = "";
   
    const f = (v: number | string) => {
      if (typeof v === 'string') return v;
      return new Intl.NumberFormat('ja-JP').format(v || 0);
    };
    const fc = (v: number | string) => {
      if (typeof v === 'string') return v;
      return new Intl.NumberFormat('ja-JP').format(Math.round(v || 0));
    };

    if (category === CATEGORIES.ACQUISITION.id || category === CATEGORIES.RETURN.id) {
      const isReturn = category === CATEGORIES.RETURN.id;
      const ltvSet = isReturn ? LTV_RETURN : LTV_ACQUISITION;
      primaryLabel = isReturn ? '再加入者数' : '新規加入者数';
      sacLabel = isReturn ? '再加入SAC' : 'SAC';
     
      const nPB = parseFloat(ratioProBaseball) || 0;
      const nF1 = parseFloat(ratioF1) || 0;
      const nHL = parseFloat(ratioHallyu) || 0;
      const nBS = parseFloat(ratioBasic) || 0;
      const nOT = parseFloat(ratioOthers) || 0;
      const totalSubs = nPB + nF1 + nHL + nBS + nOT;
      
      primaryMetric = totalSubs;

      if (isValid) {
        const cPB = parseFloat(churnProBaseball) || 0;
        const cF1 = parseFloat(churnF1) || 0;
        const cHL = parseFloat(churnHallyu) || 0;
        const cBS = parseFloat(churnBasic) || 0;
        const cOT = parseFloat(churnOthers) || 0;

        const aPB = parseFloat(arpuProBaseball) || 0;
        const aF1 = parseFloat(arpuF1) || 0;
        const aHL = parseFloat(arpuHallyu) || 0;
        const aBS = parseFloat(arpuBasic) || 0;
        const aOT = parseFloat(arpuOthers) || 0;

        const calcDuration = (histDur: number, histChurnPct: number, inputChurnPct: number) => {
          const histChurn = histChurnPct / 100;
          const inputChurn = inputChurnPct / 100;
          if (histChurn === 1) return 0;
          // Round to 1 decimal place to match the displayed value and avoid calculation discrepancies
          return Math.round((histDur * ((1 - inputChurn) / (1 - histChurn))) * 10) / 10;
        };

        const histDurPB = isReturn ? 8.1 : 17.6;
        const histChurnPB = isReturn ? 13.9 : 20.2;
        const histDurF1 = isReturn ? 11.1 : 25.1;
        const histChurnF1 = isReturn ? 11.7 : 10.8;
        const histDurHL = isReturn ? 5.9 : 15.7;
        const histChurnHL = isReturn ? 41.8 : 28.7;
        const histDurBS = isReturn ? 19.9 : 27.4;
        const histChurnBS = isReturn ? 30.0 : 20.0;
        const histDurOT = isReturn ? 7.3 : 18.0;
        const histChurnOT = isReturn ? 36.9 : 29.7;

        const durPB = calcDuration(histDurPB, histChurnPB, cPB);
        const durF1 = calcDuration(histDurF1, histChurnF1, cF1);
        const durHL = calcDuration(histDurHL, histChurnHL, cHL);
        const durBS = calcDuration(histDurBS, histChurnBS, cBS);
        const durOT = calcDuration(histDurOT, histChurnOT, cOT);

        const profitPB = nPB * aPB * 0.3 * durPB;
        const profitF1 = nF1 * aF1 * 0.3 * durF1;
        const profitHL = nHL * aHL * 0.3 * durHL;
        const profitBS = nBS * aBS * 0.3 * durBS;
        const profitOT = nOT * aOT * 0.3 * durOT;

        const grossProfit = profitPB + profitF1 + profitHL + profitBS + profitOT;

        profit = isRegular ? (grossProfit * effectiveDuration) - numCost : grossProfit - numCost;
        sacOrArpu = totalSubs > 0 ? (isRegular ? (numCost / totalSubs) / effectiveDuration : numCost / totalSubs) : 0;

        const activeGenres = [];
        if (nPB > 0) activeGenres.push(`プロ野球:${f(nPB)}人`);
        if (nF1 > 0) activeGenres.push(`F1:${f(nF1)}人`);
        if (nHL > 0) activeGenres.push(`韓流:${f(nHL)}人`);
        if (nBS > 0) activeGenres.push(`基本プラン:${f(nBS)}人`);
        if (nOT > 0) activeGenres.push(`その他:${f(nOT)}人`);

        const primaryCalculation = activeGenres.length > 0
          ? activeGenres.join(' + ')
          : `${f(totalSubs)}人`;

        details.push({
          label: primaryLabel,
          formula: '入力された内訳の合計',
          calculation: primaryCalculation,
          result: f(primaryMetric),
          unit: '人'
        });

        const sacFormula = isRegular ? `施策コスト ÷ ${primaryLabel} ÷ 施策実施期間` : `施策コスト ÷ ${primaryLabel}`;
        const sacCalculation = isRegular ? `${f(numCost)}円 ÷ ${f(totalSubs)}人 ÷ ${f(effectiveDuration)}ヶ月` : `${f(numCost)}円 ÷ ${f(totalSubs)}人`;

        details.push({
          label: sacLabel,
          formula: sacFormula,
          calculation: sacCalculation,
          result: `${fc(sacOrArpu)}`,
          unit: '円'
        });

        const durationCalculations = [];
        const durationResults = [];

        if (nPB > 0) {
          durationCalculations.push(`プロ野球: ${histDurPB} × ((1 - ${cPB}%) ÷ (1 - ${histChurnPB}%))`);
          durationResults.push(`プロ野球: ${durPB.toFixed(1)}ヶ月`);
        }
        if (nF1 > 0) {
          durationCalculations.push(`F1: ${histDurF1} × ((1 - ${cF1}%) ÷ (1 - ${histChurnF1}%))`);
          durationResults.push(`F1: ${durF1.toFixed(1)}ヶ月`);
        }
        if (nHL > 0) {
          durationCalculations.push(`韓流: ${histDurHL} × ((1 - ${cHL}%) ÷ (1 - ${histChurnHL}%))`);
          durationResults.push(`韓流: ${durHL.toFixed(1)}ヶ月`);
        }
        if (nBS > 0) {
          durationCalculations.push(`基本プラン: ${histDurBS} × ((1 - ${cBS}%) ÷ (1 - ${histChurnBS}%))`);
          durationResults.push(`基本プラン: ${durBS.toFixed(1)}ヶ月`);
        }
        if (nOT > 0) {
          durationCalculations.push(`その他: ${histDurOT} × ((1 - ${cOT}%) ÷ (1 - ${histChurnOT}%))`);
          durationResults.push(`その他: ${durOT.toFixed(1)}ヶ月`);
        }

        details.push({
          label: '各ジャンルの推定継続期間',
          formula: '過去実績の平均継続月数 × ((1 - 対象施策の解約率) ÷ (1 - 過去実績の解約率))',
          calculation: durationCalculations.length > 0 ? durationCalculations.join('\n') : '加入者数が入力されていません',
          result: durationResults.length > 0 ? durationResults.join('\n') : '-',
          unit: ''
        });

        const profitFormulaParts = [];
        const profitCalcParts = [];

        if (nPB > 0) {
          profitFormulaParts.push('(プロ野球加入者数 × プロ野球ARPU × 0.3 × プロ野球推定継続期間)');
          profitCalcParts.push(`(${f(nPB)} × ${f(aPB)} × 0.3 × ${durPB.toFixed(1)})`);
        }
        if (nF1 > 0) {
          profitFormulaParts.push('(F1加入者数 × F1ARPU × 0.3 × F1推定継続期間)');
          profitCalcParts.push(`(${f(nF1)} × ${f(aF1)} × 0.3 × ${durF1.toFixed(1)})`);
        }
        if (nHL > 0) {
          profitFormulaParts.push('(韓流加入者数 × 韓流ARPU × 0.3 × 韓流推定継続期間)');
          profitCalcParts.push(`(${f(nHL)} × ${f(aHL)} × 0.3 × ${durHL.toFixed(1)})`);
        }
        if (nBS > 0) {
          profitFormulaParts.push('(基本プラン加入者数 × 基本プランARPU × 0.3 × 基本プラン推定継続期間)');
          profitCalcParts.push(`(${f(nBS)} × ${f(aBS)} × 0.3 × ${durBS.toFixed(1)})`);
        }
        if (nOT > 0) {
          profitFormulaParts.push('(その他加入者数 × その他ARPU × 0.3 × その他推定継続期間)');
          profitCalcParts.push(`(${f(nOT)} × ${f(aOT)} × 0.3 × ${durOT.toFixed(1)})`);
        }

        const profitFormula = profitFormulaParts.length > 0
          ? (isRegular
              ? `(${profitFormulaParts.join(' + ')}) × 施策実施期間 - 施策コスト`
              : `(${profitFormulaParts.join(' + ')}) - 施策コスト`)
          : '0 - 施策コスト';

        const profitCalculation = profitCalcParts.length > 0
          ? (isRegular
              ? `(${profitCalcParts.join(' + ')}) × ${f(effectiveDuration)}ヶ月 - ${f(numCost)}円`
              : `(${profitCalcParts.join(' + ')}) - ${f(numCost)}円`)
          : `0 - ${f(numCost)}円`;

        details.push({
          label: '利益',
          formula: profitFormula,
          calculation: profitCalculation,
          result: `${fc(profit)}`,
          unit: '円'
        });
      }

    } else if (category === CATEGORIES.CHURN.id) {
      const ARPU = parseFloat(churnArpuInput) || 0;
      const MARGIN_RATE = 0.3;
      primaryLabel = '解約抑止顧客数';
      sacLabel = null;
      
      const tCount = parseFloat(testGroupCount) || 0;
      const tChurn = parseFloat(testGroupChurn) || 0;
      const cCount = parseFloat(controlGroupCount) || 0;
      const cChurn = parseFloat(controlGroupChurn) || 0;

      const churnImprovement = cChurn - tChurn;
      const numTarget = tCount * (churnImprovement / 100);
      
      const { isSignificant } = calculateChiSquare(tCount, tChurn, cCount, cChurn);
      const isTested = tCount > 0 && cCount > 0 && tChurn > 0 && cChurn > 0;
      const showNoSignificance = isTested && !isSignificant;

      primaryMetric = showNoSignificance ? '有意差なし' : numTarget;
      const effectiveTarget = showNoSignificance ? 0 : numTarget;
      profit = showNoSignificance ? '有意差なし' : (effectiveTarget * ARPU * MARGIN_RATE * effectiveDuration) - numCost;
      sacOrArpu = 0;

      details.push({
        label: '施策の対象顧客数', formula: 'テストグループの顧客数',
        calculation: `${f(tCount)}人`,
        result: f(tCount), unit: '人'
      });
      details.push({
        label: '解約率改善幅', formula: 'コントロールグループの解約率 － テストグループの解約率',
        calculation: `${cChurn}% － ${tChurn}%`,
        result: showNoSignificance ? '有意差なし' : churnImprovement.toFixed(1), unit: showNoSignificance ? '' : '%'
      });
      details.push({
        label: primaryLabel, formula: '施策の対象顧客数 × 解約率改善幅',
        calculation: `${f(tCount)}人 × ${showNoSignificance ? '0' : churnImprovement.toFixed(1)}%`,
        result: showNoSignificance ? '有意差なし' : f(primaryMetric), unit: showNoSignificance ? '' : '人'
      });
      details.push({
        label: '利益', 
        formula: isRegular 
          ? '解約抑止顧客数 × ARPU × 粗利率（0.3） × 期間 － 施策コスト' 
          : '解約抑止顧客数 × ARPU × 粗利率（0.3） － 施策コスト',
        calculation: showNoSignificance 
          ? '有意差なし'
          : isRegular
            ? `${f(effectiveTarget)}人 × ${f(ARPU)}円 × 0.3 × ${f(effectiveDuration)}ヶ月 － ${f(numCost)}円`
            : `${f(effectiveTarget)}人 × ${f(ARPU)}円 × 0.3 － ${f(numCost)}円`,
        result: showNoSignificance ? '有意差なし' : fc(profit), unit: showNoSignificance ? '' : '円'
      });

    } else if (category === CATEGORIES.UPSELL.id || category === CATEGORIES.CROSSSELL.id) {
      const isUpsell = category === CATEGORIES.UPSELL.id;
      const term = isUpsell ? 'アップセル' : 'クロスセル';
      const MARGIN_RATE = 0.3;
      
      primaryLabel = `${term}の顧客数`;
      sacLabel = 'ARPUの増加額';
      
      const nPB = parseFloat(ratioProBaseball) || 0;
      const nF1 = parseFloat(ratioF1) || 0;
      const nHL = parseFloat(ratioHallyu) || 0;
      const nBS = parseFloat(ratioBasic) || 0;
      const nOT = parseFloat(ratioOthers) || 0;
      const totalSubs = nPB + nF1 + nHL + nBS + nOT;

      primaryMetric = totalSubs;

      const hasPriceAfter = priceAfter !== '' && !isNaN(parseFloat(priceAfter));
      const pAfter = hasPriceAfter ? parseFloat(priceAfter) : 0;
      const hasPriceBefore = priceBefore !== '' && !isNaN(parseFloat(priceBefore));
      const pBefore = hasPriceBefore ? parseFloat(priceBefore) : 0;
      
      // LOGIC DIFFERENCE: Cross-sell uses the full price as increase, Upsell uses the difference
      if (isUpsell) {
        sacOrArpu = hasPriceAfter && hasPriceBefore ? (pAfter - pBefore) : 0;
      } else {
        sacOrArpu = hasPriceAfter ? pAfter : 0;
      }

      if (isValid) {
        let totalUserMonths = 0;

        // Calculate total user-months of benefit
        const durations = isUpsell ? UPSELL_DURATIONS : CROSSSELL_DURATIONS;
        totalUserMonths = 
          (nPB * durations.PRO_BASEBALL) +
          (nF1 * durations.F1) +
          (nHL * durations.HALLYU) +
          (nBS * durations.BASIC) +
          (nOT * durations.OTHERS);

        const activeGenres = [];
        if (ratioProBaseball !== '' && nPB > 0) activeGenres.push({ name: 'プロ野球', count: nPB, duration: durations.PRO_BASEBALL });
        if (ratioF1 !== '' && nF1 > 0) activeGenres.push({ name: 'F1', count: nF1, duration: durations.F1 });
        if (ratioHallyu !== '' && nHL > 0) activeGenres.push({ name: '韓流', count: nHL, duration: durations.HALLYU });
        if (ratioBasic !== '' && nBS > 0) activeGenres.push({ name: '基本プラン', count: nBS, duration: durations.BASIC });
        if (ratioOthers !== '' && nOT > 0) activeGenres.push({ name: 'その他', count: nOT, duration: durations.OTHERS });

        const customerCalcStr = activeGenres.length > 0 
          ? activeGenres.map(g => `${g.name}:${f(g.count)}`).join(', ')
          : '未入力';

        const durationCalcStr = activeGenres.length > 0
          ? activeGenres.map(g => `${g.name}(${f(g.count)}×${g.duration})`).join(' + ')
          : '0';

        details.push({
          label: `各ジャンルの${term}顧客数`, formula: `入力された${term}内訳`,
          calculation: customerCalcStr,
          result: f(primaryMetric), unit: '人'
        });
        const durationLabel = isUpsell ? 'アップセル後の推定継続期間' : 'クロスセル後の推定継続期間';
        details.push({
          label: '総継続月数', formula: `∑(各ジャンルの${term}顧客数 × 各ジャンルの${durationLabel})`,
          calculation: durationCalcStr,
          result: f(totalUserMonths), unit: 'ヶ月'
        });

        // Revenue component: Total User Months * ARPU Increase * Margin
        const totalRevenue = totalUserMonths * sacOrArpu * MARGIN_RATE;

        // Apply regular duration multiplier if necessary
        profit = (totalRevenue * effectiveDuration) - numCost;

        details.unshift({
          label: primaryLabel, formula: '入力された内訳の合計',
          calculation: `${f(totalSubs)}人`,
          result: f(primaryMetric), unit: '人'
        });
        
        // LOGIC DIFFERENCE: Details for ARPU calculation
        if (isUpsell) {
          details.splice(2, 0, {
            label: sacLabel, formula: `${term}後の平均商品単価 - ${term}前の平均商品単価`,
            calculation: hasPriceAfter && hasPriceBefore ? `${f(pAfter)}円 － ${f(pBefore)}円` : '(未入力) － (未入力)',
            result: fc(sacOrArpu), unit: '円'
          });
        } else {
           details.splice(2, 0, {
            label: sacLabel, formula: 'クロスセル対象商品の価格',
            calculation: hasPriceAfter ? `${f(pAfter)}円` : '(未入力)',
            result: fc(sacOrArpu), unit: '円'
          });
        }
        
        details.push({
          label: '利益', formula: isRegular ? '総継続月数 × ARPUの増加額 × 0.3 × 期間 － 施策コスト' : '総継続月数 × ARPUの増加額 × 0.3 － 施策コスト',
          calculation: isRegular
            ? `(${f(totalUserMonths)} × ${f(sacOrArpu)} × 0.3) × ${f(effectiveDuration)} － ${f(numCost)}`
            : `(${f(totalUserMonths)} × ${f(sacOrArpu)} × 0.3) － ${f(numCost)}`,
          result: fc(profit), unit: '円'
        });
      }
    }

    if (isValid) {
      if (profit === '有意差なし') {
        roi = '有意差なし';
        details.push({
          label: 'ROI', formula: '利益 ÷ 施策コスト × 100',
          calculation: `有意差なし`,
          result: '有意差なし', unit: ''
        });
      } else if (typeof profit === 'number') {
        roi = numCost > 0 ? (profit / numCost) * 100 : 0;
        details.push({
          label: 'ROI', formula: '利益 ÷ 施策コスト × 100',
          calculation: `${fc(profit)}円 ÷ ${f(numCost)}円 × 100`,
          result: fc(roi), unit: '%'
        });
      }
    }

    setResults({ primaryMetric, primaryLabel, sacOrArpu, sacLabel, profit, roi, isProfit: typeof profit === 'number' ? profit >= 0 : false, details, isValid, error });
  }, [category, activeTab, targetCount, cost, duration, priceAfter, priceBefore, ratioProBaseball, ratioF1, ratioHallyu, ratioBasic, ratioOthers, arpuProBaseball, arpuF1, arpuHallyu, arpuBasic, arpuOthers, churnProBaseball, churnF1, churnHallyu, churnBasic, churnOthers, testGroupCount, testGroupChurn, controlGroupCount, controlGroupChurn, churnArpuInput]);

  const formatCurrency = (num: number | string) => {
    if (typeof num === 'string') return num;
    return new Intl.NumberFormat('ja-JP').format(Math.round(num));
  };
  const formatNumber = (num: number | string) => {
    if (typeof num === 'string') return num;
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  const isAcqRatioMode = category === CATEGORIES.ACQUISITION.id || category === CATEGORIES.RETURN.id;
  const isUpsellRatioMode = category === CATEGORIES.UPSELL.id || category === CATEGORIES.CROSSSELL.id;
  
  const currentRatioTotal = (parseFloat(ratioProBaseball) || 0) + (parseFloat(ratioF1) || 0) + (parseFloat(ratioHallyu) || 0) + (parseFloat(ratioBasic) || 0) + (parseFloat(ratioOthers) || 0);

  // Helper to render Churn A/B Test Inputs
  const renderChurnABTestInputs = () => {
    const tCount = parseFloat(testGroupCount) || 0;
    const tChurn = parseFloat(testGroupChurn) || 0;
    const cCount = parseFloat(controlGroupCount) || 0;
    const cChurn = parseFloat(controlGroupChurn) || 0;

    const churnImprovement = cChurn - tChurn;
    const numTarget = tCount * (churnImprovement / 100);

    const { isSignificant, chiSqResult } = calculateChiSquare(tCount, tChurn, cCount, cChurn);
    const isTested = tCount > 0 && cCount > 0 && tChurn > 0 && cChurn > 0;
    const showNoSignificance = isTested && !isSignificant;

    return (
      <div className="mb-5 group">
        <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2 flex items-center gap-1.5 transition-colors group-focus-within:text-[#29a1c0]">
          <Users size={16} className="text-gray-400 group-focus-within:text-[#29a1c0] transition-colors" />
          解約抑止顧客数
        </label>
        <div className="p-4 bg-white/50 rounded-2xl border border-gray-100 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-gray-600 flex items-start gap-1.5 uppercase tracking-wider leading-tight">
              <Activity size={14} className="text-[#29a1c0] mt-0.5 shrink-0" />
              <span>
                A/Bテスト結果<br />
                <span className="text-[10px] text-gray-400">（ベースラインとの比較結果）</span>
              </span>
            </h3>
          </div>
          
          <div className="mb-4">
            <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">テストグループ（施策対象）</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <InputField label="顧客数" value={testGroupCount} onChange={setTestGroupCount} suffix="人" placeholder="0" compact={true} />
              <InputField label="解約率" value={testGroupChurn} onChange={setTestGroupChurn} suffix="%" placeholder="0" compact={true} />
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">コントロールグループ（現状維持/ベースライン）</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <InputField label="顧客数" value={controlGroupCount} onChange={setControlGroupCount} suffix="人" placeholder="0" compact={true} />
              <InputField label="解約率" value={controlGroupChurn} onChange={setControlGroupChurn} suffix="%" placeholder="0" compact={true} />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                施策の対象顧客数
              </label>
              <div className="text-lg font-black text-slate-700">
                {formatNumber(tCount)} <span className="text-sm text-gray-400 font-bold">人</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                  解約率改善幅
                </label>
                {chiSqResult && (
                  <span className={`text-[10px] font-bold mt-0.5 ${isSignificant ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {chiSqResult}
                  </span>
                )}
              </div>
              <div className="text-lg font-black text-slate-700">
                {showNoSignificance ? (
                  <span className="text-sm text-gray-500 font-bold">有意差なし</span>
                ) : (
                  <>{churnImprovement.toFixed(1)} <span className="text-sm text-gray-400 font-bold">%</span></>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <label className="text-xs font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                解約抑止顧客数
              </label>
              <div className="text-xl font-black text-blue-700">
                {showNoSignificance ? (
                  <span className="text-sm text-gray-500 font-bold">有意差なし</span>
                ) : (
                  <>{formatNumber(Math.round(numTarget))} <span className="text-sm text-blue-400 font-bold">人</span></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const aPB = parseFloat(arpuProBaseball) || 0;
  const aF1 = parseFloat(arpuF1) || 0;
  const aHL = parseFloat(arpuHallyu) || 0;
  const aBS = parseFloat(arpuBasic) || 0;
  const aOT = parseFloat(arpuOthers) || 0;

  const cPB = parseFloat(churnProBaseball) || 0;
  const cF1 = parseFloat(churnF1) || 0;
  const cHL = parseFloat(churnHallyu) || 0;
  const cBS = parseFloat(churnBasic) || 0;
  const cOT = parseFloat(churnOthers) || 0;

  const nPB = parseFloat(ratioProBaseball) || 0;
  const nF1 = parseFloat(ratioF1) || 0;
  const nHL = parseFloat(ratioHallyu) || 0;
  const nBS = parseFloat(ratioBasic) || 0;
  const nOT = parseFloat(ratioOthers) || 0;

  const weightedArpuTotal = currentRatioTotal > 0 
    ? ((nPB * aPB) + (nF1 * aF1) + (nHL * aHL) + (nBS * aBS) + (nOT * aOT)) / currentRatioTotal 
    : 0;

  const weightedChurnTotal = currentRatioTotal > 0 
    ? ((nPB * cPB) + (nF1 * cF1) + (nHL * cHL) + (nBS * cBS) + (nOT * cOT)) / currentRatioTotal 
    : 0;
  
  const ltvSuffix = category === CATEGORIES.RETURN.id ? '（再加入）' : '（新規加入）';

  let characterVariant: CharacterVariant = 'normal';
  if (results.profit === '有意差なし') {
    characterVariant = 'sad';
  } else if (results.profit === 0 && !cost) {
    characterVariant = 'normal';
  } else {
    characterVariant = (results.profit as number) >= 0 ? 'fun' : 'sad';
  }

  const getAdviceText = () => {
    if (results.profit === '有意差なし') {
      return "有意差がないので、施策効果を出せないよ。サンプルサイズが足りているか確かめてみよう！";
    }
    if (results.profit === 0 && !cost) {
      return "数値を入力して、試算を始めてみよう！";
    }

    const profitNum = results.profit as number;
    const roiNum = results.roi as number;
    const formattedProfit = formatCurrency(Math.abs(profitNum));

    if (activeTab === 'single') {
      if (profitNum < 0) {
        return `${formattedProfit}円の赤字施策だったね。。効果が低かった原因を分析して次回の施策に活かそう！`;
      } else {
        if (roiNum >= 50) {
          return `すごいね！${formattedProfit}円の黒字施策だよ！定常施策にできないか検討してみよう！`;
        } else {
          return `すごいね！${formattedProfit}円の黒字施策だよ！施策実施前に試算した内容と比較して振り返りをしてみよう！`;
        }
      }
    } else {
      if (profitNum < 0) {
        return `${formattedProfit}円の赤字施策だったね。。施策を打ち切るか効果が低い原因を特定して施策を改善しよう！`;
      } else {
        if (roiNum >= 50) {
          return `すごいね！${formattedProfit}円の黒字施策だよ！対象顧客を拡大するなど施策を拡張できないか検討してみよう！`;
        } else {
          return `すごいね！${formattedProfit}円の黒字施策だよ！施策実施前に試算した内容と比較して振り返りをしてみよう！`;
        }
      }
    }
  };

  // Helper to render Ratio Inputs
  const renderRatioInputs = () => (
    <div className="mb-5 group">
      <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2 flex items-center gap-1.5 transition-colors group-focus-within:text-[#29a1c0]">
        <Users size={16} className="text-gray-400 group-focus-within:text-[#29a1c0] transition-colors" />
        {isUpsellRatioMode ? `${category === CATEGORIES.UPSELL.id ? "アップセル" : "クロスセル"}顧客数` : (category === CATEGORIES.RETURN.id ? "再加入者数" : "新規加入者数")}
      </label>
      <div className="p-4 bg-white/50 rounded-2xl border border-gray-100 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-gray-600 flex items-center gap-1.5 uppercase tracking-wider">
            <PieChart size={14} className="text-[#29a1c0]" />
            {isUpsellRatioMode ? `${category === CATEGORIES.UPSELL.id ? "アップセル" : "クロスセル"}内訳` : "加入者内訳"}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 animate-fadeIn mb-4">
          <InputField label="プロ野球きっかけ顧客" value={ratioProBaseball} onChange={setRatioProBaseball} suffix="人" placeholder="0" compact={true} />
          <InputField label="F1きっかけ顧客" value={ratioF1} onChange={setRatioF1} suffix="人" placeholder="0" compact={true} />
          <InputField label="韓流きっかけ顧客" value={ratioHallyu} onChange={setRatioHallyu} suffix="人" placeholder="0" compact={true} />
          <InputField label="基本プラン顧客" value={ratioBasic} onChange={setRatioBasic} suffix="人" placeholder="0" compact={true} />
          <InputField label="その他顧客" value={ratioOthers} onChange={setRatioOthers} suffix="人" placeholder="0" compact={true} />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
              {isUpsellRatioMode ? `${category === CATEGORIES.UPSELL.id ? "アップセル" : "クロスセル"}顧客数` : (category === CATEGORIES.RETURN.id ? "再加入者数" : "新規加入者数")}
            </label>
            <div className="text-lg font-black text-slate-700">
              {formatNumber(currentRatioTotal)} <span className="text-sm text-gray-400 font-bold">人</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to render ARPU Inputs
  const renderArpuInputs = () => (
    <div className="mb-5 group">
      <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2 flex items-center gap-1.5 transition-colors group-focus-within:text-[#29a1c0]">
        <DollarSign size={16} className="text-gray-400 group-focus-within:text-[#29a1c0] transition-colors" />
        ARPU（基本料抜き）
      </label>
      <div className="p-4 bg-white/50 rounded-2xl border border-gray-100 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-gray-600 flex items-center gap-1.5 uppercase tracking-wider">
            <PieChart size={14} className="text-[#29a1c0]" />
            ARPU内訳
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 animate-fadeIn">
          <InputField label="プロ野球きっかけ顧客" value={arpuProBaseball} onChange={setArpuProBaseball} suffix="円" placeholder="0" compact={true} />
          <InputField label="F1きっかけ顧客" value={arpuF1} onChange={setArpuF1} suffix="円" placeholder="0" compact={true} />
          <InputField label="韓流きっかけ顧客" value={arpuHallyu} onChange={setArpuHallyu} suffix="円" placeholder="0" compact={true} />
          <InputField label="基本プラン顧客" value={arpuBasic} onChange={setArpuBasic} suffix="円" placeholder="0" compact={true} />
          <InputField label="その他顧客" value={arpuOthers} onChange={setArpuOthers} suffix="円" placeholder="0" compact={true} />
        </div>
      </div>
    </div>
  );

  // Helper to render Churn Inputs
  const renderChurnInputs = () => (
    <div className="mb-5 group">
      <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2 flex items-center gap-1.5 transition-colors group-focus-within:text-[#29a1c0]">
        <TrendingUp size={16} className="text-gray-400 group-focus-within:text-[#29a1c0] transition-colors" />
        N+1ヶ月解約率
      </label>
      <div className="p-4 bg-white/50 rounded-2xl border border-gray-100 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-gray-600 flex items-center gap-1.5 uppercase tracking-wider">
            <PieChart size={14} className="text-[#29a1c0]" />
            N+1ヶ月解約率内訳
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 animate-fadeIn">
          <InputField label="プロ野球きっかけ顧客" value={churnProBaseball} onChange={setChurnProBaseball} suffix="%" placeholder="0" compact={true} />
          <InputField label="F1きっかけ顧客" value={churnF1} onChange={setChurnF1} suffix="%" placeholder="0" compact={true} />
          <InputField label="韓流きっかけ顧客" value={churnHallyu} onChange={setChurnHallyu} suffix="%" placeholder="0" compact={true} />
          <InputField label="基本プラン顧客" value={churnBasic} onChange={setChurnBasic} suffix="%" placeholder="0" compact={true} />
          <InputField label="その他顧客" value={churnOthers} onChange={setChurnOthers} suffix="%" placeholder="0" compact={true} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] p-4 md:p-8 font-sans flex justify-center items-start selection:bg-cyan-100 selection:text-cyan-900">
      <style>{`
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="max-w-6xl w-full bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-blue-900/10 border border-white/50 overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
        {/* Left Side: Controls */}
        <div className="w-full lg:w-4/12 p-6 md:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-100/50 bg-white/50 relative z-20 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#29a1c0] to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-200">
                <Calculator size={18} strokeWidth={3} />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">施策の効果測定</h1>
            </div>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase pl-1">MARKETING CALCULATOR</p>
          </div>

          <div className="mb-8">
            <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">施策タイプを選択</label>
            <div className="relative group">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 pl-5 pr-12 appearance-none bg-white border-0 ring-1 ring-gray-100 rounded-2xl font-bold text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#29a1c0]/50 hover:shadow-md cursor-pointer"
              >
                {Object.values(CATEGORIES).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]"><ChevronDown size={20} /></div>
            </div>
          </div>

          <div className="bg-gray-100/80 p-1.5 rounded-2xl mb-8 flex shadow-inner">
            <button onClick={() => setActiveTab('single')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'single' ? 'bg-white text-[#29a1c0] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}><TrendingUp size={16} />単発</button>
            <button onClick={() => setActiveTab('regular')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'regular' ? 'bg-white text-[#29a1c0] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}><RefreshCw size={16} />定常</button>
          </div>

          <div className="space-y-1 pl-1 pt-1 pb-1">
            {/* Common Inputs */}
            {(category === CATEGORIES.UPSELL.id || category === CATEGORIES.CROSSSELL.id) && (
              <>
                <InputField 
                  label={category === CATEGORIES.UPSELL.id ? 'アップセル後の平均商品単価' : 'クロスセル対象商品の価格'} 
                  icon={DollarSign} 
                  value={priceAfter} 
                  onChange={setPriceAfter} 
                  suffix="円" 
                  placeholder={category === CATEGORIES.UPSELL.id ? "3,500" : "1,000"} 
                />
                {category === CATEGORIES.UPSELL.id && (
                  <InputField 
                    label="アップセル前の平均商品単価" 
                    icon={DollarSign} 
                    value={priceBefore} 
                    onChange={setPriceBefore} 
                    suffix="円" 
                    placeholder="1,200" 
                  />
                )}
              </>
            )}
            
            {category === CATEGORIES.CHURN.id && (
              renderChurnABTestInputs()
            )}

            {/* Ratios (Shown BEFORE Cost) */}
            {(isAcqRatioMode || isUpsellRatioMode) && renderRatioInputs()}
            {isAcqRatioMode && (
              <>
                {renderArpuInputs()}
                {renderChurnInputs()}
              </>
            )}

            {category === CATEGORIES.CHURN.id && (
              <InputField label="ARPU（基本料抜き）" icon={DollarSign} value={churnArpuInput} onChange={setChurnArpuInput} suffix="円" placeholder="0" />
            )}

            <InputField label="施策コスト" icon={DollarSign} value={cost} onChange={setCost} suffix="円" placeholder="10,000,000" />

            {activeTab === 'regular' && <InputField label="施策実施期間" icon={Calendar} value={duration} onChange={setDuration} suffix="ヶ月" placeholder="12" />}
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="w-full lg:w-8/12 bg-slate-50/50 flex flex-col relative p-6 md:p-8 lg:p-10">
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-3">
                施策効果
              </h2>
              <button
                onClick={handleCopyDetails}
                disabled={!results.isValid}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 border ${
                  !results.isValid 
                    ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-50' 
                    : copied 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm hover:shadow'
                }`}
                title="計算結果と内訳をコピー"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button 
              onClick={() => setShowDetails(!showDetails)} 
              disabled={!results.isValid}
              className={`text-xs font-bold px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2 border ${!results.isValid ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-[#29a1c0] border-gray-100 hover:shadow-md hover:bg-cyan-50'}`}
            >
              <HelpCircle size={14} />{showDetails ? "内訳を隠す" : "内訳を見る"}{showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 z-10 mb-4">
            <ResultCard label={results.primaryLabel} value={formatNumber(results.primaryMetric)} unit="人" disabled={!results.isValid} />
            {results.sacLabel && <ResultCard label={results.sacLabel} value={`¥${formatCurrency(results.sacOrArpu)}`} unit="" disabled={!results.isValid} /> }
            <ResultCard label="利益" value={results.profit === '有意差なし' ? '有意差なし' : `¥${formatCurrency(results.profit)}`} unit="" disabled={!results.isValid} />
            <ResultCard label="ROI" value={formatCurrency(results.roi)} unit={results.roi === '有意差なし' ? '' : '%'} disabled={!results.isValid} />
          </div>

          {results.isValid ? (
            <div className={`transition-all duration-500 overflow-hidden ${showDetails ? 'max-h-[1200px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
              <div className="bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 border border-gray-100 overflow-y-auto max-h-[800px] custom-scrollbar">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50 pb-2 flex items-center gap-2">
                  <Calculator size={12} />
                  Calculation Details
                </h3>
                <div className="space-y-0.5">
                  {results.details.map((d, i) => <DetailRow key={i} {...d} />)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-4 animate-fadeIn flex items-center gap-4 text-rose-800">
              <div className="p-2 bg-white rounded-full shadow-sm text-rose-500">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-0.5">試算が停止しています</h4>
                <p className="text-xs opacity-80">{results.error}</p>
              </div>
            </div>
          )}

          <div className="mt-auto z-10 flex flex-col sm:flex-row items-center gap-4">
            <div className="shrink-0 transform transition-transform hover:scale-105 duration-300">
              <SukappyImage variant={characterVariant} />
            </div>
            <div className="bg-white p-4 md:p-5 rounded-t-2xl rounded-br-2xl rounded-bl-sm shadow-xl shadow-gray-200/50 border border-gray-100 relative flex-1 min-h-[90px] flex flex-col justify-center">
              <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wide opacity-50">
                Advice
              </h3>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed font-bold">
                {getAdviceText()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}