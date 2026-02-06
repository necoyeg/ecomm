import { useState, useEffect } from 'react';
import './App.css';
import TransactionForm from './components/TransactionForm';
import TransactionTable from './components/TransactionTable';
import SummarySection from './components/SummarySection';
import { Sheet, RefreshCw } from 'lucide-react';

const INITIAL_CATEGORIES = {
  income: ['Sales', 'Reimbursements', 'Interest Income', 'Other'],
  expense: [
    'Advertising',
    'Cost of Goods Sold (COGS)',
    'Office Supplies',
    'Rent',
    'Utilities',
    'Contractors',
    'Software Subscriptions',
    'Travel',
    'Shipping'
  ]
};

function App() {
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch (e) {
      console.error("LocalStorage Error", e);
      return INITIAL_CATEGORIES;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('descriptionHistory') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Updated Hardcoded API URL (v3)
  const scriptUrl = "https://script.google.com/macros/s/AKfycbxrR9OYlnp2cEqU52hW1MWxY82lMNFjFYYiL4oMHYCOi9dWL1kH03IAWQDVat9KUkbWGw/exec";

  const [transactions, setTransactions] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // NEW: Year State
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    try {
      localStorage.setItem('categories', JSON.stringify(categories));
    } catch (e) { }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('descriptionHistory', JSON.stringify(history));
    } catch (e) { }
  }, [history]);

  // Read Data (GET) - Fetches data for selected year (Archive) or fallback to Master
  const fetchTransactions = async (year) => {
    if (!scriptUrl) return;
    setLoading(true);
    try {
      const url = `${scriptUrl}?year=${year || selectedYear}`;
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.warn("API did not return an array:", data);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Years List
  const fetchYears = async () => {
    try {
      const url = `${scriptUrl}?action=getYears`;
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setYears(data);
        // data is sorted NEW -> OLD. So data[0] is likely the latest year.
        // If current selectedYear is NOT in the list, switch to the latest one?
        // Or if the list is empty, we keep default.
        if (!data.includes(selectedYear)) {
          // Optional: Auto-select latest year if current one not found
          // setSelectedYear(data[0]); 
        }
      }
    } catch (err) {
      console.error("Error fetching years:", err);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchYears();
    fetchTransactions(selectedYear);
  }, [selectedYear]);

  const handleAddCategory = (type, newCat) => {
    setCategories(prev => ({
      ...prev,
      [type]: [...prev[type], newCat]
    }));
  };

  const sendToScript = (payload) => {
    // Add YEAR to every payload
    const finalPayload = { ...payload, year: selectedYear };

    return fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(finalPayload)
    });
  };

  const handleTransactionSubmit = async (data) => {
    // Add to history
    if (data.description && !history.includes(data.description)) {
      setHistory(prev => [data.description, ...prev].slice(0, 50));
    }

    setLoading(true);
    try {
      if (editingItem) {
        // UPDATE
        await sendToScript({ ...data, action: 'update', id: editingItem.ID });
        alert("Güncellendi! (Tablo yenileniyor...)");
        setEditingItem(null);
      } else {
        // CREATE
        await sendToScript({ ...data, action: 'create' });
        alert("Kaydedildi! (Tablo yenileniyor...)");
      }
      // Wait a bit for GAS to process before fetching
      setTimeout(() => fetchTransactions(selectedYear), 2500);
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ids) => {
    setLoading(true);
    try {
      await sendToScript({ action: 'delete', ids: ids });
      alert("Silindi! (Tablo yenileniyor...)");
      setTimeout(() => fetchTransactions(selectedYear), 2500);
    } catch (err) {
      alert("Silme hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    const yearToBackup = selectedYear;

    if (!confirm(`Ana veri dosyası "${yearToBackup}" klasörüne YEDEKLENECEK.\nBu işlem "${yearToBackup}" klasöründeki eski yedeğin üzerine yazar.\nEmin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'backup', year: yearToBackup })
      });

      alert(`Yedekleme başarılı.\nAna dosya -> ecomm/${yearToBackup}/data konumuna kopyalandı.`);
    } catch (err) {
      alert("Yedekleme hatası: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    // Grid will update via useEffect dependancy on selectedYear
  };

  const handleCreateNewYear = async () => {
    const newYear = prompt("Yeni Yıl Girin (Örn: 2026):");
    if (!newYear) return;
    if (years.includes(newYear)) {
      alert("Bu yıl zaten listede var.");
      setSelectedYear(newYear);
      return;
    }
    // Optimistically add to list and select it
    // The backend will create the folder/file when we first save data to it.
    setYears(prev => [newYear, ...prev].sort((a, b) => b - a));
    setSelectedYear(newYear);
  };

  console.log("App Rendering...");

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full py-10 px-4">
      <div className="w-full max-w-[98%]">

        <header className="mb-8 text-center bg-slate-800 p-4 rounded-lg relative">
          <div className="inline-block p-3 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-2xl">
            <h1 className="text-3xl m-0 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              YEGEN LLC
            </h1>
          </div>
          <p className="text-slate-400">E-ticaret Finans Yönetimi v3</p>

          {/* Year Selector */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 font-bold uppercase mr-1">Yedek Yılı:</span>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="bg-slate-700 text-white p-2 rounded border border-slate-600 outline-none focus:border-blue-400"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
              {/* Fallback if list is empty or selected not in list */}
              {!years.includes(selectedYear) && <option value={selectedYear}>{selectedYear}</option>}
            </select>
            <button
              onClick={handleCreateNewYear}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm font-bold"
              title="Yeni Yıl Ekle"
            >
              +
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <TransactionForm
              categories={categories}
              onAddCategory={handleAddCategory}
              onSubmit={handleTransactionSubmit}
              history={history}
              initialData={editingItem}
              onCancel={() => setEditingItem(null)}
            />
          </div>

          {/* Table Section */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Aktif Veri Tabanı
                </h2>
                <span className="text-xs text-green-400">
                  {years.includes(selectedYear) ? `Arşiv Modu (${selectedYear})` : 'ecomm/data (Canlı)'}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => fetchTransactions(selectedYear)}
                  disabled={loading}
                  className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50"
                  title="Yenile"
                >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleBackup}
                  disabled={loading}
                  className="ml-2 p-2 bg-green-600 rounded-lg text-white hover:bg-green-500 disabled:opacity-50 text-sm font-bold"
                >
                  Yedekle
                </button>
              </div>
            </div>

            <TransactionTable
              transactions={transactions}
              onEdit={setEditingItem}
              onDelete={handleDelete}
            />

            <SummarySection transactions={transactions} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
