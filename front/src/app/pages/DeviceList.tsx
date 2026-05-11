import { Droplet, Battery, Signal, Plus, FolderPlus, ChevronRight, Settings as SettingsIcon, X, Waves, Play, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Device {
  device_id: string;
  name: string;
  water_duration_sec: number;
  created_at: string;
  moisture_lvl: number | null;
  battery_lvl: number | null;
  water_lvl: number | null;
  last_seen: string | null;
}

interface DeviceGroup {
  id: string;
  name: string;
  moistureThreshold: number;
  wateringDuration: number;
}

export default function DeviceList() {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState<string | null>(null);
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch('/api/v1/devices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Błąd pobierania urządzeń');
        setDevices(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [token]);

  const getStatusColor = (last_seen: string | null) => {
    if (!last_seen) return 'bg-slate-100 text-slate-500';
    const diffMin = (Date.now() - new Date(last_seen).getTime()) / 60000;
    return diffMin < 15
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-red-100 text-red-700';
  };

  const getStatusLabel = (last_seen: string | null) => {
    if (!last_seen) return 'Brak danych';
    const diffMin = (Date.now() - new Date(last_seen).getTime()) / 60000;
    return diffMin < 15 ? 'Online' : 'Offline';
  };

  const getMoistureColor = (level: number | null) => {
    if (level === null) return 'text-slate-400';
    if (level >= 60) return 'text-blue-600';
    if (level >= 30) return 'text-orange-500';
    return 'text-red-600';
  };

  const getBatteryColor = (level: number | null) => {
    if (level === null) return 'text-slate-400';
    if (level >= 60) return 'text-green-600';
    if (level >= 30) return 'text-orange-500';
    return 'text-red-600';
  };

  const handleForceWatering = async (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    if (!confirm(`Czy na pewno chcesz wymusić podlewanie dla urządzenia ${deviceId}?`)) return;
    try {
      const res = await fetch(`/api/v1/devices/${deviceId}/water`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd wysyłania komendy');
      alert('Komenda podlewania wysłana!');
    } catch (e: any) {
      alert(`Błąd: ${e.message}`);
    }
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: DeviceGroup = {
        id: `GROUP-${Date.now()}`,
        name: newGroupName,
        moistureThreshold: 30,
        wateringDuration: 10
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setShowGroupModal(false);
      setShowGroupSettings(newGroup.id);
    }
  };

  const handleSaveGroupSettings = (groupId: string, moistureThreshold: number, wateringDuration: number) => {
    setGroups(groups.map(g =>
      g.id === groupId
        ? { ...g, moistureThreshold, wateringDuration }
        : g
    ));
    setShowGroupSettings(null);
  };

  const GroupSettingsModal = ({ group }: { group: DeviceGroup }) => {
    const [moisture, setMoisture] = useState(group.moistureThreshold);
    const [duration, setDuration] = useState(group.wateringDuration);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-slate-800">Ustawienia grupy: {group.name}</h2>
              <button onClick={() => setShowGroupSettings(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-700">Próg wilgotności gleby</label>
                  <span className="text-2xl text-blue-600">{moisture}%</span>
                </div>
                <input type="range" min="0" max="100" value={moisture}
                  onChange={(e) => setMoisture(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-700">Czas podlewania</label>
                  <span className="text-2xl text-blue-600">{duration}s</span>
                </div>
                <input type="range" min="1" max="60" value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <button
                onClick={() => handleSaveGroupSettings(group.id, moisture, duration)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-shadow"
              >
                Zapisz ustawienia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const onlineCount = devices.filter(d => getStatusLabel(d.last_seen) === 'Online').length;
  const attentionCount = devices.filter(d => (d.battery_lvl ?? 100) < 30 || (d.moisture_lvl ?? 100) < 30).length;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2 text-slate-800">Urządzenia</h1>
            <p className="text-slate-600">Zarządzaj wszystkimi czujnikami</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl hover:shadow-lg transition-shadow"
            >
              <FolderPlus className="w-5 h-5" />
              Nowa grupa
            </button>
            <button
              onClick={() => navigate('/devices/new')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-shadow">
              <Plus className="w-5 h-5" />
              Dodaj urządzenie
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Wszystkie urządzenia</div>
            <div className="text-3xl text-slate-800">{devices.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Online</div>
            <div className="text-3xl text-emerald-600">{onlineCount}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Wymagają uwagi</div>
            <div className="text-3xl text-orange-600">{attentionCount}</div>
          </div>
        </div>

        {/* Groups */}
        {groups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl text-slate-800 mb-4">Grupy urządzeń</h2>
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <FolderPlus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg text-slate-800">{group.name}</h3>
                        <p className="text-sm text-slate-500">
                          Próg: {group.moistureThreshold}% • Czas: {group.wateringDuration}s
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowGroupSettings(group.id)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <SettingsIcon className="w-5 h-5" />
                      Ustawienia
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device List */}
        <h2 className="text-2xl text-slate-800 mb-4">Wszystkie urządzenia</h2>

        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            Ładowanie urządzeń…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!loading && !error && devices.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            Brak zarejestrowanych urządzeń.
          </div>
        )}

        <div className="space-y-4">
          {devices.map((device) => (
            <div
              key={device.device_id}
              onClick={() => navigate(`/devices/${device.device_id}`)}
              className="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Signal className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg text-slate-800">{device.name}</h3>
                    <p className="text-sm text-slate-500">{device.device_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(device.last_seen)}`}>
                    {getStatusLabel(device.last_seen)}
                  </span>
                  {device.last_seen && (
                    <span className="text-sm text-slate-500">
                      {new Date(device.last_seen).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Droplet className={`w-5 h-5 ${getMoistureColor(device.moisture_lvl)}`} />
                  <div>
                    <div className="text-xs text-slate-500">Wilgotność</div>
                    <div className={`text-lg ${getMoistureColor(device.moisture_lvl)}`}>
                      {device.moisture_lvl !== null ? `${device.moisture_lvl}%` : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Battery className={`w-5 h-5 ${getBatteryColor(device.battery_lvl)}`} />
                  <div>
                    <div className="text-xs text-slate-500">Bateria</div>
                    <div className={`text-lg ${getBatteryColor(device.battery_lvl)}`}>
                      {device.battery_lvl !== null ? `${device.battery_lvl}%` : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Waves className={`w-5 h-5 ${getMoistureColor(device.water_lvl)}`} />
                  <div>
                    <div className="text-xs text-slate-500">Poziom wody</div>
                    <div className={`text-lg ${getMoistureColor(device.water_lvl)}`}>
                      {device.water_lvl !== null ? `${device.water_lvl}%` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-start">
                <button
                  onClick={(e) => handleForceWatering(e, device.device_id)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow transition-shadow"
                >
                  <Play className="w-4 h-4" />
                  Wymuś podlewanie
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-slate-800">Nowa grupa urządzeń</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-slate-700 mb-2">Nazwa grupy</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Wprowadź nazwę grupy"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
            </div>
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Utwórz grupę
            </button>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && (
        <GroupSettingsModal group={groups.find(g => g.id === showGroupSettings)!} />
      )}
    </div>
  );
}
