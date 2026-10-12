<!-- MKBRAION-POLISH:START -->
<div align="center">

# Lefon Agenda

**Sistema web de agenda e gestão de visitas para equipes imobiliárias, utilizando Supabase, PostgreSQL e Row Level Security.**

[![Repositório](https://img.shields.io/badge/GitHub-Repositório-181717?logo=github)](https://github.com/mkbraion/lefon-agenda) [![Demo ao vivo](https://img.shields.io/badge/Demo-Abrir%20aplicação-2ea44f?logo=vercel)](https://mkbraion.github.io/lefon-agenda/)

</div>

**Stack / tópicos:** ``authentication`` · ``crm`` · ``css`` · ``frontend`` · ``html`` · ``javascript`` · ``nextjs`` · ``postgresql`` · ``real-estate`` · ``row-level-security`` · ``scheduling`` · ``security``

> Projeto mantido por [@mkbraion](https://github.com/mkbraion).
<!-- MKBRAION-POLISH:END -->

# Lefon Agenda

Agenda de visitas para equipes de corretores, com interface em HTML, CSS e JavaScript e integração com Supabase.

## Organização

- `index.html`, `app.css` e `app.js`: interface e interações.
- [data.js](data.js): acesso a dados e modo local de demonstração.
- [schema.sql](schema.sql): estrutura e regras de acesso ao banco.
- [config.js](config.js): configuração do cliente Supabase.
- `site/`: landing page separada em Next.js.

O aplicativo inclui consulta de CEP via ViaCEP e links para WhatsApp, Gmail e Google Calendar. Esses links abrem os serviços; não representam uma integração de envio autenticada por API.

## Configuração

Consulte [SETUP.md](SETUP.md) para conectar uma instância Supabase e publicar o app, e [SECURITY.md](SECURITY.md) para as regras de acesso.

Os [lembretes WhatsApp](WHATSAPP-REMINDERS.md) têm configuração separada. O código da Edge Function citada nesse documento não está neste repositório; sua presença e ativação devem ser verificadas no ambiente correspondente.

