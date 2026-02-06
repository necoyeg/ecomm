import { useState } from 'react';
import { Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const TransactionTable = ({ transactions, onEdit, onDelete }) => {
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(transactions.map(t => t.ID));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDeleteSelected = () => {
        if (confirm(`${selectedIds.length} adet kaydı silmek istediğinize emin misiniz?`)) {
            onDelete(selectedIds);
            setSelectedIds([]);
        }
    };

    if (!transactions || transactions.length === 0) {
        return (
            <div className="mt-8 text-center text-slate-500 bg-white/5 p-8 rounded-xl border border-white/5">
                Henüz kayıt bulunmuyor.
            </div>
        );
    }

    return (
        <div className="mt-8 w-full">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-xl font-bold text-slate-200">Kayıt Geçmişi</h3>

                {selectedIds.length > 0 && (
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                        <Trash2 size={16} />
                        Seçilenleri Sil ({selectedIds.length})
                    </button>
                )}
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-white/5 text-slate-400 font-medium uppercasetracking-wider">
                            <tr>
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={transactions.length > 0 && selectedIds.length === transactions.length}
                                        className="cursor-pointer"
                                    />
                                </th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Invoice No</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Document Owner</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-right">USD Value</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {transactions.map((t) => (
                                <tr key={t.ID} className={`hover:bg-white/5 transition-colors ${selectedIds.includes(t.ID) ? 'bg-blue-500/10' : ''}`}>
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(t.ID)}
                                            onChange={() => handleSelectOne(t.ID)}
                                            className="cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-4 whitespace-nowrap opacity-80">
                                        {new Date(t.Date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 font-mono text-slate-400">
                                        {t['Invoice No'] || '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${t.Type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                            }`}>
                                            {t.Type === 'income' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                                            {t.Category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {t['Document Owner'] || '-'}
                                    </td>
                                    <td className="p-4 max-w-[200px] truncate" title={t.Description}>
                                        {t.Description}
                                    </td>
                                    <td className="p-4 text-right font-mono">
                                        <div className="text-white">
                                            {t.Amount} {t.Currency}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-emerald-400">
                                        ${Number(t['USD Value']).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => onEdit(t)}
                                            className="p-2 text-blue-400 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionTable;
