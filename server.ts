import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import fs from 'fs';

import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://pejstxduwbgoijnvlibj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_uI1ZAe7r3jzaeDj3wCAKkg_IaP7KVtv';
const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthRequest extends Request {
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Auth Middleware
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
  next();
};

// Routes
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, whatsapp: user.whatsapp } });
});

// User Management
app.get('/api/users', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, birth_date, role, whatsapp, email, avatar')
    .order('name', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(users);
});

app.post('/api/users', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  const { name, birth_date, role, whatsapp, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const { error } = await supabase
    .from('users')
    .insert([{ name, birth_date, role: role || 'user', whatsapp, email, password: hashedPassword }]);

  if (error) return res.status(400).json({ error: 'Email já cadastrado ou erro no servidor' });
  res.json({ success: true });
});

app.put('/api/users/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, birth_date, whatsapp, email, password, avatar } = req.body;
  
  if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: 'Não autorizado' });
  }

  const updateData: any = { name, birth_date, whatsapp, email, avatar };
  if (password) {
    updateData.password = bcrypt.hashSync(password, 10);
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Settings
app.get('/api/settings', async (req, res) => {
  const { data: settings, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(settings);
});

app.put('/api/settings', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  const { institution_name, system_name, logo, favicon, pwa_logo } = req.body;
  const { error } = await supabase
    .from('settings')
    .update({ institution_name, system_name, logo, favicon, pwa_logo })
    .eq('id', 1);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Records
app.get('/api/records', authenticateToken, async (req: AuthRequest, res) => {
  const { user_id, start_date, end_date } = req.query;
  const targetUserId = req.user.role === 'admin' ? (user_id || req.user.id) : req.user.id;
  
  let query = supabase
    .from('records')
    .select('*')
    .eq('user_id', targetUserId);

  if (start_date && end_date) {
    query = query.gte('date', start_date).lte('date', end_date);
  }
  
  const { data: records, error } = await query.order('date', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(records);
});

app.post('/api/records', authenticateToken, async (req: AuthRequest, res) => {
  const { date, clock_in_type, time, obs, photo } = req.body;
  const user_id = req.user.id;

  let { data: record, error: fetchError } = await supabase
    .from('records')
    .select('*')
    .eq('user_id', user_id)
    .eq('date', date)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    return res.status(400).json({ error: fetchError.message });
  }

  if (!record) {
    const hour = parseInt(time.split(':')[0]);
    const minute = parseInt(time.split(':')[1]);
    const totalMinutes = hour * 60 + minute;
    
    let shift = '3º Turno';
    if (totalMinutes >= 6 * 60 && totalMinutes < 14 * 60 + 20) shift = '1º Turno';
    else if (totalMinutes >= 14 * 60 + 20 && totalMinutes < 21 * 60) shift = '2º Turno';

    const { data: newRecord, error: insertError } = await supabase
      .from('records')
      .insert([{ user_id, date, shift }])
      .select()
      .single();

    if (insertError) return res.status(400).json({ error: insertError.message });
    record = newRecord;
  }

  const fieldMap: any = { 'start': 'clock_in_1', 'break_start': 'clock_in_2', 'break_end': 'clock_in_3', 'end': 'clock_in_4' };
  const obsMap: any = { 'start': 'obs_1', 'break_start': 'obs_2', 'break_end': 'obs_3', 'end': 'obs_4' };
  const photoMap: any = { 'start': 'photo_1', 'break_start': 'photo_2', 'break_end': 'photo_3', 'end': 'photo_4' };

  const field = fieldMap[clock_in_type];
  const obsField = obsMap[clock_in_type];
  const photoField = photoMap[clock_in_type];

  if (!field) return res.status(400).json({ error: 'Tipo de batida inválido' });

  const updatePayload: any = {};
  updatePayload[field] = time;
  updatePayload[obsField] = obs;
  updatePayload[photoField] = photo;

  const { error: updateError } = await supabase
    .from('records')
    .update(updatePayload)
    .eq('id', record.id);

  if (updateError) return res.status(400).json({ error: updateError.message });

  if (clock_in_type === 'end') {
    const { data: updatedRecord, error: finalFetchError } = await supabase
      .from('records')
      .select('*')
      .eq('id', record.id)
      .single();

    if (finalFetchError) return res.status(400).json({ error: finalFetchError.message });

    if (updatedRecord.clock_in_1 && updatedRecord.clock_in_2 && updatedRecord.clock_in_3 && updatedRecord.clock_in_4) {
      const t1 = parseTime(updatedRecord.clock_in_1);
      const t2 = parseTime(updatedRecord.clock_in_2);
      const t3 = parseTime(updatedRecord.clock_in_3);
      const t4 = parseTime(updatedRecord.clock_in_4);
      
      let workMinutes = (t2 - t1) + (t4 - t3);
      if (workMinutes < 0) workMinutes += 24 * 60;

      const totalHours = workMinutes / 60;
      const bankHours = Math.max(0, totalHours - 7);
      
      await supabase
        .from('records')
        .update({ total_hours: totalHours, bank_hours: bankHours })
        .eq('id', record.id);
    }
  }

  res.json({ success: true });
});

app.delete('/api/records/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

function parseTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
