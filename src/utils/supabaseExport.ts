import { supabase } from './supabaseClient';
import { Position, SavedPosition, SavedPositionItem } from '../types';

export const exportPositionsToSupabase = async (positions: Position[]): Promise<{ success: boolean; message: string; savedCount: number }> => {
  try {
    if (positions.length === 0) {
      return {
        success: false,
        message: 'Нет позиций для сохранения',
        savedCount: 0
      };
    }

    console.log('🚀 Начинаем экспорт позиций в Supabase:', positions.length);

    // Подготавливаем данные для сохранения позиций
    const positionsToSave = positions.map(position => ({
      position_number: position.positionNumber,
      service: position.service,
      total_price: position.totalPrice,
      total_income: position.totalIncome,
      total_expense: position.totalExpense,
      items_count: position.items.length,
      export_date: new Date().toISOString()
    }));

    // Сохраняем позиции
    const { data: savedPositions, error: positionsError } = await supabase
      .from('saved_positions')
      .insert(positionsToSave)
      .select();

    if (positionsError) {
      console.error('❌ Ошибка сохранения позиций:', positionsError);
      throw positionsError;
    }

    if (!savedPositions || savedPositions.length === 0) {
      throw new Error('Не удалось сохранить позиции');
    }

    console.log('✅ Позиции сохранены:', savedPositions.length);

    // Подготавливаем данные для сохранения элементов позиций
    const itemsToSave: Omit<SavedPositionItem, 'id' | 'created_at'>[] = [];

    positions.forEach((position, index) => {
      const savedPosition = savedPositions[index];
      if (!savedPosition) return;

      position.items.forEach(item => {
        itemsToSave.push({
          position_id: savedPosition.id,
          item_data: item,
          position_name: item.positionName,
          revenue: item.revenue,
          quantity: item.quantity,
          income_expense_type: item.incomeExpenseType,
          work_type: item.workType,
          salary_goods: item.salaryGoods
        });
      });
    });

    console.log('📦 Подготовлено элементов для сохранения:', itemsToSave.length);

    // Сохраняем элементы позиций батчами (по 100 элементов)
    const batchSize = 100;
    let savedItemsCount = 0;

    for (let i = 0; i < itemsToSave.length; i += batchSize) {
      const batch = itemsToSave.slice(i, i + batchSize);
      
      const { error: itemsError } = await supabase
        .from('saved_position_items')
        .insert(batch);

      if (itemsError) {
        console.error('❌ Ошибка сохранения элементов (батч):', itemsError);
        throw itemsError;
      }

      savedItemsCount += batch.length;
      console.log(`✅ Сохранен батч: ${batch.length} элементов (всего: ${savedItemsCount}/${itemsToSave.length})`);
    }

    const message = `Успешно сохранено ${savedPositions.length} позиций с ${savedItemsCount} элементами`;
    console.log('🎉 Экспорт завершен:', message);

    return {
      success: true,
      message,
      savedCount: savedPositions.length
    };

  } catch (error) {
    console.error('💥 Ошибка экспорта в Supabase:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Неизвестная ошибка при сохранении';

    return {
      success: false,
      message: `Ошибка сохранения: ${errorMessage}`,
      savedCount: 0
    };
  }
};

// Функция для получения сохраненных позиций
export const getSavedPositions = async (): Promise<SavedPosition[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_positions')
      .select('*')
      .order('export_date', { ascending: false });

    if (error) {
      console.error('❌ Ошибка загрузки сохраненных позиций:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('💥 Ошибка получения сохраненных позиций:', error);
    throw error;
  }
};

// Функция для получения элементов сохраненной позиции
export const getSavedPositionItems = async (positionId: string): Promise<SavedPositionItem[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_position_items')
      .select('*')
      .eq('position_id', positionId)
      .order('created_at');

    if (error) {
      console.error('❌ Ошибка загрузки элементов позиции:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('💥 Ошибка получения элементов позиции:', error);
    throw error;
  }
};

// Функция для удаления сохраненной позиции
export const deleteSavedPosition = async (positionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('saved_positions')
      .delete()
      .eq('id', positionId);

    if (error) {
      console.error('❌ Ошибка удаления позиции:', error);
      throw error;
    }

    console.log('✅ Позиция удалена:', positionId);
    return true;
  } catch (error) {
    console.error('💥 Ошибка удаления позиции:', error);
    return false;
  }
};