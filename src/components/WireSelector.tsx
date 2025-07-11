import React, { useState, useMemo } from 'react';
import { Wire } from '../types';
import { useWires } from '../hooks/useWires';
import { Cable, Plus, Loader2, AlertCircle, RussianRuble as Ruble, Zap, Search, X } from 'lucide-react';

interface WireSelectorProps {
  onSelect: (wire: Wire, length: number) => void;
  onCancel: () => void;
  templateWorkType?: string;
  templateSalaryGoods?: string;
}

export const WireSelector: React.FC<WireSelectorProps> = ({
  onSelect,
  onCancel,
  templateWorkType = '',
  templateSalaryGoods = ''
}) => {
  const { wires, loading, error, addWire } = useWires();
  const [selectedWire, setSelectedWire] = useState<Wire | null>(null);
  const [length, setLength] = useState<number>(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWire, setNewWire] = useState({
    brand: '',
    cross_section: 1.0,
    insulation_type: 'ПВХ',
    voltage_rating: 660,
    price_per_meter: 0,
    description: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  
  // НОВОЕ состояние для поиска
  const [searchQuery, setSearchQuery] = useState('');

  // НОВАЯ функция фильтрации проводов
  const filteredWires = useMemo(() => {
    if (!searchQuery.trim()) {
      return wires;
    }

    const query = searchQuery.toLowerCase().trim();
    return wires.filter(wire =>
      wire.brand.toLowerCase().includes(query) ||
      wire.cross_section.toString().includes(query) ||
      wire.insulation_type.toLowerCase().includes(query) ||
      wire.voltage_rating.toString().includes(query) ||
      wire.price_per_meter.toString().includes(query) ||
      wire.description.toLowerCase().includes(query)
    );
  }, [wires, searchQuery]);

  const handleSelectWire = () => {
    if (selectedWire && length > 0) {
      onSelect(selectedWire, length);
    }
  };

  const handleAddNewWire = async () => {
    if (!newWire.brand.trim() || newWire.price_per_meter <= 0) return;

    try {
      setIsAdding(true);
      const wireToAdd = await addWire({
        ...newWire,
        brand: newWire.brand.trim(),
        description: newWire.description.trim(),
        is_active: true
      });

      setSelectedWire(wireToAdd);
      setShowAddForm(false);
      setNewWire({
        brand: '',
        cross_section: 1.0,
        insulation_type: 'ПВХ',
        voltage_rating: 660,
        price_per_meter: 0,
        description: ''
      });
    } catch (err) {
      console.error('Error adding wire:', err);
      alert('Ошибка добавления провода');
    } finally {
      setIsAdding(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedWire || length <= 0) return 0;
    return selectedWire.price_per_meter * length;
  };

  // НОВАЯ функция для очистки поиска
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Группируем провода по маркам (только отфильтрованные)
  const wiresByBrand = filteredWires.reduce((acc, wire) => {
    if (!acc[wire.brand]) {
      acc[wire.brand] = [];
    }
    acc[wire.brand].push(wire);
    return acc;
  }, {} as Record<string, Wire[]>);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка проводов...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Ошибка загрузки</span>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Выбор провода из справочника
        </h3>

        {/* Информация о шаблоне */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-1">Создание карточки:</p>
          <p className="text-sm text-blue-700">Статья работ: {templateWorkType}</p>
          <p className="text-sm text-blue-700">Категория: {templateSalaryGoods}</p>
        </div>

        {!showAddForm ? (
          <>
            {/* НОВАЯ строка поиска */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по марке, сечению, изоляции, напряжению..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-1">
                  Найдено: {filteredWires.length} из {wires.length}
                </p>
              )}
            </div>

            {/* Список проводов по маркам */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите провод:
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {Object.keys(wiresByBrand).length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchQuery ? 'Ничего не найдено' : 'Нет доступных проводов'}
                  </div>
                ) : (
                  Object.entries(wiresByBrand).map(([brand, brandWires]) => (
                    <div key={brand} className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded">
                        {brand}
                      </h4>
                      <div className="space-y-1 pl-3">
                        {brandWires.map((wire) => (
                          <div
                            key={wire.id}
                            onClick={() => setSelectedWire(wire)}
                            className={`
                              p-3 rounded-lg cursor-pointer transition-colors border-2
                              ${selectedWire?.id === wire.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Cable className="w-5 h-5 text-gray-600" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {wire.cross_section} мм² • {wire.insulation_type}
                                  </p>
                                  {wire.voltage_rating > 0 && (
                                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                                      <Zap className="w-3 h-3" />
                                      <span>{wire.voltage_rating} В</span>
                                    </div>
                                  )}
                                  {wire.description && (
                                    <p className="text-xs text-gray-500 mt-1">{wire.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-1">
                                  <Ruble className="w-4 h-4 text-green-600" />
                                  <span className="font-bold text-green-600">
                                    {wire.price_per_meter.toLocaleString('ru-RU')}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">за метр</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Кнопка добавления нового провода */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Добавить новый провод</span>
              </button>
            </div>

            {/* Поле для ввода длины */}
            {selectedWire && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Длина (метры):
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите длину в метрах"
                />
                
                {/* Расчет общей суммы */}
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {selectedWire.price_per_meter.toLocaleString('ru-RU')} ₽/м × {length} м =
                    </span>
                    <span className="font-bold text-gray-900">
                      {calculateTotal().toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {selectedWire.brand} {selectedWire.cross_section} мм² • {selectedWire.insulation_type}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Форма добавления нового провода */
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Добавить новый провод</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Марка провода:
                </label>
                <input
                  type="text"
                  value={newWire.brand}
                  onChange={(e) => setNewWire(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Например: ПВ-1, ВВГ, ШВВП"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Сечение (мм²):
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newWire.cross_section}
                    onChange={(e) => setNewWire(prev => ({ ...prev, cross_section: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип изоляции:
                  </label>
                  <select
                    value={newWire.insulation_type}
                    onChange={(e) => setNewWire(prev => ({ ...prev, insulation_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ПВХ">ПВХ</option>
                    <option value="Резина">Резина</option>
                    <option value="Силикон">Силикон</option>
                    <option value="XLPE">XLPE</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Напряжение (В):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newWire.voltage_rating}
                    onChange={(e) => setNewWire(prev => ({ ...prev, voltage_rating: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена за метр (₽):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newWire.price_per_meter}
                    onChange={(e) => setNewWire(prev => ({ ...prev, price_per_meter: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание (необязательно):
                </label>
                <textarea
                  value={newWire.description}
                  onChange={(e) => setNewWire(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Краткое описание провода"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={showAddForm ? () => setShowAddForm(false) : onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showAddForm ? 'Назад' : 'Отмена'}
          </button>
          
          {showAddForm ? (
            <button
              onClick={handleAddNewWire}
              disabled={!newWire.brand.trim() || newWire.price_per_meter <= 0 || isAdding}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isAdding ? 'Добавление...' : 'Добавить'}</span>
            </button>
          ) : (
            <button
              onClick={handleSelectWire}
              disabled={!selectedWire || length <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Создать карточку
            </button>
          )}
        </div>
      </div>
    </div>
  );
};