import { useState, useEffect } from 'react';
import { Calendar, Save, DollarSign, Download } from 'lucide-react';
import CategoryManager from './CategoryManager';
import DescriptionInput from './DescriptionInput';
import CurrencyDisplay from './CurrencyDisplay';

const TransactionForm = ({ categories, onAddCategory, onSubmit, history, initialData, onCancel }) => {
    const [type, setType] = useState('expense');
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        documentOwner: '',
        amount: '',
        currency: 'USD',
        category: '',
        description: '',
        invoiceNo: ''
    });

    // Helper to format date for input (YYYY-MM-DD) handling local timezone
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Populate form when initialData changes (Edit Mode)
    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.Date ? formatDateForInput(initialData.Date) : formData.date,
                documentOwner: initialData['Document Owner'] || '',
                amount: initialData.Amount || '',
                currency: initialData.Currency || 'USD',
                category: initialData.Category || '',
                description: initialData.Description || '',
                invoiceNo: initialData['Invoice No'] || ''
            });
            setType(initialData.Type || 'expense');
        }
    }, [initialData]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...formData, type });
        // Reset only if not editing (or handled by parent)
        if (!initialData) {
            setFormData(prev => ({
                ...prev,
                amount: '',
                description: '',
                invoiceNo: '',
                category: ''
            }));
        }
    };

    const labelColor = type === 'income' ? 'text-emerald-400' : 'text-orange-400';

    return (
        <div className={`glass-panel p-6 ${initialData ? 'border-2 border-yellow-500/50' : ''}`}>
            {initialData && (
                <div className="mb-4 text-center text-yellow-500 font-bold bg-yellow-500/10 p-2 rounded-lg">
                    Düzenleme Modu
                </div>
            )}

            {/* Type Toggle */}
            <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6 border border-slate-700">
                <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'income'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    onClick={() => { setType('income'); handleChange('category', ''); }}
                >
                    Gelir
                </button>
                <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'expense'
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    onClick={() => { setType('expense'); handleChange('category', ''); }}
                >
                    Gider
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Date, Document Owner, Invoice No Row */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className={`flex items-center gap-2 ${labelColor}`}>
                            <Calendar size={14} /> Tarih <span className="text-xs text-slate-500 font-normal">(Ay.Gün.Yıl)</span>
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelColor}>Belge Sahibi</label>
                        <input
                            type="text"
                            placeholder="Örn: Ahmet"
                            value={formData.documentOwner}
                            onChange={(e) => handleChange('documentOwner', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelColor}>Fatura No</label>
                        <input
                            type="text"
                            placeholder="Fatura #123"
                            value={formData.invoiceNo}
                            onChange={(e) => handleChange('invoiceNo', e.target.value)}
                        />
                    </div>
                </div>

                {/* Amount & Currency */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className={`flex items-center gap-2 ${labelColor}`}>
                            <DollarSign size={14} /> Miktar
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => handleChange('amount', e.target.value)}
                            className="text-lg font-mono"
                            required
                        />
                    </div>
                    <div>
                        <label className={labelColor}>Para Birimi</label>
                        <select
                            value={formData.currency}
                            onChange={(e) => handleChange('currency', e.target.value)}
                        >
                            <option value="USD">USD ($)</option>
                            <option value="CAD">CAD (C$)</option>
                            <option value="TRY">TRY (₺)</option>
                            <option value="CNY">CNY (¥)</option>
                        </select>
                    </div>
                </div>

                <CurrencyDisplay amount={formData.amount} currency={formData.currency} />

                {/* Category */}
                <CategoryManager
                    type={type}
                    categories={categories[type] || []}
                    selectedCategory={formData.category}
                    onSelect={(cat) => handleChange('category', cat)}
                    onAddCategory={onAddCategory}
                    labelColor={labelColor}
                />

                {/* Description */}
                <DescriptionInput
                    value={formData.description}
                    onChange={(val) => handleChange('description', val)}
                    history={history}
                    labelColor={labelColor}
                />

                {/* Buttons */}
                <div className="flex gap-4 mt-6">
                    <button
                        type="submit"
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-lg shadow-xl hover:shadow-2xl transition-all ${type === 'income'
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-orange-600 hover:bg-orange-500'
                            } rounded-xl text-white font-bold`}
                    >
                        <Save size={20} />
                        {initialData ? 'Güncelle' : 'Kaydet'}
                    </button>

                    {initialData && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold"
                        >
                            İptal
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default TransactionForm;
