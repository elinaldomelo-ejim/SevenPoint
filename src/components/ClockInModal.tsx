import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockInType } from '../types';
import { clsx } from 'clsx';

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { time: string; date: string; obs: string; photo: string }) => void;
  type: ClockInType;
  title: string;
  fixedDate?: string | null;
}

export default function ClockInModal({ isOpen, onClose, onConfirm, type, title, fixedDate }: ClockInModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [obs, setObs] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      let defaultDate = now.toISOString().split('T')[0];
      
      // If it's a new shift (no fixedDate) and it's after 21h, 
      // the shift belongs to the next day
      if (!fixedDate && type === 'start' && now.getHours() >= 21) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        defaultDate = tomorrow.toISOString().split('T')[0];
      }

      setDate(fixedDate || defaultDate);
      setTime(now.toTimeString().split(' ')[0].substring(0, 5));
      setObs('');
      setPhoto(null);
    }
  }, [isOpen, fixedDate, type]);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      } catch (err) {
        console.warn('Could not access front camera, trying any camera:', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleConfirm = () => {
    onConfirm({ date, time, obs, photo: photo || '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <Clock size={24} />
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">Data</label>
                  <input
                    type="date"
                    value={date}
                    disabled={!!fixedDate}
                    onChange={(e) => setDate(e.target.value)}
                    className={clsx(
                      "w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all",
                      fixedDate && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">Hora</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Foto de Comprovação</label>
                <div className="relative aspect-video bg-stone-100 rounded-2xl overflow-hidden border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-3">
                  {photo ? (
                    <>
                      <img src={photo} alt="Capture" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setPhoto(null)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : isCameraOpen ? (
                    <div className="relative w-full h-full">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <button 
                        onClick={takePhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-emerald-600 p-4 rounded-full shadow-xl active:scale-90 transition-transform"
                      >
                        <Camera size={32} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera size={48} className="text-stone-300" />
                      <button 
                        onClick={startCamera}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100"
                      >
                        Abrir Câmera
                      </button>
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Observação</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 text-stone-400" size={18} />
                  <textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    rows={3}
                    placeholder="Alguma observação importante?"
                    className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-100 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white border border-stone-200 text-stone-600 font-bold rounded-2xl hover:bg-stone-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Confirmar Registro
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
