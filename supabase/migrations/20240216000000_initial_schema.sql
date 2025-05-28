    -- Remover trigger e função existentes
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS register_aviator_points(DECIMAL, BOOLEAN);
    DROP FUNCTION IF EXISTS draw_raffle(UUID);

    -- Remover triggers existentes
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
    DROP TRIGGER IF EXISTS update_products_updated_at ON products;

    -- Remover políticas existentes
    DROP POLICY IF EXISTS "Permitir criação de sorteios para admins" ON raffles;
    DROP POLICY IF EXISTS "Permitir atualização de sorteios para admins" ON raffles;
    DROP POLICY IF EXISTS "Profiles são visíveis para todos" ON profiles;
    DROP POLICY IF EXISTS "Sistema pode inserir perfis" ON profiles;
    DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON profiles;
    DROP POLICY IF EXISTS "Posts são visíveis para todos" ON posts;
    DROP POLICY IF EXISTS "Admins podem gerenciar posts" ON posts;
    DROP POLICY IF EXISTS "Products são visíveis para todos" ON products;
    DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON products;
    DROP POLICY IF EXISTS "Usuários podem ver suas próprias compras" ON purchases;
    DROP POLICY IF EXISTS "Usuários podem fazer compras" ON purchases;
    DROP POLICY IF EXISTS "Permitir admins criarem notificações" ON aviator_notifications;
    DROP POLICY IF EXISTS "Permitir admins atualizarem notificações" ON aviator_notifications;
    DROP POLICY IF EXISTS "Permitir leitura de notificações ativas para todos" ON aviator_notifications;

    -- Remover extensões não utilizadas
    DROP EXTENSION IF EXISTS "supabase-ext-cron" CASCADE;
    DROP EXTENSION IF EXISTS pg_cron CASCADE;

    -- Remover tabelas existentes
    DROP TABLE IF EXISTS point_transactions;
    DROP TABLE IF EXISTS purchases;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS calculator_settings;
    DROP TABLE IF EXISTS raffle_winners;
    DROP TABLE IF EXISTS raffle_tickets;
    DROP TABLE IF EXISTS raffles;
    DROP TABLE IF EXISTS aviator_notifications;
    DROP TABLE IF EXISTS profiles;

    -- Criar tabela de perfis
    CREATE TABLE profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
      username TEXT NOT NULL,
      avatar_url TEXT,
      phone TEXT,
      -- Nível do usuário: 1 = Iniciante, 2 = Intermediário, 3 = Avançado
      level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
      platform_id TEXT,
      points INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de transações de pontos
    CREATE TABLE point_transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      points_added INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de posts
    CREATE TABLE posts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      -- Nível alvo: 0 = Todos, 1 = Iniciante, 2 = Intermediário, 3 = Avançado
      target_level INTEGER NOT NULL DEFAULT 0 CHECK (target_level BETWEEN 0 AND 3),
      banner_url TEXT,
      youtube_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de produtos
    CREATE TABLE products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      image_url TEXT,
      stock INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de compras
    CREATE TABLE purchases (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
      shipping_info JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Função para atualizar o campo updated_at
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger para atualizar o campo updated_at
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();

    CREATE TRIGGER update_posts_updated_at
      BEFORE UPDATE ON posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();

    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();

    -- Função para criar perfil automaticamente quando um novo usuário é criado
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (
        user_id,
        username,
        avatar_url,
        phone,
        level,
        points,
        role
      )
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'phone',
        CASE 
          WHEN new.email LIKE '%@admin%' THEN 3
          ELSE 1
        END,
        CASE 
          WHEN new.email LIKE '%@admin%' THEN 333
          ELSE 0
        END,
        CASE 
          WHEN new.email LIKE '%@admin%' THEN 'admin'
          ELSE 'user'
        END
      );
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger para criar perfil automaticamente
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();

    -- Habilitar RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
    ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

    -- Políticas de segurança para profiles
    CREATE POLICY "Permitir leitura de perfis para usuários autenticados"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Permitir inserção de perfis pelo sistema"
      ON profiles FOR INSERT
      TO postgres
      WITH CHECK (true);

    CREATE POLICY "Permitir usuários atualizarem seus próprios perfis"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    -- Políticas de segurança para point_transactions
    CREATE POLICY "Permitir visualização das próprias transações"
      ON point_transactions FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    -- Políticas de segurança para posts
    CREATE POLICY "Permitir leitura de posts para usuários autenticados"
      ON posts FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Permitir criação de posts para usuários autenticados"
      ON posts FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Permitir atualização de posts para admins"
      ON posts FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND role = 'admin'
        )
      );

    CREATE POLICY "Permitir deleção de posts para admins"
      ON posts FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND role = 'admin'
        )
      );

    -- Políticas de segurança para products
    CREATE POLICY "Permitir leitura de produtos para usuários autenticados"
      ON products FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Permitir gerenciamento de produtos para admins"
      ON products FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND role = 'admin'
        )
      );

    -- Políticas de segurança para purchases
    CREATE POLICY "Permitir usuários verem suas próprias compras"
      ON purchases FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Permitir admins verem todas as compras"
      ON purchases FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND role = 'admin'
        )
      );

    CREATE POLICY "Permitir usuários fazerem compras"
      ON purchases FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Permitir admins atualizarem compras"
      ON purchases FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
          AND role = 'admin'
        )
      );

    -- Função para adicionar pontos ao usuário
    CREATE OR REPLACE FUNCTION add_points(
      user_id_param UUID,
      points_to_add INTEGER,
      reason TEXT
    )
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      current_points INTEGER;
      new_points INTEGER;
    BEGIN
      -- Buscar pontos atuais
      SELECT points INTO current_points
      FROM profiles
      WHERE user_id = user_id_param;

      -- Calcular novos pontos
      new_points := current_points + points_to_add;

      -- Atualizar pontos
      UPDATE profiles
      SET 
        points = new_points,
        -- Se os pontos ultrapassarem certos limites, atualizar o nível
        level = CASE
          WHEN new_points >= 1000 THEN 3 -- Avançado
          WHEN new_points >= 500 THEN 2  -- Intermediário
          ELSE 1                         -- Iniciante
        END
      WHERE user_id = user_id_param;

      -- Registrar a transação de pontos
      INSERT INTO point_transactions (
        user_id,
        points_added,
        reason,
        created_at
      ) VALUES (
        user_id_param,
        points_to_add,
        reason,
        CURRENT_TIMESTAMP
      );

      RETURN new_points;
    END;
    $$;

    -- Função para registrar pontos do Aviator Game
    CREATE OR REPLACE FUNCTION register_aviator_points(
      multiplier DECIMAL,
      won BOOLEAN
    )
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      points_to_add INTEGER;
      last_claim TIMESTAMP;
      minutes_since_last_claim INTEGER;
      total_points INTEGER;
      result JSON;
    BEGIN
      -- Verificar quando foi o último resgate
      SELECT created_at INTO last_claim
      FROM point_transactions
      WHERE user_id = auth.uid()
      AND reason LIKE 'Aviator Game%'
      ORDER BY created_at DESC
      LIMIT 1;

      -- Se já fez algum resgate, calcular o tempo desde o último
      IF last_claim IS NOT NULL THEN
        minutes_since_last_claim := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_claim)) / 60;
        
        -- Se não passou 30 minutos, retornar -1 e os minutos restantes
        IF minutes_since_last_claim < 30 THEN
          result := json_build_object(
            'can_claim', false,
            'minutes_left', -30 + minutes_since_last_claim
          );
          RETURN result;
        END IF;
      END IF;

      -- Calcular pontos baseado no multiplicador e resultado
      IF won THEN
        points_to_add := FLOOR(multiplier * 10)::INTEGER;
        
        -- Bônus para multiplicadores altos
        IF multiplier >= 10 THEN
          points_to_add := points_to_add * 2;
        END IF;
      ELSE
        points_to_add := 1; -- Ponto de participação
      END IF;

      -- Adicionar pontos e pegar total atualizado
      SELECT add_points(
        auth.uid(),
        points_to_add,
        'Aviator Game (Multiplicador: ' || multiplier || 'x, ' || 
        CASE WHEN won THEN 'Vitória' ELSE 'Derrota' END || ')'
      ) INTO total_points;

      -- Retornar objeto com pontos ganhos e total
      result := json_build_object(
        'can_claim', true,
        'points_earned', points_to_add,
        'total_points', total_points
      );
      
      RETURN result;
    END;
    $$;

    -- Função para registrar login diário
    CREATE OR REPLACE FUNCTION register_daily_login()
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      last_login TIMESTAMP;
      points_to_add INTEGER;
      streak INTEGER;
    BEGIN
      -- Verificar último login
      SELECT MAX(created_at) INTO last_login
      FROM point_transactions
      WHERE user_id = auth.uid()
      AND reason LIKE 'Login diário%';

      -- Calcular streak e pontos
      IF last_login IS NULL OR last_login < CURRENT_DATE THEN
        -- Verificar streak
        SELECT COUNT(*) INTO streak
        FROM point_transactions
        WHERE user_id = auth.uid()
        AND reason LIKE 'Login diário%'
        AND created_at >= CURRENT_DATE - INTERVAL '7 days';

        -- Calcular pontos baseado no streak
        points_to_add := 10 + (streak * 5);
        
        -- Limitar a 50 pontos máximos por login
        IF points_to_add > 50 THEN
          points_to_add := 50;
        END IF;

        -- Adicionar pontos
        RETURN add_points(
          auth.uid(),
          points_to_add,
          'Login diário (Streak: ' || streak || ')'
        );
      END IF;

      RETURN 0;
    END;
    $$;

    -- Função para registrar visualização de post
    CREATE OR REPLACE FUNCTION register_post_view(
      post_id_param UUID
    )
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Verificar se já visualizou este post hoje
      IF NOT EXISTS (
        SELECT 1
        FROM point_transactions
        WHERE user_id = auth.uid()
        AND reason = 'Visualização de post: ' || post_id_param
        AND created_at >= CURRENT_DATE
      ) THEN
        -- Adicionar pontos pela visualização
        RETURN add_points(
          auth.uid(),
          5,
          'Visualização de post: ' || post_id_param
        );
      END IF;

      RETURN 0;
    END;
    $$;

    -- Remover funções antigas do Aviator
    DROP FUNCTION IF EXISTS public.register_aviator_points(UUID);
    DROP FUNCTION IF EXISTS register_aviator_points(DECIMAL, BOOLEAN);

    -- Adiciona a função register_aviator_points
    CREATE OR REPLACE FUNCTION public.register_aviator_points(input_user_id UUID)
    RETURNS TABLE (
      points_earned INTEGER,
      total_points INTEGER
    ) 
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      last_claim TIMESTAMP;
      minutes_since_last_claim INTEGER;
      points_to_add INTEGER;
      current_points INTEGER;
      random_multiplier DECIMAL;
    BEGIN
      -- Busca o último resgate do usuário
      SELECT created_at INTO last_claim
      FROM point_transactions pt
      WHERE pt.user_id = input_user_id
      AND pt.reason LIKE 'Aviator Game%'
      ORDER BY pt.created_at DESC
      LIMIT 1;

      -- Se encontrou um último resgate, verifica o tempo
      IF FOUND THEN
        minutes_since_last_claim := EXTRACT(EPOCH FROM (NOW() - last_claim)) / 60;
        
        -- Se não passou 30 minutos, retorna -1
        IF minutes_since_last_claim < 30 THEN
          points_earned := -1;
          total_points := -1;
          RETURN NEXT;
          RETURN;
        END IF;
      END IF;

      -- Gera um multiplicador aleatório entre 1.00 e 2.50
      random_multiplier := 1.00 + random() * 1.50;
      
      -- Define os pontos baseado no multiplicador
      IF random_multiplier <= 1.50 THEN
        points_to_add := 1;
      ELSIF random_multiplier <= 2.00 THEN
        points_to_add := 2;
      ELSE
        points_to_add := 3;
      END IF;

      -- Atualiza os pontos do usuário
      UPDATE profiles p
      SET points = p.points + points_to_add
      WHERE p.user_id = input_user_id
      RETURNING p.points INTO current_points;

      -- Registra a transação
      INSERT INTO point_transactions (
        user_id,
        points_added,
        reason,
        created_at
      ) VALUES (
        input_user_id,
        points_to_add,
        'Aviator Game Reward',
        CURRENT_TIMESTAMP
      );

      points_earned := points_to_add;
      total_points := current_points;
      
      RETURN NEXT;
      RETURN;
    END;
    $$;

    -- Garante que a função é acessível
    GRANT EXECUTE ON FUNCTION public.register_aviator_points(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.register_aviator_points(UUID) TO service_role;

    -- Criar tabela de configurações da calculadora
    CREATE TABLE calculator_settings (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      banca decimal not null,
      stop_gain decimal not null,
      stop_loss decimal not null,
      stop_gain_value decimal not null,
      stop_loss_value decimal not null,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Criar índice para melhorar performance das consultas
    CREATE INDEX calculator_settings_user_id_idx ON calculator_settings(user_id);

    -- Adicionar políticas de segurança RLS
    ALTER TABLE calculator_settings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Usuários podem ver apenas suas próprias configurações"
      ON calculator_settings FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Usuários podem inserir suas próprias configurações"
      ON calculator_settings FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Usuários podem atualizar suas próprias configurações"
      ON calculator_settings FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Usuários podem deletar suas próprias configurações"
      ON calculator_settings FOR DELETE
      USING (auth.uid() = user_id);

    -- Criar tabela de sorteios
    CREATE TABLE raffles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      prize TEXT NOT NULL,
      ticket_price INTEGER NOT NULL,
      max_tickets INTEGER,
      draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
      winner_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de tickets de sorteio
    CREATE TABLE raffle_tickets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      ticket_number INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de vencedores
    CREATE TABLE raffle_winners (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      ticket_number INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Trigger para atualizar updated_at em raffles
    CREATE TRIGGER update_raffles_updated_at
      BEFORE UPDATE ON raffles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();

    -- Função para realizar o sorteio
    CREATE OR REPLACE FUNCTION draw_raffle(input_raffle_id UUID)
    RETURNS UUID AS $$
    DECLARE
      winner_id UUID;
      winner_ticket INTEGER;
    BEGIN
      -- Seleciona um ticket aleatório
      SELECT rt.user_id, rt.ticket_number INTO winner_id, winner_ticket
      FROM raffle_tickets rt
      WHERE rt.raffle_id = input_raffle_id
      ORDER BY random()
      LIMIT 1;

      -- Registra o vencedor
      INSERT INTO raffle_winners (raffle_id, user_id, ticket_number)
      VALUES (input_raffle_id, winner_id, winner_ticket);

      -- Atualiza o status do sorteio
      UPDATE raffles
      SET status = 'completed',
          winner_id = winner_id,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = input_raffle_id;

      RETURN winner_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Habilitar RLS nas novas tabelas
    ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE raffle_winners ENABLE ROW LEVEL SECURITY;

    -- Políticas de segurança para raffles
    CREATE POLICY "Permitir leitura de sorteios para todos"
      ON raffles FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Permitir criação de sorteios para admins"
      ON raffles FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));

    CREATE POLICY "Permitir atualização de sorteios para admins"
      ON raffles FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid() AND role = 'admin'
      ));

    -- Políticas de segurança para raffle_tickets
    CREATE POLICY "Permitir leitura de tickets para todos"
      ON raffle_tickets FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Permitir compra de tickets para usuários autenticados"
      ON raffle_tickets FOR INSERT
      TO authenticated
      WITH CHECK (true);

    -- Políticas de segurança para raffle_winners
    CREATE POLICY "Permitir leitura de vencedores para todos"
      ON raffle_winners FOR SELECT
      TO authenticated
      USING (true);

    -- Função para verificar e realizar sorteios vencidos (versão manual)
    CREATE OR REPLACE FUNCTION check_and_draw_expired_raffles()
    RETURNS TABLE (
      raffle_id UUID,
      winner_id UUID,
      ticket_number INTEGER,
      title TEXT,
      prize TEXT
    ) AS $$
    DECLARE
      raffle_record RECORD;
      winner UUID;
    BEGIN
      -- Busca todos os sorteios ativos que já passaram da data
      FOR raffle_record IN 
        SELECT id, title, prize 
        FROM raffles 
        WHERE status = 'active' 
        AND draw_date <= CURRENT_TIMESTAMP
      LOOP
        -- Realiza o sorteio
        winner := draw_raffle(raffle_record.id);
        
        -- Retorna informações do vencedor
        RETURN QUERY
        SELECT 
          raffle_record.id,
          rw.user_id,
          rw.ticket_number,
          raffle_record.title,
          raffle_record.prize
        FROM raffle_winners rw
        WHERE rw.raffle_id = raffle_record.id
        AND rw.user_id = winner;
      END LOOP;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Garantir que a função pode ser chamada por admins
    GRANT EXECUTE ON FUNCTION check_and_draw_expired_raffles() TO authenticated;

    -- Criar tabela de notificações do Aviator
    CREATE TABLE aviator_notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'signal' CHECK (type IN ('signal', 'alert', 'info')),
      active BOOLEAN DEFAULT true,
      created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE
    );

    -- Habilitar RLS
    ALTER TABLE aviator_notifications ENABLE ROW LEVEL SECURITY;

    -- Políticas de segurança para notificações
    CREATE POLICY "Permitir leitura de notificações ativas para todos"
      ON aviator_notifications FOR SELECT
      TO authenticated
      USING (active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP));

    CREATE POLICY "Permitir admins criarem notificações"
      ON aviator_notifications FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
      ));

    CREATE POLICY "Permitir admins atualizarem notificações"
      ON aviator_notifications FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
      ));

    -- Função para enviar notificação do Aviator
    CREATE OR REPLACE FUNCTION send_aviator_notification(
      title_param TEXT,
      message_param TEXT,
      type_param TEXT DEFAULT 'signal',
      expires_in_minutes INTEGER DEFAULT 5
    ) RETURNS UUID AS $$
    DECLARE
      notification_id UUID;
    BEGIN
      -- Inserir nova notificação
      INSERT INTO aviator_notifications (
        title,
        message,
        type,
        created_by,
        expires_at
      ) VALUES (
        title_param,
        message_param,
        type_param,
        auth.uid(),
        CASE 
          WHEN expires_in_minutes IS NOT NULL THEN 
            CURRENT_TIMESTAMP + (expires_in_minutes || ' minutes')::INTERVAL
          ELSE NULL
        END
      ) RETURNING id INTO notification_id;

      -- Desativar notificações antigas do mesmo tipo
      UPDATE aviator_notifications
      SET active = false
      WHERE type = type_param
      AND id != notification_id
      AND created_by = auth.uid();

      RETURN notification_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Garantir que a função pode ser chamada por usuários autenticados
    GRANT EXECUTE ON FUNCTION send_aviator_notification(TEXT, TEXT, TEXT, INTEGER) TO authenticated;

    -- Função para registrar pontos por tempo de permanência no Aviator
    CREATE OR REPLACE FUNCTION register_aviator_presence_points(
      user_id_param UUID
    ) RETURNS INTEGER AS $$
    DECLARE
      last_presence_points TIMESTAMP;
      minutes_since_last_points INTEGER;
      current_points INTEGER;
    BEGIN
      -- Verificar último registro de pontos por presença
      SELECT created_at INTO last_presence_points
      FROM point_transactions
      WHERE user_id = user_id_param
      AND reason = 'Tempo de permanência no Aviator'
      ORDER BY created_at DESC
      LIMIT 1;

      -- Se já recebeu pontos, verificar o intervalo
      IF last_presence_points IS NOT NULL THEN
        minutes_since_last_points := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_presence_points)) / 60;
        
        -- Se não passou 10 minutos, retorna 0
        IF minutes_since_last_points < 10 THEN
          RETURN 0;
        END IF;
      END IF;

      -- Adicionar pontos na tabela point_transactions
      INSERT INTO point_transactions (
        user_id,
        points_added,
        reason
      ) VALUES (
        user_id_param,
        10,
        'Tempo de permanência no Aviator'
      );

      -- Adicionar pontos na tabela point_history
      INSERT INTO point_history (
        user_id,
        amount,
        type,
        description
      ) VALUES (
        user_id_param,
        10,
        'earned',
        'Tempo de permanência no Aviator'
      );

      -- Atualizar pontos do usuário
      UPDATE profiles
      SET points = points + 10
      WHERE user_id = user_id_param
      RETURNING points INTO current_points;

      RETURN current_points;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Garantir que a função pode ser chamada por usuários autenticados
    GRANT EXECUTE ON FUNCTION register_aviator_presence_points(UUID) TO authenticated; 