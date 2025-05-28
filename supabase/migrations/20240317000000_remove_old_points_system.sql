-- Remove as funções antigas do sistema de pontos do Aviator
DROP FUNCTION IF EXISTS public.register_aviator_points(UUID);
DROP FUNCTION IF EXISTS public.register_aviator_points(DECIMAL, BOOLEAN);
DROP FUNCTION IF EXISTS public.register_aviator_presence_points(UUID);

-- Remove a função de enviar notificação do Aviator que não é mais usada
DROP FUNCTION IF EXISTS public.send_aviator_notification(TEXT, TEXT, TEXT, INTEGER); 