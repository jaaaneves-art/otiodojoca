-- Padroniza o naming de todas as RLS policies do schema public para
-- tabela_acao (snake_case, sem acentos, sem PT/EN misturado). Pedido
-- do Yos (ver docs/pendentes/PENDENTES-20260913.md, "Decisões em
-- aberto").
--
-- Usa ALTER POLICY ... RENAME TO ... em vez de DROP+CREATE -- isto é
-- deliberado: um rename nunca pode mudar qual/with_check/roles, o que
-- elimina por completo o risco de alterar semântica sem querer (ao
-- contrário de recriar a policy manualmente, que já causou bugs esta
-- sessão quando o texto não batia certo com o original).
--
-- Quando uma tabela tem mais do que uma policy para o mesmo comando,
-- o sufixo extra (_own, _admin, _empresa, _publicadas, etc.) identifica
-- qual é qual em vez de um número arbitrário.
--
-- 3 policies foram apagadas em vez de renomeadas, por serem
-- duplicados/subsumidos exatos encontrados ao preparar esta migration
-- (mesma tabela, mesmo comando, mesma condição ou condição mais restrita
-- que outra policy já existente -- como policies PERMISSIVE combinam-se
-- com OR, a mais restrita nunca muda o resultado e é pura redundância):
--   - alojamentos: "Alojamentos - SELECT públicos" (qual=true) era
--     idêntica a alojamentos_select (qual=true).
--   - restaurantes: "Leitura publica de restaurantes" (qual=true) era
--     idêntica a restaurantes_select (qual=true).
--   - social_posts: "Membros veem publicacoes ativas" (só posts
--     públicos) estava completamente coberta por social_posts_select
--     (públicos OU do próprio autor, role mais larga).
--
-- Verificado antes de aplicar: pg_policies com 260 linhas no total,
-- sem colisões de nome dentro da mesma tabela depois do rename (script
-- em /tmp, não commitado).

BEGIN;

-- Apagar duplicados exatos/subsumidos encontrados ao preparar o naming
DROP POLICY "Alojamentos - SELECT públicos" ON public.alojamentos;
DROP POLICY "Leitura publica de restaurantes" ON public.restaurantes;
DROP POLICY "Membros veem publicacoes ativas" ON public.social_posts;

-- Renomear para o padrao tabela_acao
ALTER POLICY "convites_select" ON public.adesoes_convites_email RENAME TO adesoes_convites_email_select;
ALTER POLICY "Criar eventos nas proprias candidaturas" ON public.application_events RENAME TO application_events_insert;
ALTER POLICY "Ver eventos das proprias candidaturas" ON public.application_events RENAME TO application_events_select;
ALTER POLICY "Candidato gere as suas candidaturas" ON public.applications RENAME TO applications_all;
ALTER POLICY "Empresa atualiza estado das candidaturas as suas vagas" ON public.applications RENAME TO applications_update;
ALTER POLICY "Empresa ve candidaturas as suas vagas" ON public.applications RENAME TO applications_select;
ALTER POLICY "audit_log_select_own" ON public.audit_log RENAME TO audit_log_select;
ALTER POLICY "calendar_favorites_delete" ON public.calendar_event_favorites RENAME TO calendar_event_favorites_delete;
ALTER POLICY "calendar_favorites_insert" ON public.calendar_event_favorites RENAME TO calendar_event_favorites_insert;
ALTER POLICY "calendar_favorites_select" ON public.calendar_event_favorites RENAME TO calendar_event_favorites_select;
ALTER POLICY "calendar_participants_delete" ON public.calendar_event_participants RENAME TO calendar_event_participants_delete;
ALTER POLICY "calendar_participants_insert" ON public.calendar_event_participants RENAME TO calendar_event_participants_insert;
ALTER POLICY "calendar_participants_select" ON public.calendar_event_participants RENAME TO calendar_event_participants_select;
ALTER POLICY "Participantes veem quem esteve na chamada" ON public.call_participants RENAME TO call_participants_select;
ALTER POLICY "Utilizador regista a sua propria entrada/saida" ON public.call_participants RENAME TO call_participants_insert;
ALTER POLICY "Utilizador regista a sua propria saida" ON public.call_participants RENAME TO call_participants_update;
ALTER POLICY "Participante inicia chamada na conversa" ON public.call_rooms RENAME TO call_rooms_insert;
ALTER POLICY "Participantes veem as chamadas da conversa" ON public.call_rooms RENAME TO call_rooms_select;
ALTER POLICY "Candidato gere o seu perfil" ON public.candidate_profiles RENAME TO candidate_profiles_all;
ALTER POLICY "Perfil de candidato publico visivel" ON public.candidate_profiles RENAME TO candidate_profiles_select;
ALTER POLICY "Candidato gere as suas competencias" ON public.candidate_skills RENAME TO candidate_skills_all;
ALTER POLICY "Competencias visiveis quando perfil publico" ON public.candidate_skills RENAME TO candidate_skills_select;
ALTER POLICY "categorias_entidade_public_read" ON public.categorias_entidade RENAME TO categorias_entidade_select;
ALTER POLICY "Categorias visiveis para todos" ON public.categories RENAME TO categories_select;
ALTER POLICY "Leitura publica de codigos_postais_geo" ON public.codigos_postais_geo RENAME TO codigos_postais_geo_select;
ALTER POLICY "config_select" ON public.config_plataforma RENAME TO config_plataforma_select;
ALTER POLICY "Participantes veem os participantes das suas conversas" ON public.conversation_participants RENAME TO conversation_participants_select;
ALTER POLICY "Participantes veem as suas conversas" ON public.conversations RENAME TO conversations_select;
ALTER POLICY "culturas_aptidoes_read_public" ON public.culturas_aptidoes RENAME TO culturas_aptidoes_select;
ALTER POLICY "culturas_guia_read_public" ON public.culturas_guia RENAME TO culturas_guia_select;
ALTER POLICY "culturas_produtos_read_public" ON public.culturas_produtos RENAME TO culturas_produtos_select;
ALTER POLICY "diaspora_family_participants_delete" ON public.diaspora_family_links RENAME TO diaspora_family_links_delete;
ALTER POLICY "diaspora_family_participants_read" ON public.diaspora_family_links RENAME TO diaspora_family_links_select;
ALTER POLICY "diaspora_family_request" ON public.diaspora_family_links RENAME TO diaspora_family_links_insert;
ALTER POLICY "diaspora_profiles_owner_delete" ON public.diaspora_profiles RENAME TO diaspora_profiles_delete;
ALTER POLICY "diaspora_profiles_owner_insert" ON public.diaspora_profiles RENAME TO diaspora_profiles_insert;
ALTER POLICY "diaspora_profiles_owner_update" ON public.diaspora_profiles RENAME TO diaspora_profiles_update;
ALTER POLICY "diaspora_profiles_public_read" ON public.diaspora_profiles RENAME TO diaspora_profiles_select;
ALTER POLICY "email_audit_select_own" ON public.email_audit_logs RENAME TO email_audit_logs_select;
ALTER POLICY "Empresa gere o seu perfil" ON public.empregos_empresas RENAME TO empregos_empresas_all;
ALTER POLICY "Empresas aprovadas visiveis a todos" ON public.empregos_empresas RENAME TO empregos_empresas_select;
ALTER POLICY "Administradores gerem todos os pedidos" ON public.entidade_pedidos RENAME TO entidade_pedidos_all;
ALTER POLICY "Utilizador cria o seu proprio pedido" ON public.entidade_pedidos RENAME TO entidade_pedidos_insert_own;
ALTER POLICY "Utilizador ve os seus proprios pedidos" ON public.entidade_pedidos RENAME TO entidade_pedidos_select;
ALTER POLICY "Visitante cria pedido de registo institucional" ON public.entidade_pedidos RENAME TO entidade_pedidos_insert_visitante;
ALTER POLICY "escut_agrup_select" ON public.escutismo_agrupamentos RENAME TO escutismo_agrupamentos_select;
ALTER POLICY "escut_agrup_update" ON public.escutismo_agrupamentos RENAME TO escutismo_agrupamentos_update;
ALTER POLICY "escut_assoc_select" ON public.escutismo_associacoes RENAME TO escutismo_associacoes_select;
ALTER POLICY "escut_audit_select" ON public.escutismo_auditoria RENAME TO escutismo_auditoria_select;
ALTER POLICY "escut_com_insert" ON public.escutismo_comunicacoes RENAME TO escutismo_comunicacoes_insert;
ALTER POLICY "escut_com_select" ON public.escutismo_comunicacoes RENAME TO escutismo_comunicacoes_select;
ALTER POLICY "escut_com_update" ON public.escutismo_comunicacoes RENAME TO escutismo_comunicacoes_update;
ALTER POLICY "escut_fotos_insert" ON public.escutismo_fotos RENAME TO escutismo_fotos_insert;
ALTER POLICY "escut_fotos_select" ON public.escutismo_fotos RENAME TO escutismo_fotos_select;
ALTER POLICY "escut_fotos_membros_select" ON public.escutismo_fotos_membros RENAME TO escutismo_fotos_membros_select;
ALTER POLICY "escut_leituras_all" ON public.escutismo_leituras RENAME TO escutismo_leituras_all;
ALTER POLICY "escut_membros_insert" ON public.escutismo_membros RENAME TO escutismo_membros_insert;
ALTER POLICY "escut_membros_select" ON public.escutismo_membros RENAME TO escutismo_membros_select;
ALTER POLICY "escut_membros_update" ON public.escutismo_membros RENAME TO escutismo_membros_update;
ALTER POLICY "escut_papeis_select" ON public.escutismo_papeis RENAME TO escutismo_papeis_select;
ALTER POLICY "escut_aprov_insert" ON public.escutismo_pedido_aprovacoes RENAME TO escutismo_pedido_aprovacoes_insert;
ALTER POLICY "escut_aprov_select" ON public.escutismo_pedido_aprovacoes RENAME TO escutismo_pedido_aprovacoes_select;
ALTER POLICY "escut_pedidos_insert" ON public.escutismo_pedidos_adesao RENAME TO escutismo_pedidos_adesao_insert;
ALTER POLICY "escut_pedidos_select" ON public.escutismo_pedidos_adesao RENAME TO escutismo_pedidos_adesao_select;
ALTER POLICY "event_items_read" ON public.event_order_items RENAME TO event_order_items_select;
ALTER POLICY "event_orders_read" ON public.event_orders RENAME TO event_orders_select;
ALTER POLICY "event_org_members_delete" ON public.event_organization_members RENAME TO event_organization_members_delete;
ALTER POLICY "event_org_members_insert" ON public.event_organization_members RENAME TO event_organization_members_insert;
ALTER POLICY "event_org_members_select" ON public.event_organization_members RENAME TO event_organization_members_select;
ALTER POLICY "event_org_members_update" ON public.event_organization_members RENAME TO event_organization_members_update;
ALTER POLICY "event_accounts_read" ON public.event_payment_accounts RENAME TO event_payment_accounts_select;
ALTER POLICY "event_payments_read" ON public.event_payments RENAME TO event_payments_select;
ALTER POLICY "event_refund_items_read" ON public.event_refund_items RENAME TO event_refund_items_select;
ALTER POLICY "event_refunds_read" ON public.event_refunds RENAME TO event_refunds_select;
ALTER POLICY "event_sessions_manage_delete" ON public.event_sessions RENAME TO event_sessions_delete;
ALTER POLICY "event_sessions_manage_insert" ON public.event_sessions RENAME TO event_sessions_insert;
ALTER POLICY "event_sessions_manage_update" ON public.event_sessions RENAME TO event_sessions_update;
ALTER POLICY "event_ticket_types_manage_delete" ON public.event_ticket_types RENAME TO event_ticket_types_delete;
ALTER POLICY "event_ticket_types_manage_insert" ON public.event_ticket_types RENAME TO event_ticket_types_insert;
ALTER POLICY "event_ticket_types_manage_update" ON public.event_ticket_types RENAME TO event_ticket_types_update;
ALTER POLICY "event_tickets_read" ON public.event_tickets RENAME TO event_tickets_select;
ALTER POLICY "event_venues_delete_own" ON public.event_venues RENAME TO event_venues_delete;
ALTER POLICY "event_venues_insert_own" ON public.event_venues RENAME TO event_venues_insert;
ALTER POLICY "event_venues_public_read" ON public.event_venues RENAME TO event_venues_select;
ALTER POLICY "event_venues_update_own" ON public.event_venues RENAME TO event_venues_update;
ALTER POLICY "eventos_org_delete" ON public.eventos RENAME TO eventos_delete;
ALTER POLICY "eventos_org_insert" ON public.eventos RENAME TO eventos_insert;
ALTER POLICY "eventos_org_update" ON public.eventos RENAME TO eventos_update;
ALTER POLICY "Leitura publica de freguesias" ON public.freguesias RENAME TO freguesias_select;
ALTER POLICY "group invites recipient responds" ON public.group_invites RENAME TO group_invites_update;
ALTER POLICY "group invites visible to participants" ON public.group_invites RENAME TO group_invites_select;
ALTER POLICY "Membros veem os membros do grupo" ON public.group_members RENAME TO group_members_select;
ALTER POLICY "Owner/admin adiciona membros" ON public.group_members RENAME TO group_members_insert;
ALTER POLICY "Owner/admin altera membros" ON public.group_members RENAME TO group_members_update;
ALTER POLICY "Owner/admin remove membros" ON public.group_members RENAME TO group_members_delete;
ALTER POLICY "Membros veem o grupo" ON public.groups RENAME TO groups_select;
ALTER POLICY "Owner/admin atualiza os dados do grupo" ON public.groups RENAME TO groups_update;
ALTER POLICY "Utilizador autenticado cria grupo (torna-se owner)" ON public.groups RENAME TO groups_insert;
ALTER POLICY "horarios_public_read" ON public.horarios RENAME TO horarios_select;
ALTER POLICY "horarios_excecoes_public_read" ON public.horarios_excecoes RENAME TO horarios_excecoes_select;
ALTER POLICY "Candidato ve as correspondencias dos seus alertas" ON public.job_alert_matches RENAME TO job_alert_matches_select;
ALTER POLICY "Servico cria correspondencias de alertas" ON public.job_alert_matches RENAME TO job_alert_matches_insert;
ALTER POLICY "Candidato gere os seus alertas" ON public.job_alerts RENAME TO job_alerts_all;
ALTER POLICY "Administradores gerem todas as denuncias" ON public.job_reports RENAME TO job_reports_all;
ALTER POLICY "Utilizador cria denuncias" ON public.job_reports RENAME TO job_reports_insert;
ALTER POLICY "Utilizador ve as suas denuncias" ON public.job_reports RENAME TO job_reports_select;
ALTER POLICY "Competencias de vagas publicadas visiveis" ON public.job_skills RENAME TO job_skills_select;
ALTER POLICY "Empresa gere competencias das suas vagas" ON public.job_skills RENAME TO job_skills_all;
ALTER POLICY "Administradores veem todas as vagas" ON public.jobs RENAME TO jobs_select_admin;
ALTER POLICY "Empresa ve as suas vagas" ON public.jobs RENAME TO jobs_select_empresa;
ALTER POLICY "Vagas publicadas visiveis a todos" ON public.jobs RENAME TO jobs_select_publicadas;
ALTER POLICY "Leitura publica de localizacoes" ON public.localizacoes RENAME TO localizacoes_select;
ALTER POLICY "Anuncios ativos visiveis para todos" ON public.marketplace_ads RENAME TO marketplace_ads_select_ativos;
ALTER POLICY "Autores veem os seus anuncios" ON public.marketplace_ads RENAME TO marketplace_ads_select_own;
ALTER POLICY "Historico de lances visivel para todos" ON public.marketplace_auction_bids RENAME TO marketplace_auction_bids_select;
ALTER POLICY "Licitadores criam os seus lances" ON public.marketplace_auction_bids RENAME TO marketplace_auction_bids_insert;
ALTER POLICY "Autores atualizam leiloes agendados" ON public.marketplace_auctions RENAME TO marketplace_auctions_update;
ALTER POLICY "Leiloes de anuncios ativos visiveis" ON public.marketplace_auctions RENAME TO marketplace_auctions_select;
ALTER POLICY "Categorias visiveis a todos" ON public.marketplace_categories RENAME TO marketplace_categories_select;
ALTER POLICY "Users create conversations as buyer" ON public.marketplace_conversations RENAME TO marketplace_conversations_insert;
ALTER POLICY "Users see their conversations" ON public.marketplace_conversations RENAME TO marketplace_conversations_select;
ALTER POLICY "Users update their conversations" ON public.marketplace_conversations RENAME TO marketplace_conversations_update;
ALTER POLICY "Users add their own favorites" ON public.marketplace_favorites RENAME TO marketplace_favorites_insert;
ALTER POLICY "Users remove their own favorites" ON public.marketplace_favorites RENAME TO marketplace_favorites_delete;
ALTER POLICY "Users see their own favorites" ON public.marketplace_favorites RENAME TO marketplace_favorites_select;
ALTER POLICY "Users add attachments to their messages" ON public.marketplace_message_attachments RENAME TO marketplace_message_attachments_insert;
ALTER POLICY "Users see attachments in their conversations" ON public.marketplace_message_attachments RENAME TO marketplace_message_attachments_select;
ALTER POLICY "Users mark their received messages as read" ON public.marketplace_messages RENAME TO marketplace_messages_update;
ALTER POLICY "Users see messages in their conversations" ON public.marketplace_messages RENAME TO marketplace_messages_select;
ALTER POLICY "Users send messages in their conversations" ON public.marketplace_messages RENAME TO marketplace_messages_insert;
ALTER POLICY "Autores gerem fotos dos seus anuncios" ON public.marketplace_photos RENAME TO marketplace_photos_all;
ALTER POLICY "Fotos de anuncios ativos visiveis" ON public.marketplace_photos RENAME TO marketplace_photos_select;
ALTER POLICY "Autor da mensagem associa media" ON public.message_media RENAME TO message_media_insert;
ALTER POLICY "Participantes veem media das suas conversas" ON public.message_media RENAME TO message_media_select;
ALTER POLICY "Autor apaga (soft delete) a sua mensagem" ON public.messages RENAME TO messages_update;
ALTER POLICY "Participantes enviam mensagens nas suas conversas" ON public.messages RENAME TO messages_insert;
ALTER POLICY "Participantes veem mensagens das suas conversas" ON public.messages RENAME TO messages_select;
ALTER POLICY "Municipios visiveis a todos" ON public.municipios RENAME TO municipios_select;
ALTER POLICY "Dono marca como lida" ON public.notifications RENAME TO notifications_update;
ALTER POLICY "Notificacoes so visiveis para o dono" ON public.notifications RENAME TO notifications_select_own;
ALTER POLICY "Sistema cria notificacoes" ON public.notifications RENAME TO notifications_insert;
ALTER POLICY "group invite notifications" ON public.notifications RENAME TO notifications_select_group_invite;
ALTER POLICY "social notification visibility" ON public.notifications RENAME TO notifications_select_social;
ALTER POLICY "pets owner deletes photos" ON public.pet_photos RENAME TO pet_photos_delete;
ALTER POLICY "pets owner inserts photos" ON public.pet_photos RENAME TO pet_photos_insert;
ALTER POLICY "pets photos follow post visibility" ON public.pet_photos RENAME TO pet_photos_select;
ALTER POLICY "pets authenticated insert" ON public.pet_posts RENAME TO pet_posts_insert;
ALTER POLICY "pets owner delete draft" ON public.pet_posts RENAME TO pet_posts_delete;
ALTER POLICY "pets owner update" ON public.pet_posts RENAME TO pet_posts_update;
ALTER POLICY "pets public feed" ON public.pet_posts RENAME TO pet_posts_select;
ALTER POLICY "pets reports admin update" ON public.pet_reports RENAME TO pet_reports_update;
ALTER POLICY "pets reports authenticated insert" ON public.pet_reports RENAME TO pet_reports_insert;
ALTER POLICY "pets reports own or admin read" ON public.pet_reports RENAME TO pet_reports_select;
ALTER POLICY "plantacao_historico_access" ON public.plantacao_historico RENAME TO plantacao_historico_select;
ALTER POLICY "plantacoes_user_access" ON public.plantacoes RENAME TO plantacoes_all;
ALTER POLICY "users_can_create_own_plantacoes" ON public.plantacoes RENAME TO plantacoes_insert;
ALTER POLICY "users_can_delete_own_plantacoes" ON public.plantacoes RENAME TO plantacoes_delete;
ALTER POLICY "users_can_update_own_plantacoes" ON public.plantacoes RENAME TO plantacoes_update;
ALTER POLICY "users_can_view_own_plantacoes" ON public.plantacoes RENAME TO plantacoes_select;
ALTER POLICY "Autores do post adicionam imagens" ON public.post_images RENAME TO post_images_insert;
ALTER POLICY "Autores do post apagam imagens" ON public.post_images RENAME TO post_images_delete;
ALTER POLICY "Imagens de posts visiveis para todos" ON public.post_images RENAME TO post_images_select;
ALTER POLICY "Autores apagam os seus posts" ON public.posts RENAME TO posts_delete;
ALTER POLICY "Autores editam os seus posts" ON public.posts RENAME TO posts_update;
ALTER POLICY "Posts visiveis para todos" ON public.posts RENAME TO posts_select;
ALTER POLICY "Utilizadores autenticados criam posts" ON public.posts RENAME TO posts_insert;
ALTER POLICY "Perfis publicos visiveis para todos" ON public.profiles RENAME TO profiles_select;
ALTER POLICY "Sistema cria perfis automaticamente" ON public.profiles RENAME TO profiles_insert;
ALTER POLICY "Utilizadores editam o seu proprio perfil" ON public.profiles RENAME TO profiles_update;
ALTER POLICY "recovery_codes_delete_own" ON public.recovery_codes RENAME TO recovery_codes_delete;
ALTER POLICY "recovery_codes_insert_own" ON public.recovery_codes RENAME TO recovery_codes_insert;
ALTER POLICY "recovery_codes_select_own" ON public.recovery_codes RENAME TO recovery_codes_select;
ALTER POLICY "recovery_codes_update_own" ON public.recovery_codes RENAME TO recovery_codes_update;
ALTER POLICY "Refeições - SELECT públicas" ON public.refeicoes_alojamento RENAME TO refeicoes_alojamento_select;
ALTER POLICY "Reservas alojamento - ver propria ou staff" ON public.reservas_alojamento RENAME TO reservas_alojamento_select;
ALTER POLICY "Utilizador vê suas reservas" ON public.restaurante_reservas RENAME TO restaurante_reservas_select;
ALTER POLICY "Candidato gere as vagas guardadas" ON public.saved_jobs RENAME TO saved_jobs_all;
ALTER POLICY "Skills visiveis a todos" ON public.skills RENAME TO skills_select;
ALTER POLICY "Membros veem comentarios ativos" ON public.social_post_comments RENAME TO social_post_comments_select;
ALTER POLICY "social_comments_delete" ON public.social_post_comments RENAME TO social_post_comments_delete;
ALTER POLICY "social_comments_insert" ON public.social_post_comments RENAME TO social_post_comments_insert;
ALTER POLICY "social_comments_update" ON public.social_post_comments RENAME TO social_post_comments_update;
ALTER POLICY "Membros veem imagens de publicacoes ativas" ON public.social_post_media RENAME TO social_post_media_select;
ALTER POLICY "Membros veem reacoes de publicacoes ativas" ON public.social_post_reactions RENAME TO social_post_reactions_select;
ALTER POLICY "social_reactions_delete" ON public.social_post_reactions RENAME TO social_post_reactions_delete;
ALTER POLICY "social_reactions_insert" ON public.social_post_reactions RENAME TO social_post_reactions_insert;
ALTER POLICY "social_reactions_update" ON public.social_post_reactions RENAME TO social_post_reactions_update;
ALTER POLICY "social realtime owner" ON public.social_realtime_state RENAME TO social_realtime_state_select;
ALTER POLICY "Autores editam os seus topicos" ON public.threads RENAME TO threads_update;
ALTER POLICY "Topicos visiveis para todos" ON public.threads RENAME TO threads_select;
ALTER POLICY "Utilizadores autenticados criam topicos" ON public.threads RENAME TO threads_insert;
ALTER POLICY "user_sessions_delete_own" ON public.user_sessions RENAME TO user_sessions_delete;
ALTER POLICY "user_sessions_insert_own" ON public.user_sessions RENAME TO user_sessions_insert;
ALTER POLICY "user_sessions_select_own" ON public.user_sessions RENAME TO user_sessions_select;
ALTER POLICY "user_sessions_update_own" ON public.user_sessions RENAME TO user_sessions_update;
ALTER POLICY "vehicle_generations_public_read" ON public.vehicle_generations RENAME TO vehicle_generations_select;
ALTER POLICY "vehicle_makes_public_read" ON public.vehicle_makes RENAME TO vehicle_makes_select;
ALTER POLICY "vehicle_models_public_read" ON public.vehicle_models RENAME TO vehicle_models_select;
ALTER POLICY "vehicle_variants_public_read" ON public.vehicle_variants RENAME TO vehicle_variants_select;

COMMIT;