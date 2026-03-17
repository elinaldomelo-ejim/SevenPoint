import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { Record } from '../types';
import { 
  Search, 
  Printer, 
  Calendar, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  FileText,
  Clock,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';

export default function Records() {
  const { user, settings } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [filter, setFilter] = useState('month');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchRecords = async () => {
    try {
      const data = await api.getRecords({ user_id: user?.id });
      setRecords(data);
    } catch (e) {
      console.error('Failed to fetch records');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const getFilteredRecords = () => {
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case 'day':
        if (selectedDate) {
          start = startOfDay(new Date(selectedDate + 'T12:00:00'));
          end = endOfDay(new Date(selectedDate + 'T12:00:00'));
        }
        break;
      case 'month':
        if (selectedMonth) {
          const [year, month] = selectedMonth.split('-').map(Number);
          const date = new Date(year, month - 1, 1);
          start = startOfMonth(date);
          end = endOfMonth(date);
        }
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = startOfDay(new Date(customStart + 'T12:00:00'));
          end = endOfDay(new Date(customEnd + 'T12:00:00'));
        }
        break;
    }

    return records.filter(r => {
      const d = new Date(r.date + 'T12:00:00');
      return isWithinInterval(d, { start, end });
    }).sort((a, b) => b.date.localeCompare(a.date));
  };

  const filteredRecords = getFilteredRecords();
  const totalHours = filteredRecords.reduce((acc, r) => acc + (r.total_hours || 0), 0);
  const totalBank = filteredRecords.reduce((acc, r) => acc + (r.bank_hours || 0), 0);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteRecord(deleteId);
      setDeleteId(null);
      fetchRecords();
    } catch (e) {
      alert('Erro ao apagar registro');
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const reportDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
    const periodLabel = filter === 'custom' 
      ? `${format(new Date(customStart + 'T12:00:00'), 'dd/MM/yyyy')} até ${format(new Date(customEnd + 'T12:00:00'), 'dd/MM/yyyy')}`
      : filter === 'month' ? format(new Date(selectedMonth + '-01T12:00:00'), 'MMMM yyyy', { locale: ptBR })
      : filter === 'day' ? format(new Date(selectedDate + 'T12:00:00'), 'dd/MM/yyyy')
      : 'Geral';

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Frequência - ${user?.name}</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            
            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              padding: 40px; 
              color: #1c1917; 
              line-height: 1.5;
              background: #fff;
            }
            
            .no-print-btn {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10b981;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 12px;
              font-weight: bold;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
              z-index: 100;
            }

            .header { 
              display: flex; 
              align-items: flex-start; 
              justify-content: space-between; 
              border-bottom: 2px solid #f5f5f4; 
              padding-bottom: 30px; 
              margin-bottom: 40px; 
            }
            
            .logo-container { display: flex; align-items: center; gap: 20px; }
            .logo { height: 64px; width: 64px; object-fit: contain; border-radius: 12px; }
            .placeholder-logo { height: 64px; width: 64px; background: #10b981; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; }
            
            .info-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 30px; 
              margin-bottom: 40px;
              background: #fafaf9;
              padding: 24px;
              border-radius: 20px;
            }
            
            .info-item label { 
              display: block; 
              font-size: 10px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em; 
              color: #78716c; 
              font-weight: 700;
              margin-bottom: 4px;
            }
            
            .info-item span { 
              font-size: 16px; 
              font-weight: 700; 
              color: #1c1917; 
            }

            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { 
              background: #f8fafc; 
              color: #64748b; 
              font-size: 11px; 
              font-weight: 700; 
              text-transform: uppercase; 
              letter-spacing: 0.05em; 
              padding: 12px 15px;
              text-align: left;
              border-bottom: 2px solid #e2e8f0;
            }
            
            td { 
              padding: 12px 15px; 
              border-bottom: 1px solid #f1f5f9; 
              font-size: 13px;
              color: #334155;
            }

            .details-row td {
              padding: 0 15px 15px 15px;
              background: #fcfcfb;
            }

            .details-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              padding: 12px;
              background: white;
              border: 1px solid #f5f5f4;
              border-radius: 12px;
              font-size: 11px;
            }

            .detail-item {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #57534e;
            }

            .attachment-link {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              color: #10b981;
              text-decoration: none;
              font-weight: 700;
              background: #ecfdf5;
              padding: 2px 8px;
              border-radius: 6px;
              transition: background 0.2s;
            }

            .attachment-link:hover {
              background: #d1fae5;
            }

            .total-row { background: #f8fafc; font-weight: 700; }
            .total-row td { border-top: 2px solid #e2e8f0; font-size: 15px; }

            .footer { 
              margin-top: 60px; 
              padding-top: 30px;
              border-top: 1px solid #f5f5f4;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #a8a29e;
            }

            .signature {
              margin-top: 80px;
              display: flex;
              justify-content: space-around;
              gap: 40px;
            }

            .sig-box {
              border-top: 1px solid #1c1917;
              width: 250px;
              text-align: center;
              padding-top: 10px;
              font-size: 12px;
            }

            @media print {
              .no-print-btn { display: none; }
              body { padding: 0; }
              .info-grid { background: none; border: 1px solid #f5f5f4; }
              .attachment-link { border: 1px solid #10b981; }
            }
          </style>
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">Imprimir Agora</button>

          <div class="header">
            <div class="logo-container">
              ${settings?.logo 
                ? `<img src="${settings.logo}" class="logo" />` 
                : `<div class="placeholder-logo">${settings?.institution_name?.charAt(0) || 'P'}</div>`
              }
              <div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${settings?.institution_name || 'Instituição'}</h1>
                <p style="margin: 4px 0 0 0; color: #78716c;">${settings?.system_name || 'Sistema de Ponto'}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #10b981; font-size: 18px;">Relatório de Frequência</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #78716c;">Emissão: ${reportDate}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>Colaborador</label>
              <span>${user?.name}</span>
            </div>
            <div class="info-item">
              <label>Período do Relatório</label>
              <span>${periodLabel}</span>
            </div>
            <div class="info-item">
              <label>E-mail</label>
              <span>${user?.email}</span>
            </div>
            <div class="info-item">
              <label>Cargo</label>
              <span>${user?.role === 'admin' ? 'Administrador' : 'Colaborador'}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Semana</th>
                <th>Entrada</th>
                <th>Almoço</th>
                <th>Retorno</th>
                <th>Saída</th>
                <th>Total</th>
                <th>Banco</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map(r => {
                const dateObj = new Date(r.date + 'T12:00:00');
                const hasDetails = r.obs_1 || r.obs_2 || r.obs_3 || r.obs_4 || r.photo_1 || r.photo_2 || r.photo_3 || r.photo_4;
                
                return `
                  <tr>
                    <td style="font-weight: 700;">${format(dateObj, 'dd/MM/yyyy')}</td>
                    <td style="color: #64748b; text-transform: capitalize;">${format(dateObj, 'EEEE', { locale: ptBR })}</td>
                    <td>${r.clock_in_1 || '--:--'}</td>
                    <td>${r.clock_in_2 || '--:--'}</td>
                    <td>${r.clock_in_3 || '--:--'}</td>
                    <td>${r.clock_in_4 || '--:--'}</td>
                    <td style="font-weight: 700;">${r.total_hours?.toFixed(1)}h</td>
                    <td style="color: ${r.bank_hours > 0 ? '#10b981' : '#64748b'}; font-weight: 700;">
                      ${r.bank_hours > 0 ? '+' : ''}${r.bank_hours?.toFixed(1)}h
                    </td>
                  </tr>
                  ${hasDetails ? `
                    <tr class="details-row">
                      <td colspan="8">
                        <div class="details-container">
                          ${[1,2,3,4].map(i => {
                            const time = (r as any)[`clock_in_${i}`];
                            const obs = (r as any)[`obs_${i}`];
                            const photo = (r as any)[`photo_${i}`];
                            if (!time && !obs && !photo) return '';
                            return `
                              <div class="detail-item">
                                <strong style="color: #78716c;">Ponto ${i}:</strong> 
                                <span>${obs || '<span style="color: #a8a29e;">Sem obs.</span>'}</span>
                                ${photo ? `<a href="${photo}" target="_blank" class="attachment-link">📎 Ver Foto</a>` : ''}
                              </div>
                            `;
                          }).join('')}
                        </div>
                      </td>
                    </tr>
                  ` : ''}
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="6" style="text-align: right; padding-right: 30px;">TOTAIS DO PERÍODO</td>
                <td>${totalHours.toFixed(1)}h</td>
                <td style="color: #10b981;">${totalBank.toFixed(1)}h</td>
              </tr>
            </tbody>
          </table>

          <div class="signature">
            <div class="sig-box">
              Assinatura do Colaborador
            </div>
            <div class="sig-box">
              Assinatura do Responsável
            </div>
          </div>

          <div class="footer">
            <div>Gerado por ${settings?.system_name}</div>
            <div>Página 1 de 1</div>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);

    win.document.close();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Meus Registros</h1>
          <p className="text-stone-500">Histórico completo de suas batidas de ponto.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-2xl hover:bg-stone-50 transition-all shadow-sm"
          >
            <Printer size={20} />
            Imprimir Relatório
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-lg border border-stone-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-2xl border border-stone-100">
          {[
            { id: 'day', label: 'Dia' },
            { id: 'month', label: 'Mês' },
            { id: 'custom', label: 'Período' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                filter === f.id ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500 hover:text-stone-800"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {filter === 'day' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <Calendar size={18} className="text-stone-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {filter === 'month' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <Calendar size={18} className="text-stone-400" />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {filter === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-stone-400">até</span>
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-100 text-white flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-emerald-100 text-sm font-medium">Hora Total Trabalhada</p>
            <p className="text-3xl font-bold">{totalHours.toFixed(1)}h</p>
          </div>
        </div>
        <div className="bg-stone-900 p-6 rounded-3xl shadow-xl shadow-stone-200 text-white flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-stone-400 text-sm font-medium">Horas Acumuladas (Banco)</p>
            <p className="text-3xl font-bold">{totalBank.toFixed(1)}h</p>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Início</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Intervalo</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Retorno</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Fim</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Banco</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-400">
                    Nenhum registro encontrado para este período.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <React.Fragment key={record.id}>
                    <tr className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-stone-100 flex flex-col items-center justify-center text-stone-600">
                            <span className="text-[10px] font-bold uppercase">{format(new Date(record.date + 'T12:00:00'), 'MMM', { locale: ptBR })}</span>
                            <span className="text-lg font-bold leading-none">{format(new Date(record.date + 'T12:00:00'), 'dd')}</span>
                          </div>
                          <div className="text-xs font-medium text-stone-400 capitalize">
                            {format(new Date(record.date + 'T12:00:00'), 'EEEE', { locale: ptBR })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-stone-700">{record.clock_in_1 || '--:--'}</td>
                      <td className="px-6 py-4 font-mono font-bold text-stone-700">{record.clock_in_2 || '--:--'}</td>
                      <td className="px-6 py-4 font-mono font-bold text-stone-700">{record.clock_in_3 || '--:--'}</td>
                      <td className="px-6 py-4 font-mono font-bold text-stone-700">{record.clock_in_4 || '--:--'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                          {record.total_hours?.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          record.bank_hours > 0 ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-400"
                        )}>
                          {record.bank_hours?.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setDeleteId(record.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                    {(filter === 'day' || filter === 'month' || filter === 'custom') && (
                      <tr className="bg-stone-50/30">
                        <td colSpan={8} className="px-6 py-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(idx => {
                              const obs = (record as any)[`obs_${idx}`];
                              const photo = (record as any)[`photo_${idx}`];
                              const time = (record as any)[`clock_in_${idx}`];
                              if (!time && !obs && !photo) return null;
                              return (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase">Batida {idx}</span>
                                    <span className="text-xs font-bold text-emerald-600">{time}</span>
                                  </div>
                                  {photo && (
                                    <div className="relative group aspect-video rounded-xl overflow-hidden bg-stone-100">
                                      <img src={photo} alt="Comprovação" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      <a 
                                        href={photo} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 text-xs font-bold"
                                      >
                                        <ImageIcon size={16} />
                                        Abrir Anexo
                                      </a>
                                    </div>
                                  )}
                                  <p className="text-xs text-stone-600 italic">
                                    {obs || 'Sem observações registradas.'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-stone-500 mb-8">Tem certeza que deseja apagar este registro? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-6 py-3 bg-stone-100 text-stone-600 font-bold rounded-2xl hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-100 hover:bg-red-600 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
