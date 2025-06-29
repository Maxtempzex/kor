import React, { useState } from 'react';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Position } from '../types';
import { exportPositionsToSupabase } from '../utils/supabaseExport';

interface ExportToSupabaseButtonProps {
  positions: Position[];
  disabled?: boolean;
}

export const ExportToSupabaseButton: React.FC<ExportToSupabaseButtonProps> = ({
  positions,
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleExport = async () => {
    if (disabled || isExporting || positions.length === 0) return;

    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      const result = await exportPositionsToSupabase(positions);
      
      setExportStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });

      // Очищаем статус через 5 секунд
      setTimeout(() => {
        setExportStatus({ type: null, message: '' });
      }, 5000);

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ошибка экспорта'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const hasPositions = positions.length > 0;

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting || !hasPositions}
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm
          ${disabled || isExporting || !hasPositions
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-black text-white hover:bg-gray-800 hover:shadow-md active:transform active:scale-95'
          }
        `}
        title={!hasPositions ? 'Нет позиций для сохранения' : 'Сохранить позиции в Supabase'}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Сохранение...</span>
          </>
        ) : (
          <>
            <Database className="w-3 h-3" />
            <span>Сохранить в БД</span>
          </>
        )}
      </button>

      {/* Статус экспорта */}
      {exportStatus.type && (
        <div className={`
          absolute top-full left-0 mt-2 p-3 rounded-lg shadow-lg z-10 min-w-64 max-w-80
          ${exportStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
          }
        `}>
          <div className="flex items-start space-x-2">
            {exportStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {exportStatus.type === 'success' ? 'Сохранение завершено' : 'Ошибка сохранения'}
              </p>
              <p className={`text-sm mt-1 ${
                exportStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {exportStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};