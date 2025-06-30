import { useState, useEffect } from 'react';
import { Motor } from '../types';
import { supabase } from '../utils/supabaseClient';

export const useMotors = () => {
  const [motors, setMotors] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMotors = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('motors')
        .select('*')
        .eq('is_active', true)
        .order('power_kw')
        .order('rpm');

      if (fetchError) {
        throw fetchError;
      }

      setMotors(data || []);
    } catch (err) {
      console.error('Error fetching motors:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки двигателей');
    } finally {
      setLoading(false);
    }
  };

  const findMotorBySpecs = async (power_kw: number, rpm: number, voltage: number) => {
    try {
      const { data, error: findError } = await supabase
        .from('motors')
        .select('*')
        .eq('power_kw', power_kw)
        .eq('rpm', rpm)
        .eq('voltage', voltage)
        .eq('is_active', true)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      return data;
    } catch (err) {
      console.error('Error finding motor by specs:', err);
      throw err;
    }
  };

  const addMotor = async (motor: Omit<Motor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('motors')
        .insert([motor])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setMotors(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding motor:', err);
      throw err;
    }
  };

  const updateMotor = async (id: string, updates: Partial<Motor>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('motors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setMotors(prev => prev.map(motor => motor.id === id ? data : motor));
      return data;
    } catch (err) {
      console.error('Error updating motor:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMotors();
  }, []);

  return {
    motors,
    loading,
    error,
    fetchMotors,
    addMotor,
    updateMotor,
    findMotorBySpecs
  };
};