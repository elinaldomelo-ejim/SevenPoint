export interface User {
  id: number;
  name: string;
  birth_date?: string;
  role: 'admin' | 'user';
  whatsapp?: string;
  email: string;
  avatar?: string;
}

export interface Settings {
  institution_name: string;
  system_name: string;
  logo?: string;
  favicon?: string;
  pwa_logo?: string;
}

export interface Record {
  id: number;
  user_id: number;
  date: string;
  shift: string;
  clock_in_1?: string;
  obs_1?: string;
  photo_1?: string;
  clock_in_2?: string;
  obs_2?: string;
  photo_2?: string;
  clock_in_3?: string;
  obs_3?: string;
  photo_3?: string;
  clock_in_4?: string;
  obs_4?: string;
  photo_4?: string;
  total_hours: number;
  bank_hours: number;
}

export type ClockInType = 'start' | 'break_start' | 'break_end' | 'end';
