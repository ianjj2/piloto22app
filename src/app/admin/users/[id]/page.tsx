'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  role?: string;
  created_at: string;
}

export default function UserEditPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Erro ao carregar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: user.phone,
          role: user.role,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Usuário atualizado com sucesso');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-6 text-red-500">Carregando...</div>;
  }

  if (!user) {
    return <div className="container mx-auto py-6 text-red-500">Usuário não encontrado</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto bg-[#1a0808] p-6 rounded-lg border border-red-800/50">
        <h1 className="text-2xl font-bold mb-6 text-red-500">Editar Usuário</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-400">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-[#2a1010]/30 border-red-800/50 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-400">Telefone</Label>
            <Input
              id="phone"
              value={user.phone || ''}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              placeholder="Digite o telefone"
              className="bg-[#2a1010]/30 border-red-800/50 text-white placeholder-red-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-400">Função</Label>
            <Select
              value={user.role || 'user'}
              onValueChange={(value) => setUser({ ...user, role: value })}
            >
              <SelectTrigger className="bg-[#2a1010]/30 border-red-800/50 text-white">
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0808] border-red-800/50">
                <SelectItem value="user" className="text-white hover:bg-[#2a1010]">Usuário</SelectItem>
                <SelectItem value="admin" className="text-white hover:bg-[#2a1010]">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">Data de Criação</Label>
            <Input
              value={new Date(user.created_at).toLocaleDateString()}
              disabled
              className="bg-[#2a1010]/30 border-red-800/50 text-white"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/users')}
              className="bg-transparent border-red-800/50 text-white hover:bg-[#2a1010] hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 