import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { 
  Building2, 
  Settings as SettingsIcon, 
  Image as ImageIcon, 
  CheckCircle2, 
  Save,
  Smartphone,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const { settings, refreshSettings } = useAuth();
  const [formData, setFormData] = useState({
    institution_name: '',
    system_name: '',
    logo: '',
    favicon: '',
    pwa_logo: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        institution_name: settings.institution_name || '',
        system_name: settings.system_name || '',
        logo: settings.logo || '',
        favicon: settings.favicon || '',
        pwa_logo: settings.pwa_logo || ''
      });
    }
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings(formData);
      await refreshSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Configurações do Sistema</h1>
        <p className="text-stone-500">Personalize a identidade visual e informações da instituição.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 mb-2">
                <Building2 size={24} />
                <h2 className="text-xl font-bold">Informações Gerais</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">Nome da Instituição</label>
                  <input
                    type="text"
                    value={formData.institution_name}
                    onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Ex: Escola Municipal Exemplo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">Nome do Sistema</label>
                  <input
                    type="text"
                    value={formData.system_name}
                    onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Ex: Ponto Master Pro"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600 mb-2">
                <Globe size={24} />
                <h2 className="text-xl font-bold">Identidade Visual</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-stone-700 block">Logo da Instituição</label>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-2xl bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon size={32} className="text-stone-300" />
                      )}
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold transition-colors">
                      Alterar Logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-stone-700 block">Favicon do Sistema</label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                      {formData.favicon ? (
                        <img src={formData.favicon} alt="Favicon" className="h-8 w-8 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Globe size={24} className="text-stone-300" />
                      )}
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold transition-colors">
                      Alterar Favicon
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'favicon')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PWA Settings */}
          <div className="space-y-6">
            <div className="bg-stone-900 p-8 rounded-3xl shadow-xl text-white space-y-6">
              <div className="flex items-center gap-3 text-emerald-400 mb-2">
                <Smartphone size={24} />
                <h2 className="text-xl font-bold">Configuração PWA</h2>
              </div>
              <p className="text-stone-400 text-sm">Esta imagem será usada como ícone do aplicativo quando instalado no celular.</p>
              
              <div className="flex flex-col items-center gap-6">
                <div className="h-32 w-32 rounded-[2.5rem] bg-stone-800 border-4 border-stone-700 flex items-center justify-center overflow-hidden shadow-2xl">
                  {formData.pwa_logo ? (
                    <img src={formData.pwa_logo} alt="PWA Logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Smartphone size={48} className="text-stone-600" />
                  )}
                </div>
                <label className="w-full text-center cursor-pointer px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20">
                  Alterar Ícone PWA
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'pwa_logo')} />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-3xl shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={24} />
                  Salvar Todas as Alterações
                </>
              )}
            </button>

            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3 text-sm font-bold"
              >
                <CheckCircle2 size={20} />
                Configurações salvas com sucesso!
              </motion.div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
