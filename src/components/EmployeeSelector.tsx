import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { useEmployees } from '../hooks/useEmployees';
import { User, Plus, Loader2, AlertCircle, RussianRuble as Ruble, Search, X } from 'lucide-react';

interface EmployeeSelectorProps {
  onSelect: (employee: Employee, hours: number) => void;
  onCancel: () => void;
  templateWorkType?: string;
  templateSalaryGoods?: string;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  onSelect,
  onCancel,
  templateWorkType = '',
  templateSalaryGoods = ''
}) => {
  const { employees, loading, error, addEmployee } = useEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [hours, setHours] = useState<number>(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRate, setNewEmployeeRate] = useState<number>(300);
  const [newEmployeeDescription, setNewEmployeeDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // НОВОЕ состояние для поиска
  const [searchQuery, setSearchQuery] = useState('');

  // НОВАЯ функция фильтрации сотрудников
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return employees;
    }

    const query = searchQuery.toLowerCase().trim();
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(query) ||
      employee.description.toLowerCase().includes(query) ||
      employee.hourly_rate.toString().includes(query)
    );
  }, [employees, searchQuery]);

  const handleSelectEmployee = () => {
    if (selectedEmployee && hours > 0) {
      onSelect(selectedEmployee, hours);
    }
  };

  const handleAddNewEmployee = async () => {
    if (!newEmployeeName.trim() || newEmployeeRate <= 0) return;

    try {
      setIsAdding(true);
      const newEmployee = await addEmployee({
        name: newEmployeeName.trim(),
        hourly_rate: newEmployeeRate,
        description: newEmployeeDescription.trim(),
        is_active: true
      });

      setSelectedEmployee(newEmployee);
      setShowAddForm(false);
      setNewEmployeeName('');
      setNewEmployeeRate(300);
      setNewEmployeeDescription('');
    } catch (err) {
      console.error('Error adding employee:', err);
      alert('Ошибка добавления сотрудника');
    } finally {
      setIsAdding(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedEmployee || hours <= 0) return 0;
    return selectedEmployee.hourly_rate * hours;
  };

  // НОВАЯ функция для очистки поиска
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка сотрудников...</span>
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
      <div className="bg-white rounded-lg p-6 w-[500px] max-w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Выбор сотрудника из справочника
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
                  placeholder="Поиск по названию, описанию или ставке..."
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
                  Найдено: {filteredEmployees.length} из {employees.length}
                </p>
              )}
            </div>

            {/* Список сотрудников */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите сотрудника:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchQuery ? 'Ничего не найдено' : 'Нет доступных сотрудников'}
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-colors border-2
                        ${selectedEmployee?.id === employee.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">{employee.name}</p>
                            {employee.description && (
                              <p className="text-sm text-gray-600">{employee.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Ruble className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600">
                              {employee.hourly_rate.toLocaleString('ru-RU')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">за час</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Кнопка добавления нового сотрудника */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Добавить нового сотрудника</span>
              </button>
            </div>

            {/* Поле для ввода количества часов */}
            {selectedEmployee && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество часов:
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите количество часов"
                />
                
                {/* Расчет общей суммы */}
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {selectedEmployee.hourly_rate.toLocaleString('ru-RU')} ₽/час × {hours} ч =
                    </span>
                    <span className="font-bold text-gray-900">
                      {calculateTotal().toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Форма добавления нового сотрудника */
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Добавить нового сотрудника</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название должности:
                </label>
                <input
                  type="text"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="Например: Механик"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ставка за час (₽):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={newEmployeeRate}
                  onChange={(e) => setNewEmployeeRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание (необязательно):
                </label>
                <textarea
                  value={newEmployeeDescription}
                  onChange={(e) => setNewEmployeeDescription(e.target.value)}
                  placeholder="Краткое описание обязанностей"
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
              onClick={handleAddNewEmployee}
              disabled={!newEmployeeName.trim() || newEmployeeRate <= 0 || isAdding}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isAdding ? 'Добавление...' : 'Добавить'}</span>
            </button>
          ) : (
            <button
              onClick={handleSelectEmployee}
              disabled={!selectedEmployee || hours <= 0}
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