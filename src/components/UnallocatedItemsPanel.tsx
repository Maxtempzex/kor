import React, { useState, useMemo, useEffect } from 'react';
import { RepairItem, GroupedRepairItem, Employee, Wire, Motor, Bearing } from '../types';
import { GroupedRepairItemCard } from './GroupedRepairItemCard';
import { EmployeeSelector } from './EmployeeSelector';
import { WireSelector } from './WireSelector';
import { MotorSelector } from './MotorSelector';
import { BearingSelector } from './BearingSelector';
import { groupByBasePositionName } from '../utils/groupingUtils';
import { Package2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Minimize2, Maximize2, TrendingUp, TrendingDown, RussianRuble as Ruble, Plus } from 'lucide-react';

interface UnallocatedItemsPanelProps {
  items: RepairItem[];
  onDragStart: (item: GroupedRepairItem) => void;
  onDrop: () => void;
  onDragOver: (e: React.DragEvent) => void;
  draggedItem: GroupedRepairItem | null;
  draggedFromPositionId: string | null;
  searchQuery?: string;
  totalUnallocatedCount?: number;
  onIncreaseQuantity: (item: GroupedRepairItem) => void;
  onCreatePositionFromGroup?: (item: GroupedRepairItem) => void;
  onAddNewItem?: (templateItem: RepairItem, newName: string) => void;
  onAddEmployeeItem?: (templateItem: RepairItem, employee: Employee, hours: number) => void;
  onAddWireItem?: (templateItem: RepairItem, wire: Wire, length: number) => void;
  onAddMotorItem?: (templateItem: RepairItem, motor: Motor, quantity: number) => void;
  onAddBearingItem?: (templateItem: RepairItem, bearing: Bearing, quantity: number) => void;
}

interface SalaryGoodsGroup {
  salaryGoods: string;
  workTypeGroups: WorkTypeGroup[];
  isCollapsed: boolean;
}

interface WorkTypeGroup {
  workType: string;
  items: GroupedRepairItem[];
  isCollapsed: boolean;
}

// НОВАЯ структура шаблонных групп для пустого состояния
interface TemplateGroup {
  salaryGoods: string;
  workTypes: string[];
}

// НОВЫЕ шаблонные группы, которые показываются когда нет данных
const DEFAULT_TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    salaryGoods: 'Двигатель',
    workTypes: ['1. Ремонт двигателя стандарт', '2. Замены расходников']
  },
  {
    salaryGoods: 'Зарплата',
    workTypes: ['1. Ремонт двигателя стандарт', '2. Замены расходников']
  },
  {
    salaryGoods: 'Провод',
    workTypes: ['1. Ремонт двигателя стандарт', '2. Замены расходников']
  }
];

export const UnallocatedItemsPanel: React.FC<UnallocatedItemsPanelProps> = ({
  items,
  onDragStart,
  onDrop,
  onDragOver,
  draggedItem,
  draggedFromPositionId,
  searchQuery = '',
  totalUnallocatedCount = 0,
  onIncreaseQuantity,
  onCreatePositionFromGroup,
  onAddNewItem,
  onAddEmployeeItem,
  onAddWireItem,
  onAddMotorItem,
  onAddBearingItem
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // ИСПРАВЛЕНИЕ: Автоматически сворачиваем все группы при появлении новых данных
  const [collapsedSalaryGoods, setCollapsedSalaryGoods] = useState<Set<string>>(new Set());
  const [collapsedWorkTypes, setCollapsedWorkTypes] = useState<Set<string>>(new Set());

  // Состояние для модального окна добавления новой карточки
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTemplateItem, setSelectedTemplateItem] = useState<RepairItem | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Состояние для выбора сотрудника
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [employeeTemplateItem, setEmployeeTemplateItem] = useState<RepairItem | null>(null);

  // Состояние для выбора провода
  const [showWireSelector, setShowWireSelector] = useState(false);
  const [wireTemplateItem, setWireTemplateItem] = useState<RepairItem | null>(null);

  // НОВОЕ состояние для выбора двигателя
  const [showMotorSelector, setShowMotorSelector] = useState(false);
  const [motorTemplateItem, setMotorTemplateItem] = useState<RepairItem | null>(null);

  // НОВОЕ состояние для выбора подшипника
  const [showBearingSelector, setShowBearingSelector] = useState(false);
  const [bearingTemplateItem, setBearingTemplateItem] = useState<RepairItem | null>(null);

  // Эффект для автоматического сворачивания всех групп при импорте данных
  useEffect(() => {
    if (items.length > 0) {
      // Получаем все уникальные группы "Зарплата/Товары"
      const salaryGoodsSet = new Set<string>();
      const workTypeSet = new Set<string>();
      
      items.forEach(item => {
        const salaryGoods = item.salaryGoods.trim();
        const workType = item.workType.trim() || 'Без статьи работ';
        
        if (salaryGoods) {
          salaryGoodsSet.add(salaryGoods);
          workTypeSet.add(`${salaryGoods}_${workType}`);
        }
      });
      
      // Автоматически сворачиваем все группы при появлении данных
      setCollapsedSalaryGoods(salaryGoodsSet);
      setCollapsedWorkTypes(workTypeSet);
    } else {
      // НОВОЕ: Если данных нет, автоматически сворачиваем шаблонные группы
      const templateSalaryGoodsSet = new Set(DEFAULT_TEMPLATE_GROUPS.map(g => g.salaryGoods));
      const templateWorkTypeSet = new Set<string>();
      
      DEFAULT_TEMPLATE_GROUPS.forEach(group => {
        group.workTypes.forEach(workType => {
          templateWorkTypeSet.add(`${group.salaryGoods}_${workType}`);
        });
      });
      
      setCollapsedSalaryGoods(templateSalaryGoodsSet);
      setCollapsedWorkTypes(templateWorkTypeSet);
    }
  }, [items.length]); // Срабатывает при изменении количества элементов

  // НОВАЯ функция для создания шаблонного элемента
  const createTemplateItem = (salaryGoods: string, workType: string): RepairItem => {
    const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: templateId,
      uniqueKey: `template-${salaryGoods.toLowerCase()}-${workType.toLowerCase()}`,
      positionName: `Шаблон ${workType}_ID_${templateId}`,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      quarter: `${Math.ceil((new Date().getMonth() + 1) / 3)}кв`,
      date: new Date().toISOString().split('T')[0],
      analytics1: '',
      analytics2: '',
      analytics3: '',
      analytics4: '',
      analytics5: '',
      analytics6: '',
      analytics7: '',
      analytics8: workType,
      debitAccount: '',
      creditAccount: '',
      revenue: 0,
      quantity: 1,
      sumWithoutVAT: 0,
      vatAmount: 0,
      workType: workType,
      incomeExpenseType: 'Доходы',
      salaryGoods: salaryGoods
    };
  };

  // Группируем по Зарплата/Товары -> Статья работ -> Базовое название позиции
  const groupedItems = useMemo(() => {
    // НОВАЯ ЛОГИКА: Если есть реальные данные, используем их, иначе показываем шаблоны
    if (items.length > 0) {
      // Используем функцию группировки по базовому названию
      const baseGrouped = groupByBasePositionName(items);
      
      const salaryGoodsGroups: SalaryGoodsGroup[] = [];
      const itemsWithoutSalaryGoods: GroupedRepairItem[] = [];

      // Группируем по Зарплата/Товары
      const salaryGoodsMap = new Map<string, GroupedRepairItem[]>();
      
      baseGrouped.forEach(item => {
        const salaryGoods = item.salaryGoods.trim();
        if (salaryGoods) {
          if (!salaryGoodsMap.has(salaryGoods)) {
            salaryGoodsMap.set(salaryGoods, []);
          }
          salaryGoodsMap.get(salaryGoods)!.push(item);
        } else {
          itemsWithoutSalaryGoods.push(item);
        }
      });

      // Создаем группы Зарплата/Товары
      salaryGoodsMap.forEach((salaryGoodsItems, salaryGoods) => {
        // Внутри каждой группы Зарплата/Товары группируем по статье работ
        const workTypeMap = new Map<string, GroupedRepairItem[]>();
        
        salaryGoodsItems.forEach(item => {
          const workType = item.workType.trim();
          const key = workType || 'Без статьи работ';
          if (!workTypeMap.has(key)) {
            workTypeMap.set(key, []);
          }
          workTypeMap.get(key)!.push(item);
        });

        // Создаем группы статей работ
        const workTypeGroups: WorkTypeGroup[] = [];
        
        workTypeMap.forEach((workTypeItems, workType) => {
          workTypeGroups.push({
            workType,
            items: workTypeItems,
            isCollapsed: collapsedWorkTypes.has(`${salaryGoods}_${workType}`)
          });
        });

        // Сортируем статьи работ по названию
        workTypeGroups.sort((a, b) => a.workType.localeCompare(b.workType, 'ru'));

        salaryGoodsGroups.push({
          salaryGoods,
          workTypeGroups,
          isCollapsed: collapsedSalaryGoods.has(salaryGoods)
        });
      });

      // Сортируем группы Зарплата/Товары по названию
      salaryGoodsGroups.sort((a, b) => a.salaryGoods.localeCompare(b.salaryGoods, 'ru'));

      return { salaryGoodsGroups, itemsWithoutSalaryGoods };
    } else {
      // НОВАЯ ЛОГИКА: Показываем шаблонные группы когда нет данных
      const templateSalaryGoodsGroups: SalaryGoodsGroup[] = DEFAULT_TEMPLATE_GROUPS.map(templateGroup => ({
        salaryGoods: templateGroup.salaryGoods,
        workTypeGroups: templateGroup.workTypes.map(workType => ({
          workType,
          items: [], // Пустой массив для шаблонов
          isCollapsed: collapsedWorkTypes.has(`${templateGroup.salaryGoods}_${workType}`)
        })),
        isCollapsed: collapsedSalaryGoods.has(templateGroup.salaryGoods)
      }));

      return { 
        salaryGoodsGroups: templateSalaryGoodsGroups, 
        itemsWithoutSalaryGoods: [] 
      };
    }
  }, [items, collapsedSalaryGoods, collapsedWorkTypes]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const toggleSalaryGoodsCollapse = (salaryGoods: string) => {
    const newCollapsedSalaryGoods = new Set(collapsedSalaryGoods);
    if (newCollapsedSalaryGoods.has(salaryGoods)) {
      newCollapsedSalaryGoods.delete(salaryGoods);
    } else {
      newCollapsedSalaryGoods.add(salaryGoods);
    }
    setCollapsedSalaryGoods(newCollapsedSalaryGoods);
  };

  const toggleWorkTypeCollapse = (salaryGoods: string, workType: string) => {
    const key = `${salaryGoods}_${workType}`;
    const newCollapsedWorkTypes = new Set(collapsedWorkTypes);
    if (newCollapsedWorkTypes.has(key)) {
      newCollapsedWorkTypes.delete(key);
    } else {
      newCollapsedWorkTypes.add(key);
    }
    setCollapsedWorkTypes(newCollapsedWorkTypes);
  };

  // Функция для сворачивания/разворачивания всех групп
  const toggleAllGroups = () => {
    const allSalaryGoods = groupedItems.salaryGoodsGroups.map(group => group.salaryGoods);
    
    if (collapsedSalaryGoods.size === allSalaryGoods.length) {
      // Если все группы свернуты, разворачиваем все
      setCollapsedSalaryGoods(new Set());
    } else {
      // Иначе сворачиваем все
      setCollapsedSalaryGoods(new Set(allSalaryGoods));
    }
  };

  // Функция для открытия модального окна добавления новой карточки
  const handleAddNewItem = (templateItem: RepairItem) => {
    setSelectedTemplateItem(templateItem);
    setNewItemName('');
    setShowAddModal(true);
  };

  // НОВАЯ функция для создания шаблонной карточки на основе группы
  const handleAddNewItemFromTemplate = (salaryGoods: string, workType: string) => {
    const templateItem = createTemplateItem(salaryGoods, workType);
    setSelectedTemplateItem(templateItem);
    setNewItemName('');
    setShowAddModal(true);
  };

  // Функция для создания новой карточки
  const handleCreateNewItem = () => {
    if (!selectedTemplateItem || !newItemName.trim()) return;
    
    if (onAddNewItem) {
      onAddNewItem(selectedTemplateItem, newItemName.trim());
    }
    
    setShowAddModal(false);
    setSelectedTemplateItem(null);
    setNewItemName('');
  };

  // Функция для отмены создания новой карточки
  const handleCancelAddItem = () => {
    setShowAddModal(false);
    setSelectedTemplateItem(null);
    setNewItemName('');
  };

  // Функция для открытия выбора сотрудника
  const handleAddEmployeeItem = (templateItem: RepairItem) => {
    setEmployeeTemplateItem(templateItem);
    setShowEmployeeSelector(true);
  };

  // НОВАЯ функция для создания карточки сотрудника из шаблона
  const handleAddEmployeeItemFromTemplate = (salaryGoods: string, workType: string) => {
    const templateItem = createTemplateItem(salaryGoods, workType);
    setEmployeeTemplateItem(templateItem);
    setShowEmployeeSelector(true);
  };

  // Функция для создания карточки сотрудника
  const handleEmployeeSelected = (employee: Employee, hours: number) => {
    if (!employeeTemplateItem || !onAddEmployeeItem) return;
    
    onAddEmployeeItem(employeeTemplateItem, employee, hours);
    setShowEmployeeSelector(false);
    setEmployeeTemplateItem(null);
  };

  // Функция для отмены выбора сотрудника
  const handleCancelEmployeeSelection = () => {
    setShowEmployeeSelector(false);
    setEmployeeTemplateItem(null);
  };

  // Функция для открытия выбора провода
  const handleAddWireItem = (templateItem: RepairItem) => {
    setWireTemplateItem(templateItem);
    setShowWireSelector(true);
  };

  // НОВАЯ функция для создания карточки провода из шаблона
  const handleAddWireItemFromTemplate = (salaryGoods: string, workType: string) => {
    const templateItem = createTemplateItem(salaryGoods, workType);
    setWireTemplateItem(templateItem);
    setShowWireSelector(true);
  };

  // Функция для создания карточки провода
  const handleWireSelected = (wire: Wire, length: number) => {
    if (!wireTemplateItem || !onAddWireItem) return;
    
    onAddWireItem(wireTemplateItem, wire, length);
    setShowWireSelector(false);
    setWireTemplateItem(null);
  };

  // Функция для отмены выбора провода
  const handleCancelWireSelection = () => {
    setShowWireSelector(false);
    setWireTemplateItem(null);
  };

  // НОВЫЕ функции для работы с двигателями
  const handleAddMotorItem = (templateItem: RepairItem) => {
    setMotorTemplateItem(templateItem);
    setShowMotorSelector(true);
  };

  // НОВАЯ функция для создания карточки двигателя из шаблона
  const handleAddMotorItemFromTemplate = (salaryGoods: string, workType: string) => {
    const templateItem = createTemplateItem(salaryGoods, workType);
    setMotorTemplateItem(templateItem);
    setShowMotorSelector(true);
  };

  const handleMotorSelected = (motor: Motor, quantity: number) => {
    if (!motorTemplateItem || !onAddMotorItem) return;
    
    onAddMotorItem(motorTemplateItem, motor, quantity);
    setShowMotorSelector(false);
    setMotorTemplateItem(null);
  };

  const handleCancelMotorSelection = () => {
    setShowMotorSelector(false);
    setMotorTemplateItem(null);
  };

  // НОВЫЕ функции для работы с подшипниками
  const handleAddBearingItem = (templateItem: RepairItem) => {
    setBearingTemplateItem(templateItem);
    setShowBearingSelector(true);
  };

  // НОВАЯ функция для создания карточки подшипника из шаблона
  const handleAddBearingItemFromTemplate = (salaryGoods: string, workType: string) => {
    const templateItem = createTemplateItem(salaryGoods, workType);
    setBearingTemplateItem(templateItem);
    setShowBearingSelector(true);
  };

  const handleBearingSelected = (bearing: Bearing, quantity: number) => {
    if (!bearingTemplateItem || !onAddBearingItem) return;
    
    onAddBearingItem(bearingTemplateItem, bearing, quantity);
    setShowBearingSelector(false);
    setBearingTemplateItem(null);
  };

  const handleCancelBearingSelection = () => {
    setShowBearingSelector(false);
    setBearingTemplateItem(null);
  };

  // Функция для получения доходов и расходов из группы
  const getIncomeExpenseFromGroup = (groupedItem: GroupedRepairItem, originalItems: RepairItem[]) => {
    // Находим все исходные элементы группы
    const groupItems = originalItems.filter(item => groupedItem.groupedIds.includes(item.id));
    
    const incomeItems = groupItems.filter(item => item.incomeExpenseType === 'Доходы');
    const expenseItems = groupItems.filter(item => item.incomeExpenseType === 'Расходы');
    
    const totalIncome = incomeItems.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpense = expenseItems.reduce((sum, item) => sum + Math.abs(item.revenue), 0);
    
    return {
      incomeItems,
      expenseItems,
      totalIncome,
      totalExpense,
      hasIncome: incomeItems.length > 0,
      hasExpense: expenseItems.length > 0
    };
  };

  // ИСПРАВЛЕННАЯ функция для проверки, нужно ли показывать кнопку провода
  const shouldShowWireButton = (salaryGoods: string): boolean => {
    const lowerSalaryGoods = salaryGoods.toLowerCase();
    // Проверяем на различные варианты названий для материалов/товаров/проводов
    return lowerSalaryGoods.includes('товар') || 
           lowerSalaryGoods.includes('провод') || 
           lowerSalaryGoods.includes('материал') ||
           lowerSalaryGoods.includes('комплектующ');
  };

  // ИСПРАВЛЕННАЯ функция для проверки, нужно ли показывать кнопку двигателя
  // Теперь проверяем И категорию (salaryGoods), И статью работ (workType)
  const shouldShowMotorButton = (salaryGoods: string, workType: string): boolean => {
    const lowerSalaryGoods = salaryGoods.toLowerCase();
    const lowerWorkType = workType.toLowerCase();
    
    // Показываем кнопку двигателя ТОЛЬКО если:
    // 1. Категория содержит "двигатель" ИЛИ
    // 2. Статья работ содержит "ремонт двигателя" или "стандарт" (но НЕ "замен")
    const isDvigatelCategory = lowerSalaryGoods.includes('двигатель') || 
                               lowerSalaryGoods.includes('мотор') || 
                               lowerSalaryGoods.includes('электродвигатель');
    
    const isMotorRepairWork = lowerWorkType.includes('ремонт') && 
                              lowerWorkType.includes('двигател') &&
                              !lowerWorkType.includes('замен'); // ИСКЛЮЧАЕМ "замены"
    
    const isStandardWork = lowerWorkType.includes('стандарт') &&
                           !lowerWorkType.includes('замен'); // ИСКЛЮЧАЕМ "замены"
    
    return isDvigatelCategory && (isMotorRepairWork || isStandardWork);
  };

  // НОВАЯ функция для проверки, нужно ли показывать кнопку подшипника
  const shouldShowBearingButton = (workType: string): boolean => {
    const lowerWorkType = workType.toLowerCase();
    // Проверяем на различные варианты названий для замены расходников/подшипников
    return lowerWorkType.includes('замен') || 
           lowerWorkType.includes('расходник') || 
           lowerWorkType.includes('подшипник') ||
           lowerWorkType.includes('комплектующ');
  };

  const canReceiveDrop = draggedItem !== null && draggedFromPositionId !== null;
  const hasSearchFilter = searchQuery.trim() !== '';
  const displayCount = hasSearchFilter ? items.length : totalUnallocatedCount || items.length;

  // Подсчитываем общее количество сгруппированных элементов
  const totalGroupedItems = groupedItems.salaryGoodsGroups.reduce((sum, salaryGroup) => 
    sum + salaryGroup.workTypeGroups.reduce((workSum, workGroup) => workSum + workGroup.items.length, 0), 0
  ) + groupedItems.itemsWithoutSalaryGoods.length;

  // Проверяем, есть ли группы для отображения кнопки
  const hasGroups = groupedItems.salaryGoodsGroups.length > 0;
  const allGroupsCollapsed = collapsedSalaryGoods.size === groupedItems.salaryGoodsGroups.length;

  // НОВАЯ переменная для определения, показываем ли шаблоны
  const isShowingTemplates = items.length === 0;

  return (
    <div className={`
      bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0
      ${isCollapsed ? 'w-12' : 'w-96'}
    `}>
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        {!isCollapsed && (
          <>
            <div className="flex items-center space-x-2">
              <Package2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isShowingTemplates ? 'Создание позиций' : 'Неразмещенные позиции'}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              {hasSearchFilter && items.length !== totalUnallocatedCount && (
                <span className="text-xs text-gray-500">
                  {items.length}/{totalUnallocatedCount}
                </span>
              )}
              {!isShowingTemplates && (
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                  {displayCount}
                </div>
              )}
              {!isShowingTemplates && totalGroupedItems !== items.length && (
                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  {totalGroupedItems}
                </div>
              )}
              {/* Кнопка сворачивания всех групп */}
              {hasGroups && (
                <button
                  onClick={toggleAllGroups}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title={allGroupsCollapsed ? 'Развернуть все группы' : 'Свернуть все группы'}
                >
                  {allGroupsCollapsed ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrollable Content */}
      {!isCollapsed && (
        <div
          className={`
            flex-1 p-4 overflow-y-auto min-h-0 transition-all duration-200
            ${isDragOver && canReceiveDrop ? 'bg-red-50' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isDragOver && canReceiveDrop && (
            <div className="border-2 border-red-400 border-dashed rounded-lg p-4 bg-red-50 text-center mb-3">
              <p className="text-red-600 font-medium">Отпустите для возврата в неразмещенные</p>
            </div>
          )}
          
          {/* НОВОЕ: Показываем разные сообщения для шаблонов и пустого состояния */}
          {items.length === 0 && !isDragOver && !isShowingTemplates ? (
            <div className="text-center py-8">
              <Package2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {hasSearchFilter ? 'Ничего не найдено' : 'Все позиции размещены'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* НОВОЕ: Показываем подсказку для шаблонного режима */}
              {isShowingTemplates && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-1">Создание позиций из справочников</p>
                  <p className="text-xs text-blue-700">
                    Используйте кнопки + для создания карточек из справочников сотрудников, проводов, двигателей и подшипников
                  </p>
                </div>
              )}

              {/* Группы по Зарплата/Товары */}
              {groupedItems.salaryGoodsGroups.map((salaryGoodsGroup) => (
                <div key={salaryGoodsGroup.salaryGoods} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Заголовок группы Зарплата/Товары */}
                  <button
                    onClick={() => toggleSalaryGoodsCollapse(salaryGoodsGroup.salaryGoods)}
                    className="w-full px-3 py-2 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-indigo-900 text-sm">
                        {salaryGoodsGroup.salaryGoods}
                      </span>
                      {!isShowingTemplates && (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-medium">
                          {salaryGoodsGroup.workTypeGroups.reduce((sum, wg) => sum + wg.items.length, 0)}
                        </span>
                      )}
                    </div>
                    {salaryGoodsGroup.isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-indigo-500" />
                    )}
                  </button>
                  
                  {/* Группы по статье работ внутри Зарплата/Товары */}
                  {!salaryGoodsGroup.isCollapsed && (
                    <div className="bg-white">
                      {salaryGoodsGroup.workTypeGroups.map((workTypeGroup) => (
                        <div key={`${salaryGoodsGroup.salaryGoods}_${workTypeGroup.workType}`} className="border-b border-gray-200 last:border-b-0">
                          {/* Заголовок статьи работ с кнопками добавления */}
                          <div className="w-full pl-6 pr-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors">
                            <button
                              onClick={() => toggleWorkTypeCollapse(salaryGoodsGroup.salaryGoods, workTypeGroup.workType)}
                              className="flex items-center space-x-2 flex-1"
                            >
                              <span className="font-medium text-gray-900 text-sm">
                                {workTypeGroup.workType}
                              </span>
                              {!isShowingTemplates && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                  {workTypeGroup.items.length}
                                </span>
                              )}
                            </button>
                            
                            <div className="flex items-center space-x-2">
                              {/* НОВЫЕ кнопки для шаблонного режима */}
                              {isShowingTemplates ? (
                                <>
                                  {/* Кнопка добавления обычной карточки */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddNewItemFromTemplate(salaryGoodsGroup.salaryGoods, workTypeGroup.workType);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title="Добавить новую карточку"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Кнопка добавления карточки сотрудника (только для зарплаты) */}
                                  {salaryGoodsGroup.salaryGoods.toLowerCase().includes('зарплата') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddEmployeeItemFromTemplate(salaryGoodsGroup.salaryGoods, workTypeGroup.workType);
                                      }}
                                      className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                      title="Добавить сотрудника из справочника"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Кнопка добавления карточки провода */}
                                  {shouldShowWireButton(salaryGoodsGroup.salaryGoods) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddWireItemFromTemplate(salaryGoodsGroup.salaryGoods, workTypeGroup.workType);
                                      }}
                                      className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                      title="Добавить провод из справочника"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Кнопка добавления карточки двигателя */}
                                  {shouldShowMotorButton(salaryGoodsGroup.salaryGoods, workTypeGroup.workType) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddMotorItemFromTemplate(salaryGoodsGroup.salaryGoods, workTypeGroup.workType);
                                      }}
                                      className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                                      title="Добавить двигатель из справочника"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* Кнопка добавления карточки подшипника */}
                                  {shouldShowBearingButton(workTypeGroup.workType) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddBearingItemFromTemplate(salaryGoodsGroup.salaryGoods, workTypeGroup.workType);
                                      }}
                                      className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                                      title="Добавить подшипник из справочника"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                /* Кнопки для режима с данными */
                                workTypeGroup.items.length > 0 && (
                                  <>
                                    {/* Кнопка добавления обычной карточки */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Берем первый элемент группы как шаблон
                                        const templateItem = items.find(item => 
                                          workTypeGroup.items[0].groupedIds.includes(item.id)
                                        );
                                        if (templateItem) {
                                          handleAddNewItem(templateItem);
                                        }
                                      }}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                      title="Добавить новую карточку в эту группу"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Кнопка добавления карточки сотрудника (только для зарплаты) */}
                                    {salaryGoodsGroup.salaryGoods.toLowerCase().includes('зарплата') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Берем первый элемент группы как шаблон
                                          const templateItem = items.find(item => 
                                            workTypeGroup.items[0].groupedIds.includes(item.id)
                                          );
                                          if (templateItem) {
                                            handleAddEmployeeItem(templateItem);
                                          }
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                        title="Добавить сотрудника из справочника"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* ИСПРАВЛЕННАЯ кнопка добавления карточки провода */}
                                    {shouldShowWireButton(salaryGoodsGroup.salaryGoods) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('🔌 Нажата кнопка провода для группы:', salaryGoodsGroup.salaryGoods);
                                          // Берем первый элемент группы как шаблон
                                          const templateItem = items.find(item => 
                                            workTypeGroup.items[0].groupedIds.includes(item.id)
                                          );
                                          if (templateItem) {
                                            console.log('🔌 Найден шаблон:', templateItem.id);
                                            handleAddWireItem(templateItem);
                                          } else {
                                            console.warn('🔌 Шаблон не найден');
                                          }
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                        title="Добавить провод из справочника"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* ИСПРАВЛЕННАЯ кнопка добавления карточки двигателя - теперь проверяем И категорию, И статью работ */}
                                    {shouldShowMotorButton(salaryGoodsGroup.salaryGoods, workTypeGroup.workType) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('⚙️ Нажата кнопка двигателя для группы:', {
                                            salaryGoods: salaryGoodsGroup.salaryGoods,
                                            workType: workTypeGroup.workType
                                          });
                                          // Берем первый элемент группы как шаблон
                                          const templateItem = items.find(item => 
                                            workTypeGroup.items[0].groupedIds.includes(item.id)
                                          );
                                          if (templateItem) {
                                            console.log('⚙️ Найден шаблон:', templateItem.id);
                                            handleAddMotorItem(templateItem);
                                          } else {
                                            console.warn('⚙️ Шаблон не найден');
                                          }
                                        }}
                                        className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                                        title="Добавить двигатель из справочника"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* НОВАЯ кнопка добавления карточки подшипника (для замены расходников) */}
                                    {shouldShowBearingButton(workTypeGroup.workType) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('🔧 Нажата кнопка подшипника для группы:', workTypeGroup.workType);
                                          // Берем первый элемент группы как шаблон
                                          const templateItem = items.find(item => 
                                            workTypeGroup.items[0].groupedIds.includes(item.id)
                                          );
                                          if (templateItem) {
                                            console.log('🔧 Найден шаблон:', templateItem.id);
                                            handleAddBearingItem(templateItem);
                                          } else {
                                            console.warn('🔧 Шаблон не найден');
                                          }
                                        }}
                                        className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                                        title="Добавить подшипник из справочника"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )
                              )}
                              
                              {/* Кнопка сворачивания */}
                              <button
                                onClick={() => toggleWorkTypeCollapse(salaryGoodsGroup.salaryGoods, workTypeGroup.workType)}
                                className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors"
                              >
                                {workTypeGroup.isCollapsed ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* Элементы статьи работ - показываем только если есть реальные данные */}
                          {!workTypeGroup.isCollapsed && !isShowingTemplates && (
                            <div className="bg-white space-y-2 p-2 pl-8">
                              {workTypeGroup.items.map((groupedItem) => {
                                const { hasIncome, hasExpense, totalIncome, totalExpense } = getIncomeExpenseFromGroup(groupedItem, items);
                                const isBeingDragged = draggedItem?.groupedIds.some(id => groupedItem.groupedIds.includes(id));
                                
                                return (
                                  <div 
                                    key={groupedItem.id} 
                                    className={`
                                      border border-gray-200 rounded-lg overflow-hidden cursor-move transition-all duration-200
                                      ${isBeingDragged 
                                        ? 'opacity-50 border-blue-300 shadow-lg transform scale-105' 
                                        : 'hover:border-blue-300 hover:shadow-md'
                                      }
                                    `}
                                    draggable={true}
                                    onDragStart={(e) => handleGroupDragStart(e, groupedItem)}
                                  >
                                    {/* Заголовок позиции */}
                                    <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900 text-sm">
                                          {groupedItem.positionName}
                                        </span>
                                        <div className="flex items-center space-x-1">
                                          {hasIncome && (
                                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                              Доходы
                                            </span>
                                          )}
                                          {hasExpense && (
                                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                              Расходы
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Кнопка создания позиции */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onCreatePositionFromGroup) {
                                            onCreatePositionFromGroup(groupedItem);
                                          }
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors group bg-white shadow-sm border border-gray-200"
                                        title="Создать позицию из этой группы"
                                      >
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                      </button>
                                    </div>
                                    
                                    {/* Содержимое позиции */}
                                    <div className="bg-white">
                                      {/* Показываем доходы и расходы */}
                                      <div className="p-3 space-y-2">
                                        {hasIncome && (
                                          <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                              <TrendingUp className="w-4 h-4 text-green-600" />
                                              <span className="text-green-700 font-medium">Доходы</span>
                                            </div>
                                            <span className="text-green-700 font-bold">
                                              {totalIncome.toLocaleString('ru-RU')} ₽
                                            </span>
                                          </div>
                                        )}
                                        
                                        {hasExpense && (
                                          <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                              <TrendingDown className="w-4 h-4 text-red-600" />
                                              <span className="text-red-700 font-medium">Расходы</span>
                                            </div>
                                            <span className="text-red-700 font-bold">
                                              {totalExpense.toLocaleString('ru-RU')} ₽
                                            </span>
                                          </div>
                                        )}
                                        
                                        {/* Итого */}
                                        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                                          <div className="flex items-center space-x-2">
                                            <Ruble className="w-4 h-4 text-blue-600" />
                                            <span className="text-blue-700 font-medium">Итого</span>
                                          </div>
                                          <span className="text-blue-700 font-bold">
                                            {(totalIncome - totalExpense).toLocaleString('ru-RU')} ₽
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* НОВОЕ: Показываем подсказку для свернутых шаблонных групп */}
                          {!workTypeGroup.isCollapsed && isShowingTemplates && (
                            <div className="bg-white p-4 pl-8">
                              <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-sm">Используйте кнопки + выше для создания карточек</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Элементы без Зарплата/Товары - показываем только если есть реальные данные */}
              {!isShowingTemplates && groupedItems.itemsWithoutSalaryGoods.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 flex items-center space-x-2">
                    <span className="font-medium text-gray-900 text-sm">Без категории</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {groupedItems.itemsWithoutSalaryGoods.length}
                    </span>
                  </div>
                  
                  <div className="bg-white space-y-2 p-2">
                    {groupedItems.itemsWithoutSalaryGoods.map((groupedItem) => {
                      const { hasIncome, hasExpense, totalIncome, totalExpense } = getIncomeExpenseFromGroup(groupedItem, items);
                      const isBeingDragged = draggedItem?.groupedIds.some(id => groupedItem.groupedIds.includes(id));
                      
                      return (
                        <div 
                          key={groupedItem.id} 
                          className={`
                            border border-gray-200 rounded-lg overflow-hidden cursor-move transition-all duration-200
                            ${isBeingDragged 
                              ? 'opacity-50 border-blue-300 shadow-lg transform scale-105' 
                              : 'hover:border-blue-300 hover:shadow-md'
                            }
                          `}
                          draggable={true}
                          onDragStart={(e) => handleGroupDragStart(e, groupedItem)}
                        >
                          {/* Заголовок позиции */}
                          <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 text-sm">
                                {groupedItem.positionName}
                              </span>
                              <div className="flex items-center space-x-1">
                                {hasIncome && (
                                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                    Доходы
                                  </span>
                                )}
                                {hasExpense && (
                                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                    Расходы
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Кнопка создания позиции */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onCreatePositionFromGroup) {
                                  onCreatePositionFromGroup(groupedItem);
                                }
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors group bg-white shadow-sm border border-gray-200"
                              title="Создать позицию из этой группы"
                            >
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                          
                          {/* Содержимое позиции */}
                          <div className="bg-white">
                            {/* Показываем доходы и расходы */}
                            <div className="p-3 space-y-2">
                              {hasIncome && (
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700 font-medium">Доходы</span>
                                  </div>
                                  <span className="text-green-700 font-bold">
                                    {totalIncome.toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>
                              )}
                              
                              {hasExpense && (
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                    <span className="text-red-700 font-medium">Расходы</span>
                                  </div>
                                  <span className="text-red-700 font-bold">
                                    {totalExpense.toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>
                              )}
                              
                              {/* Итого */}
                              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                  <Ruble className="w-4 h-4 text-blue-600" />
                                  <span className="text-blue-700 font-medium">Итого</span>
                                </div>
                                <span className="text-blue-700 font-bold">
                                  {(totalIncome - totalExpense).toLocaleString('ru-RU')} ₽
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно для добавления новой карточки */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Добавить новую карточку
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название новой позиции:
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Например: Оплата труда обмотчика"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            
            {selectedTemplateItem && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Шаблон:</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedTemplateItem.analytics8}
                </p>
                <p className="text-xs text-gray-500">
                  Статья работ: {selectedTemplateItem.workType}
                </p>
                <p className="text-xs text-gray-500">
                  Категория: {selectedTemplateItem.salaryGoods}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCancelAddItem}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateNewItem}
                disabled={!newItemName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора сотрудника */}
      {showEmployeeSelector && employeeTemplateItem && (
        <EmployeeSelector
          onSelect={handleEmployeeSelected}
          onCancel={handleCancelEmployeeSelection}
          templateWorkType={employeeTemplateItem.workType}
          templateSalaryGoods={employeeTemplateItem.salaryGoods}
        />
      )}

      {/* Модальное окно выбора провода */}
      {showWireSelector && wireTemplateItem && (
        <WireSelector
          onSelect={handleWireSelected}
          onCancel={handleCancelWireSelection}
          templateWorkType={wireTemplateItem.workType}
          templateSalaryGoods={wireTemplateItem.salaryGoods}
        />
      )}

      {/* НОВОЕ модальное окно выбора двигателя */}
      {showMotorSelector && motorTemplateItem && (
        <MotorSelector
          onSelect={handleMotorSelected}
          onCancel={handleCancelMotorSelection}
          templateWorkType={motorTemplateItem.workType}
          templateSalaryGoods={motorTemplateItem.salaryGoods}
        />
      )}

      {/* НОВОЕ модальное окно выбора подшипника */}
      {showBearingSelector && bearingTemplateItem && (
        <BearingSelector
          onSelect={handleBearingSelected}
          onCancel={handleCancelBearingSelection}
          templateWorkType={bearingTemplateItem.workType}
          templateSalaryGoods={bearingTemplateItem.salaryGoods}
        />
      )}
    </div>
  );
};

// Обработчик перетаскивания для группы
const handleGroupDragStart = (e: React.DragEvent, groupedItem: GroupedRepairItem) => {
  e.dataTransfer.effectAllowed = 'move';
  // onDragStart(groupedItem); // Эта функция должна быть передана из родительского компонента
};