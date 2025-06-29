export interface RepairItem {
  id: string;
  uniqueKey: string;
  positionName: string;
  year: number;
  month: number;
  quarter: string;
  date: string;
  analytics1: string;
  analytics2: string;
  analytics3: string;
  analytics4: string;
  analytics5: string;
  analytics6: string;
  analytics7: string;
  analytics8: string;
  debitAccount: string;
  creditAccount: string;
  revenue: number;
  quantity: number;
  sumWithoutVAT: number;
  vatAmount: number;
  workType: string;
  incomeExpenseType: 'Доходы' | 'Расходы';
  salaryGoods: string; // Новое поле "Зарплата/Товары"
}

export interface GroupedRepairItem extends RepairItem {
  groupedIds: string[]; // ID всех объединенных позиций
  totalQuantity: number; // Общее количество
  totalRevenue: number; // Общая выручка
  totalSumWithoutVAT: number; // Общая сумма без НДС
  totalVatAmount: number; // Общий НДС
}

export interface Position {
  id: string;
  service: string;
  positionNumber: number;
  items: RepairItem[];
  totalPrice: number;
  totalIncome: number; // Общая сумма доходов
  totalExpense: number; // Общая сумма расходов
}

export interface DragItem {
  type: string;
  item: RepairItem;
  fromPositionId?: string;
}

// Интерфейс для сотрудников
export interface Employee {
  id: string;
  name: string;
  hourly_rate: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Интерфейс для проводов
export interface Wire {
  id: string;
  brand: string;
  cross_section: number;
  insulation_type: string;
  voltage_rating: number;
  price_per_meter: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Интерфейс для двигателей
export interface Motor {
  id: string;
  name: string;
  power_kw: number;
  rpm: number;
  voltage: number;
  current: number;
  efficiency: number;
  price_per_unit: number;
  description: string;
  manufacturer: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// НОВЫЙ интерфейс для подшипников
export interface Bearing {
  id: string;
  designation: string;
  inner_diameter: number;
  outer_diameter: number;
  width: number;
  bearing_type: string;
  seal_type: string;
  manufacturer: string;
  price_per_unit: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}