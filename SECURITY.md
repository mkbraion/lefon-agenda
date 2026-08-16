# Política de Segurança

## Como o acesso aos dados é protegido

Este app não tem servidor próprio: o navegador fala direto com o Supabase.
Por isso, **toda** a autorização é feita no banco, com Row Level Security (RLS) —
nunca no JavaScript, que o usuário pode alterar.

| Camada | O que faz |
|---|---|
| **RLS em todas as tabelas** | Visitante anônimo não lê nada. Cada pessoa só enxerga o próprio perfil; a agenda é do escritório e exige login. |
| **Função `private.is_admin()`** | Fica num schema fora da API REST, então não existe endpoint `/rpc/is_admin` para sondar. |
| **Trigger `profiles_guard_privileges`** | Impede que um usuário altere o próprio cargo. Sem ele, um `update` direto na API viraria escalada para admin. |
| **Senhas** | Ficam no Supabase Auth, com hash. Nunca em tabela da aplicação. |
| **CSP + SRI** | O `index.html` declara Content-Security-Policy e o script do CDN é travado por hash (Subresource Integrity) e versão fixa — CDN comprometido não executa. |
| **Headers HTTP** | `HSTS`, `X-Content-Type-Options`, `frame-ancestors 'none'`, `Permissions-Policy` (ver `vercel.json`). |

## Chaves

A `SUPABASE_ANON_KEY` em `config.js` é **pública por design** — ela só funciona
dentro do que a RLS permite. A chave `service_role` ignora a RLS e **nunca**
pode entrar neste repositório nem em qualquer arquivo enviado ao navegador.

## Encontrou uma falha?

Abra uma issue sem detalhes sensíveis, ou escreva para **mkbraion@gmail.com**.
