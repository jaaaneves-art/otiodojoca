set local check_function_bodies = off;

select cron.unschedule('gran-bazar-advance-auctions');

select cron.unschedule('gran-bazar-leiloes-avancar');

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "service_role";

alter default privileges for role "postgres" in schema "public" revoke all on FUNCTIONS from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on FUNCTIONS from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on FUNCTIONS from "service_role";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "service_role";

alter publication "supabase_realtime" drop table "public"."calendar_events";

drop policy "audit_log_select_own" on "public"."audit_log";

drop policy "calendar_event_images_delete" on "public"."calendar_event_images";

drop policy "calendar_event_images_insert" on "public"."calendar_event_images";

drop policy "calendar_event_images_update" on "public"."calendar_event_images";

drop policy "Administradores gerem todos os pedidos" on "public"."entidade_pedidos";

drop policy "Licitadores criam os seus lances" on "public"."marketplace_auction_bids";

drop policy "Autores atualizam leiloes agendados" on "public"."marketplace_auctions";

drop policy "Leiloes de anuncios ativos visiveis" on "public"."marketplace_auctions";

drop policy "Users add attachments to their messages" on "public"."marketplace_message_attachments";

drop policy "Users see attachments in their conversations" on "public"."marketplace_message_attachments";

drop policy "Users mark their received messages as read" on "public"."marketplace_messages";

drop policy "Users see messages in their conversations" on "public"."marketplace_messages";

drop policy "Users send messages in their conversations" on "public"."marketplace_messages";

drop policy "Autores gerem fotos dos seus anuncios" on "public"."marketplace_photos";

drop policy "Fotos de anuncios ativos visiveis" on "public"."marketplace_photos";

drop policy "plantacao_historico_access" on "public"."plantacao_historico";

drop policy "Autores do post adicionam imagens" on "public"."post_images";

drop policy "Autores do post apagam imagens" on "public"."post_images";

drop policy "Reservas alojamento - editar propria ou staff" on "public"."reservas_alojamento";

drop policy "Reservas alojamento - ver propria ou staff" on "public"."reservas_alojamento";

drop trigger "on_auth_user_created" on "auth"."users";

drop view "public"."calendar_events_public";

alter table "public"."alojamentos"
  drop constraint "alojamentos_localizacao_id_fkey";

alter table "public"."alojamentos"
  drop constraint "alojamentos_tipo_fkey";

alter table "public"."audit_log"
  drop constraint "audit_log_user_id_fkey";

alter table "public"."calendar_event_favorites"
  drop constraint "calendar_event_favorites_event_id_fkey";

alter table "public"."calendar_event_favorites"
  drop constraint "calendar_event_favorites_user_id_fkey";

alter table "public"."calendar_event_images"
  drop constraint "calendar_event_images_event_id_fkey";

alter table "public"."calendar_event_participants"
  drop constraint "calendar_event_participants_event_id_fkey";

alter table "public"."calendar_event_participants"
  drop constraint "calendar_event_participants_user_id_fkey";

alter table "public"."calendar_events"
  drop constraint "calendar_events_category_id_fkey";

alter table "public"."calendar_events"
  drop constraint "calendar_events_created_by_fkey";

alter table "public"."calendar_reminders"
  drop constraint "calendar_reminders_event_id_fkey";

alter table "public"."calendar_reminders"
  drop constraint "calendar_reminders_user_id_fkey";

alter table "public"."calendar_user_calendar"
  drop constraint "calendar_user_calendar_event_id_fkey";

alter table "public"."calendar_user_calendar"
  drop constraint "calendar_user_calendar_user_id_fkey";

alter table "public"."categories"
  drop constraint "categories_parent_id_fkey";

alter table "public"."culturas_aptidoes"
  drop constraint "culturas_aptidoes_cultura_id_fkey";

alter table "public"."culturas_produtos"
  drop constraint "culturas_produtos_cultura_id_fkey";

alter table "public"."entidade_pedidos"
  drop constraint "entidade_pedidos_categoria_id_fkey";

alter table "public"."entidade_pedidos"
  drop constraint "entidade_pedidos_entidade_id_fkey";

alter table "public"."entidade_pedidos"
  drop constraint "entidade_pedidos_freguesia_id_fkey";

alter table "public"."entidade_pedidos"
  drop constraint "entidade_pedidos_municipio_id_fkey";

alter table "public"."entidade_pedidos"
  drop constraint "entidade_pedidos_profile_id_fkey";

alter table "public"."entidade_pedidos"
  drop constraint "entidade_pedidos_resolvido_por_fkey";

alter table "public"."entidade_relacoes"
  drop constraint "entidade_relacoes_entidade_destino_id_fkey";

alter table "public"."entidade_relacoes"
  drop constraint "entidade_relacoes_entidade_origem_id_fkey";

alter table "public"."entidades"
  drop constraint "entidades_categoria_id_fkey";

alter table "public"."entidades"
  drop constraint "entidades_freguesia_id_fkey";

alter table "public"."entidades"
  drop constraint "entidades_localizacao_id_fkey";

alter table "public"."eventos"
  drop constraint "eventos_entidade_organizadora_id_fkey";

alter table "public"."eventos"
  drop constraint "eventos_freguesia_id_fkey";

alter table "public"."eventos"
  drop constraint "eventos_localizacao_id_fkey";

alter table "public"."freguesia_audit"
  drop constraint "freguesia_audit_freguesia_id_fkey";

alter table "public"."horarios"
  drop constraint "horarios_entidade_id_fkey";

alter table "public"."horarios_excecoes"
  drop constraint "horarios_excecoes_entidade_id_fkey";

alter table "public"."marketplace_ads"
  drop constraint "marketplace_ads_author_id_fkey";

alter table "public"."marketplace_ads"
  drop constraint "marketplace_ads_category_id_fkey";

alter table "public"."marketplace_ads"
  drop constraint "marketplace_ads_freguesia_id_fkey";

alter table "public"."marketplace_auction_bids"
  drop constraint "marketplace_auction_bids_auction_id_fkey";

alter table "public"."marketplace_auction_bids"
  drop constraint "marketplace_auction_bids_bidder_id_fkey";

alter table "public"."marketplace_auctions"
  drop constraint "marketplace_auctions_ad_id_fkey";

alter table "public"."marketplace_auctions"
  drop constraint "marketplace_auctions_winner_id_fkey";

alter table "public"."marketplace_conversations"
  drop constraint "marketplace_conversations_ad_id_fkey";

alter table "public"."marketplace_conversations"
  drop constraint "marketplace_conversations_buyer_id_fkey";

alter table "public"."marketplace_conversations"
  drop constraint "marketplace_conversations_seller_id_fkey";

alter table "public"."marketplace_favorites"
  drop constraint "marketplace_favorites_ad_id_fkey";

alter table "public"."marketplace_favorites"
  drop constraint "marketplace_favorites_user_id_fkey";

alter table "public"."marketplace_message_attachments"
  drop constraint "marketplace_message_attachments_message_id_fkey";

alter table "public"."marketplace_messages"
  drop constraint "marketplace_messages_conversation_id_fkey";

alter table "public"."marketplace_messages"
  drop constraint "marketplace_messages_sender_id_fkey";

alter table "public"."marketplace_photos"
  drop constraint "marketplace_photos_ad_id_fkey";

alter table "public"."notifications"
  drop constraint "notifications_user_id_fkey";

alter table "public"."plantacao_historico"
  drop constraint "plantacao_historico_plantacao_id_fkey";

alter table "public"."plantacoes"
  drop constraint "plantacoes_cultura_id_fkey";

alter table "public"."plantacoes"
  drop constraint "plantacoes_utilizador_id_fkey";

alter table "public"."post_images"
  drop constraint "post_images_post_id_fkey";

alter table "public"."posts"
  drop constraint "posts_author_id_fkey";

alter table "public"."posts"
  drop constraint "posts_thread_id_fkey";

alter table "public"."profiles"
  drop constraint "profiles_id_fkey";

alter table "public"."recovery_codes"
  drop constraint "recovery_codes_user_id_fkey";

alter table "public"."refeicoes_alojamento"
  drop constraint "refeicoes_alojamento_alojamento_id_fkey";

alter table "public"."reservas_alojamento"
  drop constraint "reservas_alojamento_alojamento_id_fkey";

alter table "public"."reservas_alojamento"
  drop constraint "reservas_alojamento_user_id_fkey";

alter table "public"."restaurante_reservas"
  drop constraint "fk_restaurante_reservas_user_id";

alter table "public"."restaurante_reservas"
  drop constraint "restaurante_reservas_restaurante_id_fkey";

alter table "public"."restaurantes"
  drop constraint "restaurantes_localizacao_fk";

alter table "public"."threads"
  drop constraint "threads_author_id_fkey";

alter table "public"."threads"
  drop constraint "threads_category_id_fkey";

alter table "public"."user_sessions"
  drop constraint "user_sessions_user_id_fkey";

alter table "public"."username_history"
  drop constraint "username_history_user_id_fkey";

drop function "public"."check_username_availability"(text);

drop function "public"."generate_username"(text);

drop function "public"."geo_distance"(double precision, double precision, double precision, double precision, character varying);

drop function "public"."gran_bazar_advance_auctions"();

drop function "public"."gran_bazar_place_bid"(bigint, numeric, text);

drop function "public"."handle_new_user"();

drop table "codigos_postais"."arteria_codigo";

drop table "codigos_postais"."arteria_local";

drop table "codigos_postais"."arteria_nome";

drop table "codigos_postais"."arteria_tipo";

drop table "codigos_postais"."arteria_titulo";

drop table "codigos_postais"."arteria";

drop table "codigos_postais"."codigo_postal_arteria";

drop table "codigos_postais"."codigo_postal";

drop table "codigos_postais"."concelho";

drop table "codigos_postais"."designacao_postal";

drop table "codigos_postais"."distrito";

drop table "codigos_postais"."localidade";

drop table "codigos_postais"."netuno_app_meta";

drop table "codigos_postais"."netuno_app_table";

drop table "codigos_postais"."netuno_app";

drop table "codigos_postais"."netuno_client_hit";

drop table "codigos_postais"."netuno_client";

drop table "codigos_postais"."netuno_design";

drop table "codigos_postais"."netuno_group_rule";

drop table "codigos_postais"."netuno_group";

drop table "codigos_postais"."netuno_log";

drop table "codigos_postais"."netuno_statistic_average_type";

drop table "codigos_postais"."netuno_statistic_average";

drop table "codigos_postais"."netuno_statistic_moment";

drop table "codigos_postais"."netuno_statistic_type";

drop table "codigos_postais"."netuno_table";

drop table "codigos_postais"."netuno_user_rule";

drop table "codigos_postais"."netuno_user";

drop table "public"."alojamentos";

drop table "public"."arteria_codigo";

drop table "public"."arteria_local";

drop table "public"."arteria_nome";

drop table "public"."arteria_tipo";

drop table "public"."arteria_titulo";

drop table "public"."arteria";

drop table "public"."audit_log";

drop table "public"."calendar_categories";

drop table "public"."calendar_event_favorites";

drop table "public"."calendar_event_images";

drop table "public"."calendar_event_participants";

drop table "public"."calendar_events";

drop function "public"."set_updated_at"();

drop table "public"."calendar_reminders";

drop table "public"."calendar_user_calendar";

drop table "public"."categorias_entidade";

drop table "public"."categories";

drop table "public"."codigo_postal_arteria";

drop table "public"."codigo_postal";

drop table "public"."codigos_postais_geo";

drop table "public"."concelho";

drop table "public"."culturas_aptidoes";

drop table "public"."culturas_guia_backup_20260819";

drop table "public"."culturas_guia_backup_20260820";

drop table "public"."culturas_guia_backup_fase7_20260820";

drop table "public"."culturas_guia";

drop table "public"."culturas_produtos";

drop table "public"."designacao_postal";

drop table "public"."distrito";

drop table "public"."entidade_pedidos";

drop function "public"."validar_entidade_pedido_participar"();

drop table "public"."entidade_relacoes";

drop table "public"."entidades";

drop table "public"."eventos";

drop table "public"."freguesia_audit";

drop table "public"."freguesias";

drop table "public"."horarios_excecoes";

drop table "public"."horarios";

drop table "public"."localidade";

drop table "public"."localizacoes";

drop table "public"."marketplace_ads";

drop function "public"."gran_bazar_create_auction_if_needed"();

drop table "public"."marketplace_auction_bids";

drop table "public"."marketplace_auctions";

drop table "public"."marketplace_categories";

drop table "public"."marketplace_conversations";

drop table "public"."marketplace_favorites";

drop table "public"."marketplace_message_attachments";

drop table "public"."marketplace_messages";

drop table "public"."marketplace_photos";

drop table "public"."municipios";

drop table "public"."netuno_app_meta";

drop table "public"."netuno_app_table";

drop table "public"."netuno_app";

drop table "public"."netuno_auth_jwt_token";

drop table "public"."netuno_client_hit";

drop table "public"."netuno_client";

drop table "public"."netuno_design";

drop table "public"."netuno_group_rule";

drop table "public"."netuno_group";

drop table "public"."netuno_log";

drop table "public"."netuno_statistic_average_type";

drop table "public"."netuno_statistic_average";

drop table "public"."netuno_statistic_moment";

drop table "public"."netuno_statistic_type";

drop table "public"."netuno_table";

drop table "public"."netuno_user_rule";

drop table "public"."netuno_user";

drop function "public"."uuid_generate_v4"();

drop table "public"."notifications";

drop table "public"."plantacao_historico";

drop table "public"."plantacoes";

drop table "public"."post_images";

drop table "public"."posts";

drop function "public"."handle_new_post"();

drop function "public"."notify_thread_author"();

drop table "public"."profiles";

drop function "public"."handle_updated_at"();

drop type "public"."user_role";

drop table "public"."recovery_codes";

drop table "public"."refeicoes_alojamento";

drop table "public"."reservas_alojamento";

drop table "public"."reserved_usernames";

drop table "public"."restaurante_reservas";

drop table "public"."restaurantes";

drop table "public"."threads";

drop table "public"."tipos_alojamento";

drop table "public"."user_sessions";

drop table "public"."username_history";

drop sequence "public"."arteria_codigo_id";

drop sequence "public"."arteria_id";

drop sequence "public"."arteria_local_id";

drop sequence "public"."arteria_nome_id";

drop sequence "public"."arteria_tipo_id";

drop sequence "public"."arteria_titulo_id";

drop sequence "public"."codigo_postal_arteria_id";

drop sequence "public"."codigo_postal_id";

drop sequence "public"."concelho_id";

drop sequence "public"."designacao_postal_id";

drop sequence "public"."distrito_id";

drop sequence "public"."localidade_id";

drop sequence "public"."netuno_app_id";

drop sequence "public"."netuno_app_meta_id";

drop sequence "public"."netuno_app_table_id";

drop sequence "public"."netuno_auth_jwt_token_id";

drop sequence "public"."netuno_client_hit_id";

drop sequence "public"."netuno_client_id";

drop sequence "public"."netuno_design_id";

drop sequence "public"."netuno_group_id";

drop sequence "public"."netuno_group_rule_id";

drop sequence "public"."netuno_log_id";

drop sequence "public"."netuno_statistic_average_id";

drop sequence "public"."netuno_statistic_average_type_id";

drop sequence "public"."netuno_statistic_moment_id";

drop sequence "public"."netuno_statistic_type_id";

drop sequence "public"."netuno_table_id";

drop sequence "public"."netuno_user_id";

drop sequence "public"."netuno_user_rule_id";

drop extension "pg_cron";

drop extension "unaccent";

drop schema "codigos_postais";

alter default privileges for role "postgres" in schema "public" grant update on sequences to "anon";

alter default privileges for role "postgres" in schema "public" grant update on sequences to "authenticated";

alter default privileges for role "postgres" in schema "public" grant update on sequences to "service_role";

alter default privileges for role "postgres" in schema "public" grant maintain, references, trigger, truncate on tables to "anon";

alter default privileges for role "postgres" in schema "public" grant maintain, references, trigger, truncate on tables to "authenticated";

alter default privileges for role "postgres" in schema "public" grant maintain, references, trigger, truncate on tables to "service_role";
