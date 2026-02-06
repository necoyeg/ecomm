import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const SummarySection = ({ transactions }) => {
    const summary = useMemo(() => {
        const acc = {
            income: { categories: {}, total: 0 },
            expense: { categories: {}, total: 0 }
        };

        transactions.forEach(t => {
            const type = t.Type; // 'income' or 'expense'
            if (!acc[type]) return;

            const amount = parseFloat(t['USD Value']) || 0;
            const category = t.Category || 'Diğer';

            if (!acc[type].categories[category]) {
                acc[type].categories[category] = 0;
            }

            acc[type].categories[category] += amount;
            acc[type].total += amount;
        });

        return acc;
    }, [transactions]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 w-full">
            {/* Income Summary */}
            <div className="glass-panel p-6 border-l-4 border-emerald-500">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Gelir Özeti</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Kategori Bazlı Toplamlar</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {Object.entries(summary.income.categories).map(([cat, total]) => (
                        <div key={cat} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <span className="text-slate-300 font-medium">{cat}</span>
                            <span className="text-emerald-400 font-mono">{formatCurrency(total)}</span>
                        </div>
                    ))}
                    {Object.keys(summary.income.categories).length === 0 && (
                        <div className="text-center text-slate-500 py-4 italic">Veri yok</div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-lg">
                    <span className="font-bold text-slate-200">GENEL TOPLAM</span>
                    <span className="font-bold text-emerald-400 font-mono text-xl">{formatCurrency(summary.income.total)}</span>
                </div>
            </div>

            {/* Expense Summary */}
            <div className="glass-panel p-6 border-l-4 border-orange-500">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <div className="p-3 rounded-full bg-orange-500/20 text-orange-400">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Gider Özeti</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Kategori Bazlı Toplamlar</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {Object.entries(summary.expense.categories).map(([cat, total]) => (
                        <div key={cat} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <span className="text-slate-300 font-medium">{cat}</span>
                            <span className="text-orange-400 font-mono">{formatCurrency(total)}</span>
                        </div>
                    ))}
                    {Object.keys(summary.expense.categories).length === 0 && (
                        <div className="text-center text-slate-500 py-4 italic">Veri yok</div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-lg">
                    <span className="font-bold text-slate-200">GENEL TOPLAM</span>
                    <span className="font-bold text-orange-400 font-mono text-xl">{formatCurrency(summary.expense.total)}</span>
                </div>
            </div>

            {/* Net Profit Summary - Bonus */}
            <div className="md:col-span-2 glass-panel p-4 flex justify-between items-center bg-slate-800/50">
                <span className="text-slate-400 font-medium">Net Durum (Gelir - Gider)</span>
                <span className={`text-2xl font-bold font-mono ${summary.income.total - summary.expense.total >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {formatCurrency(summary.income.total - summary.expense.total)}
                </span>
            </div>
        </div>
    );
};

export default SummarySection;
