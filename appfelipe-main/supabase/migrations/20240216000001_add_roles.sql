-- Criar enum para roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Adicionar coluna role na tabela profiles
ALTER TABLE profiles
ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Atualizar políticas de segurança para considerar roles
CREATE POLICY "Admins podem ver todos os perfis"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Usuários podem ver seu próprio perfil"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins podem atualizar qualquer perfil"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Políticas para posts
CREATE POLICY "Admins podem gerenciar posts"
ON posts FOR ALL
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- Políticas para produtos
CREATE POLICY "Admins podem gerenciar produtos"
ON products FOR ALL
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
)); 