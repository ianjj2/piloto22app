export type UserLevel = 'iniciante' | 'intermediario' | 'avancado'
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  user_id: string
  username: string
  avatar_url?: string
  level: number // 1 = Iniciante, 2 = Intermediário, 3 = Avançado
  platform_id?: string
  points: number
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  content: string
  target_level: number // 0 = Todos, 1 = Iniciante, 2 = Intermediário, 3 = Avançado
  youtube_url?: string // URL do vídeo do YouTube
  banner_url?: string // URL da imagem do banner
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  image_url?: string
  price: number
  stock?: number
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  user_id: string
  product_id: string
  quantity: number
  total_price: number
  status: 'pending' | 'completed' | 'cancelled'
  shipping_info?: {
    cep: string
    endereco: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
    telefone: string
  }
  created_at: string
}

export interface Raffle {
  id: string
  title: string
  description: string
  prize: string
  ticket_price: number
  max_tickets: number | null
  draw_date: string
  status: 'active' | 'completed' | 'cancelled'
  winner_id: string | null
  created_at: string
  updated_at: string
}

export interface RaffleTicket {
  id: string
  raffle_id: string
  user_id: string
  ticket_number: number
  created_at: string
}

export interface RaffleWinner {
  id: string
  raffle_id: string
  user_id: string
  ticket_number: number
  created_at: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          avatar_url: string | null
          level: number
          platform_id: string | null
          points: number
          role: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          avatar_url?: string | null
          level?: number
          platform_id?: string | null
          points?: number
          role?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          avatar_url?: string | null
          level?: number
          platform_id?: string | null
          points?: number
          role?: string
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
} 