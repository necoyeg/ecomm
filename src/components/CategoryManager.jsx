import { useState, useRef, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';

const CategoryManager = ({ type, selectedCategory, onSelect, categories, onAddCategory, labelColor }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleAdd = () => {
        if (newCategory.trim()) {
            onAddCategory(type, newCategory.trim());
            setNewCategory('');
            setIsAdding(false);
            onSelect(newCategory.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
        }
    };

    return (
        <div className="w-full">
            <label className={labelColor}>{type === 'income' ? 'Gelir' : 'Gider'} Kategorisi</label>
            <div className="flex gap-2 relative">
                {!isAdding ? (
                    <>
                        <select
                            value={selectedCategory}
                            onChange={(e) => onSelect(e.target.value)}
                            className="flex-1 appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Kategori Seçin</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {/* Custom Arrow because appearance-none removes default */}
                        <div className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            ▼
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsAdding(true)}
                            className="p-3 bg-opacity-20 bg-blue-500 hover:bg-opacity-30 text-blue-400 rounded-lg flex items-center justify-center transition-colors border border-blue-500/30"
                            title="Yeni Kategori Ekle"
                        >
                            <Plus size={20} />
                        </button>
                    </>
                ) : (
                    <div className="flex-1 flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Yeni kategori adı..."
                            className="flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="p-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg"
                        >
                            <Check size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManager;
