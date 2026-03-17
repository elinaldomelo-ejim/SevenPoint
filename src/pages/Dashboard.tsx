import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { Record, ClockInType } from '../types';
import { 
  Sun, 
  Moon, 
  Coffee, 
  LogOut, 
  Calendar, 
  Clock, 
  TrendingUp, 
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClockInModal from '../components/ClockInModal';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [currentRecord, setCurrentRecord] = useState<Record | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modalType, setModalType] = useState<ClockInType | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const data = await api.getRecords({ user_id: user?.id });
      setRecords(data);
      
      // Find the most recent record that is not finished (clock_in_4 is null)
      // or today's record if all are finished
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const isNightTime = now.getHours() >= 21;
      
      let activeRecord = data.find(r => !r.clock_in_4);
      
      if (!activeRecord) {
        const todayRecord = data.find(r => r.date === today);
        // If today's record is finished and it's night time, 
        // we allow starting a new record (which will be for tomorrow)
        if (todayRecord && todayRecord.clock_in_4 && isNightTime) {
          activeRecord = null;
        } else {
          activeRecord = todayRecord || null;
        }
      }
      
      setCurrentRecord(activeRecord);
    } catch (e) {
      console.error('Failed to fetch records');
    }
  };

  useEffect(() => {
    fetchRecords();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const titleMap = {
    'start': 'Início Expediente',
    'break_start': 'Saída Intervalo',
    'break_end': 'Retorno Intervalo',
    'end': 'Fim Expediente'
  };

  const handleClockIn = async (data: { time: string; date: string; obs: string; photo: string }) => {
    if (!modalType) return;

    try {
      // Check if date already has a record for this specific type
      const existing = records.find(r => r.date === data.date);
      const fieldMap: any = { 'start': 'clock_in_1', 'break_start': 'clock_in_2', 'break_end': 'clock_in_3', 'end': 'clock_in_4' };
      const field = fieldMap[modalType];
      
      if (existing && existing[field]) {
        setMessage(`Aviso: A data ${format(new Date(data.date + 'T12:00:00'), 'dd/MM/yyyy')} já possui o registro de "${titleMap[modalType]}".`);
        return;
      }

      await api.createRecord({
        date: data.date,
        clock_in_type: modalType,
        time: data.time,
        obs: data.obs,
        photo: data.photo
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });

      const messages = {
        'start': `Oi, ${user?.name} 😀. Que Deus abençoe seu trabalho hoje. Comece este dia com dedicação, alegria e gratidão. Deus está com você em cada tarefa!🙏`,
        'break_start': `Hora do intervalo, ${user?.name}! Aproveite para descansar e renovar as forças. Deus cuida de você em cada momento do seu dia.`,
        'break_end': `Que bom ter você de volta 😀! Que Deus renove suas energias para continuar o trabalho com sabedoria e dedicação.`,
        'end': `Parabéns pelo seu dia de trabalho 👏! Que Deus te abençoe, renove suas forças e cuide de você e da sua família 🛐`
      };

      setMessage(messages[modalType]);
      setTimeout(() => setMessage(null), 10000);
      fetchRecords();
    } catch (e) {
      alert('Erro ao registrar ponto.');
    }
  };

  const totalMonthlyHours = records
    .filter(r => r.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((acc, r) => acc + (r.total_hours || 0), 0);

  const totalBankHours = records
    .filter(r => r.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((acc, r) => acc + (r.bank_hours || 0), 0);

  const clockInCards = [
    { type: 'start' as ClockInType, label: 'Início Expediente', icon: Sun, color: 'bg-amber-500', field: 'clock_in_1' },
    { type: 'break_start' as ClockInType, label: 'Saída Intervalo', icon: Coffee, color: 'bg-blue-500', field: 'clock_in_2' },
    { type: 'break_end' as ClockInType, label: 'Retorno Intervalo', icon: History, color: 'bg-indigo-500', field: 'clock_in_3' },
    { type: 'end' as ClockInType, label: 'Fim Expediente', icon: Moon, color: 'bg-slate-800', field: 'clock_in_4' },
  ];

  const isEnabled = (type: ClockInType) => {
    if (type === 'start') return true;
    if (type === 'break_start') return !!currentRecord?.clock_in_1;
    if (type === 'break_end') return !!currentRecord?.clock_in_2;
    if (type === 'end') return !!currentRecord?.clock_in_3;
    return false;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="h-20 w-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-3xl font-bold">{user?.name.charAt(0)}</span>
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold text-stone-900">Olá, {user?.name}! 👋</h2>
          <p className="text-stone-500">Seja bem-vindo ao seu painel de controle de ponto.</p>
        </div>
        <div className="bg-stone-50 px-6 py-4 rounded-2xl border border-stone-100 text-center">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Data e Hora Atual</p>
          <p className="text-xl font-mono font-bold text-emerald-600">
            {format(currentTime, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-3xl shadow-lg border border-stone-100 flex items-center gap-5"
        >
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-500">Horas Trabalhadas (Mês)</p>
            <p className="text-2xl font-bold text-stone-900">{totalMonthlyHours.toFixed(1)}h</p>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-3xl shadow-lg border border-stone-100 flex items-center gap-5"
        >
          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-500">Banco de Horas (Mês)</p>
            <p className="text-2xl font-bold text-stone-900">{totalBankHours.toFixed(1)}h</p>
          </div>
        </motion.div>
      </div>

      {/* Message Alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-emerald-600 text-white p-6 rounded-3xl shadow-xl shadow-emerald-200 flex items-center gap-4 border-2 border-emerald-400"
          >
            <CheckCircle2 size={32} className="shrink-0" />
            <p className="text-lg font-medium leading-relaxed">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clock-in Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {clockInCards.map((card, idx) => {
          const enabled = isEnabled(card.type);
          const value = currentRecord ? (currentRecord as any)[card.field] : null;
          
          return (
            <motion.button
              key={card.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              disabled={!enabled || !!value}
              onClick={() => setModalType(card.type)}
              className={clsx(
                "relative group p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-4",
                value 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                  : enabled 
                    ? "bg-white border-stone-100 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1" 
                    : "bg-stone-50 border-stone-100 opacity-50 cursor-not-allowed"
              )}
            >
              <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-lg",
                value ? "bg-emerald-500" : card.color
              )}>
                <card.icon size={32} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider opacity-60 mb-1">{card.label}</p>
                <p className="text-2xl font-black">
                  {value || '--:--'}
                </p>
              </div>
              {value && (
                <div className="absolute top-3 right-3 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
              )}
              {!enabled && !value && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-50/40 rounded-3xl">
                  <AlertCircle size={24} className="text-stone-300" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Shift Info */}
      {currentRecord && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-stone-100 p-4 rounded-2xl text-center text-stone-600 text-sm font-medium"
        >
          Você está registrado no <span className="text-emerald-700 font-bold">{currentRecord.shift}</span> hoje.
        </motion.div>
      )}

      <ClockInModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        onConfirm={handleClockIn}
        type={modalType || 'start'}
        title={clockInCards.find(c => c.type === modalType)?.label || ''}
        fixedDate={currentRecord && !currentRecord.clock_in_4 ? currentRecord.date : null}
      />
    </div>
  );
}
