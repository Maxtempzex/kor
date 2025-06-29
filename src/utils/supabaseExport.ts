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

    console.log('📋 Данные позиций для сохранения:', positionsToSave);

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

    // ИСПРАВЛЕНИЕ: Подготавливаем данные для сохранения элементов позиций с ПОЛНЫМИ данными
    const itemsToSave: Omit<SavedPositionItem, 'id' | 'created_at'>[] = [];

    positions.forEach((position, index) => {
      const savedPosition = savedPositions[index];
      if (!savedPosition) return;

      position.items.forEach(item => {
        // ВАЖНО: Сохраняем ВСЕ данные элемента в поле item_data
        const fullItemData = {
          // Основные поля
          id: item.id,
          uniqueKey: item.uniqueKey,
          positionName: item.positionName,
          
          // ИСПРАВЛЕНИЕ: Добавляем ВСЕ поля даты и времени
          year: item.year,
          month: item.month,
          quarter: item.quarter,
          date: item.date,
          
          // ИСПРАВЛЕНИЕ: Добавляем ВСЕ поля аналитики
          analytics1: item.analytics1,
          analytics2: item.analytics2,
          analytics3: item.analytics3,
          analytics4: item.analytics4,
          analytics5: item.analytics5,
          analytics6: item.analytics6,
          analytics7: item.analytics7,
          analytics8: item.analytics8,
          
          // Счета
          debitAccount: item.debitAccount,
          creditAccount: item.creditAccount,
          
          // Финансовые данные
          revenue: item.revenue,
          quantity: item.quantity,
          sumWithoutVAT: item.sumWithoutVAT,
          vatAmount: item.vatAmount,
          
          // Классификация
          workType: item.workType,
          incomeExpenseType: item.incomeExpenseType,
          salaryGoods: item.salaryGoods
        };

        console.log(`📦 Подготовка элемента ${item.id}:`, {
          hasYear: !!item.year,
          hasMonth: !!item.month,
          hasDate: !!item.date,
          hasAnalytics1: !!item.analytics1,
          hasAnalytics8: !!item.analytics8,
          positionAnalytics1: position.analytics1,
          fullData: fullItemData
        });

        // НОВОЕ: Определяем документ УПД для элемента
        // Приоритет: analytics1 позиции -> analytics1 элемента -> пустая строка
        const documentUPD = position.analytics1 || item.analytics1 || '';

        console.log(`📄 Документ УПД для элемента ${item.id}:`, {
          fromPosition: position.analytics1,
          fromItem: item.analytics1,
          finalDocument: documentUPD
        });

        itemsToSave.push({
          position_id: savedPosition.id,
          item_data: fullItemData, // Сохраняем ПОЛНЫЕ данные
          position_name: item.positionName,
          revenue: item.revenue,
          quantity: item.quantity,
          income_expense_type: item.incomeExpenseType,
          work_type: item.workType,
          salary_goods: item.salaryGoods,
          document: documentUPD // НОВОЕ поле с документом УПД
        });
      });
    });

    console.log('📦 Подготовлено элементов для сохранения:', itemsToSave.length);
    console.log('🔍 Пример данных первого элемента:', itemsToSave[0]);

    // Сохраняем элементы позиций батчами (по 100 элементов)
    const batchSize = 100;
    let savedItemsCount = 0;

    for (let i = 0; i < itemsToSave.length; i += batchSize) {
      const batch = itemsToSave.slice(i, i + batchSize);
      
      console.log(`💾 Сохраняем батч ${Math.floor(i/batchSize) + 1}:`, {
        batchSize: batch.length,
        startIndex: i,
        endIndex: i + batch.length - 1,
        documentsInBatch: batch.map(item => ({ id: item.position_name, document: item.document }))
      });

      const { data: insertedItems, error: itemsError } = await supabase
        .from('saved_position_items')
        .insert(batch)
        .select();

      if (itemsError) {
        console.error('❌ Ошибка сохранения элементов (батч):', itemsError);
        console.error('❌ Проблемный батч:', batch);
        throw itemsError;
      }

      savedItemsCount += batch.length;
      console.log(`✅ Сохранен батч: ${batch.length} элементов (всего: ${savedItemsCount}/${itemsToSave.length})`);
      
      if (insertedItems && insertedItems.length > 0) {
        console.log('✅ Пример сохраненного элемента:', {
          id: insertedItems[0].id,
          position_name: insertedItems[0].position_name,
          document: insertedItems[0].document,
          work_type: insertedItems[0].work_type
        });
      }
    }

    const message = `Успешно сохранено ${savedPositions.length} позиций с ${savedItemsCount} элементами (включая документы УПД)`;
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