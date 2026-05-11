import { Bell, Battery, Clock, Save, Droplet } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const [batteryThreshold, setBatteryThreshold] = useState(20);
  const [waterLevelThreshold, setWaterLevelThreshold] = useState(10);
  const [updateInterval, setUpdateInterval] = useState(5);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    // Save settings logic here
    alert('Ustawienia zapisane!');
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2 text-slate-800">Ustawienia</h1>
          <p className="text-slate-600">Konfiguracja systemu i powiadomień</p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl text-slate-800">Powiadomienia</h2>
                <p className="text-sm text-slate-500">Zarządzaj alertami i notyfikacjami</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="text-slate-800">Włącz powiadomienia</div>
                <div className="text-sm text-slate-500">Otrzymuj alerty o ważnych zdarzeniach</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* Thresholds */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Battery className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl text-slate-800">Progi alertów</h2>
                <p className="text-sm text-slate-500">Ustaw minimalne wartości dla powiadomień</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Battery Threshold */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-700">Próg poziomu baterii</label>
                  <span className="text-2xl text-green-600">{batteryThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={batteryThreshold}
                  onChange={(e) => setBatteryThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Otrzymasz alert gdy bateria spadnie poniżej tej wartości
                </p>
              </div>

              {/* Water Level Threshold */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-700">Próg poziomu wody</label>
                  <span className="text-2xl text-blue-600">{waterLevelThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={waterLevelThreshold}
                  onChange={(e) => setWaterLevelThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Otrzymasz alert gdy poziom wody spadnie poniżej tej wartości
                </p>
              </div>
            </div>
          </div>

          {/* Update Interval */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl text-slate-800">Częstotliwość odczytów</h2>
                <p className="text-sm text-slate-500">Jak często zbierać dane z czujników</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-700">Interwał aktualizacji</label>
                <span className="text-2xl text-blue-600">{updateInterval} min</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={updateInterval}
                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-sm text-slate-500 mt-2">
                Dane będą aktualizowane co {updateInterval} {updateInterval === 1 ? 'minutę' : 'minut'}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-shadow"
          >
            <Save className="w-5 h-5" />
            Zapisz ustawienia
          </button>
        </div>
      </div>
    </div>
  );
}
