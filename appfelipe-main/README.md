# App Felipe

Este é um projeto desenvolvido com Next.js e Supabase, utilizando TypeScript e Tailwind CSS.

## Estrutura do Projeto

- `/src/app` - Páginas da aplicação
- `/src/components` - Componentes reutilizáveis
- `/src/lib` - Utilitários e configurações
- `/src/types` - Definições de tipos TypeScript
- `/src/styles` - Estilos globais

## Requisitos

- Node.js 18.x ou superior
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase
```

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Build

Para criar uma build de produção:

```bash
npm run build
# ou
yarn build
```

## Iniciar em Produção

```bash
npm run start
# ou
yarn start
```

## Tecnologias Utilizadas

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- React Hook Form
- Zod 