import { useMemo } from 'react';

// Hardcoded rates for demo/fallback. Ideally fetched from API.
const RATES = {
    USD: 1,
    CAD: 0.75, // 1 CAD = ~0.75 USD
    TRY: 0.030, // 1 TRY = ~0.030 USD
    CNY: 0.14  // 1 CNY = ~0.14 USD
};

const CurrencyDisplay = ({ amount, currency }) => {

    const usdValue = useMemo(() => {
        if (!amount || isNaN(amount)) return 0;
        const rate = RATES[currency] || 1;
        return (parseFloat(amount) * rate).toFixed(2);
    }, [amount, currency]);

    if (!amount) return null;

    return (
        <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex justify-between items-center">
            <span className="text-indigo-300 text-sm font-medium">USD Karşılığı (Tahmini)</span>
            <span className="text-indigo-100 font-bold text-lg">
                ${usdValue}
            </span>
        </div>
    );
};

export default CurrencyDisplay;
