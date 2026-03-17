import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User as UserType } from '../types';
import { 
  Users as UsersIcon, 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone,
  MoreVertical,
  Shield,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UserModal from '../components/UserModal';
import { clsx } from 'clsx';

export default function Users() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleConfirm = async (data: any) => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, data);
        setNotification('Usuário atualizado com sucesso!');
      } else {
        await api.createUser(data);
        setNotification('Novo usuário cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      fetchUsers();
      setTimeout(() => setNotification(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteUser(deleteId);
      setDeleteId(null);
      fetchUsers();
      setNotification('Usuário excluído com sucesso.');
      setTimeout(() => setNotification(null), 5000);
    } catch (e) {
      alert('Erro ao excluir usuário');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Gestão de Usuários</h1>
          <p className="text-stone-500">Administre os colaboradores e seus acessos.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <UserPlus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3"
          >
            <UserCheck size={20} />
            <span className="font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-lg border border-stone-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u) => (
          <motion.div
            key={u.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl shadow-xl border border-stone-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-16 w-16 rounded-2xl bg-stone-100 overflow-hidden border-2 border-white shadow-sm">
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold text-xl">
                    {u.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => { setEditingUser(u); setIsModalOpen(true); }}
                  className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => setDeleteId(u.id)}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-stone-900 text-lg leading-tight">{u.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield size={14} className={u.role === 'admin' ? "text-amber-500" : "text-stone-400"} />
                  <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-wider",
                    u.role === 'admin' ? "text-amber-600" : "text-stone-400"
                  )}>
                    {u.role === 'admin' ? 'Administrador' : 'Colaborador'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-50">
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <Mail size={16} className="text-stone-300" />
                  <span className="truncate">{u.email}</span>
                </div>
                {u.whatsapp && (
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <Phone size={16} className="text-stone-300" />
                    <span>{u.whatsapp}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        user={editingUser}
      />

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
              <h3 className="text-xl font-bold text-stone-900 mb-2">Excluir Usuário</h3>
              <p className="text-stone-500 mb-8">Tem certeza que deseja excluir este usuário? Todos os registros vinculados a ele serão mantidos, mas ele não poderá mais acessar o sistema.</p>
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
