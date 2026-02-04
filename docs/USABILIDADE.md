# Documentação técnica de usabilidade

## Objetivo
A Calculadora de Sustentabilidade permite cadastrar materiais, montar um conjunto de itens de um projeto e calcular a pegada de carbono total em $kgCO_2eq$.

## Público-alvo
- Usuários finais (alunos, pesquisadores, gestores de projetos)
- Administradores de catálogo

## Requisitos mínimos
- Navegador moderno (Chrome, Edge, Firefox, Safari)
- Conexão com a API local (por padrão http://localhost:4000)

## Acesso
1. Inicie o frontend e o backend conforme o [README.md](README.md).
2. Acesse o frontend (URL exibida pelo Vite).
3. Faça login ou crie uma conta.

> A primeira conta criada via cadastro também recebe permissão de administrador.

## Navegação principal
### 1) Autenticação
- **Entrar**: informe email e senha.
- **Cadastrar**: registre um novo usuário.
- Validações:
  - Email obrigatório
  - Senha com pelo menos 6 caracteres

### 2) Catálogo de materiais
- **Abrir catálogo**: botão de acesso na tela principal.
- **Filtrar**: por categoria ou por termo de busca.
- **Visualizar**: lista com id, nome, categoria, unidade, pegada de carbono e custo.
- **Criar** (admin ou usuário): preencha id, nome, unidade e coeficiente de carbono.
- **Editar**: clique em editar um material e altere campos.
- **Excluir**: remove um material (confirmação requerida).

**Permissões**
- Usuário comum: acessa apenas materiais do próprio usuário.
- Administrador: acessa materiais globais (sem user_id) e seus próprios.

### 3) Itens do projeto
- **Adicionar item**: selecione um material e informe a quantidade.
- **Remover item**: exclua itens adicionados antes do cálculo.
- **Total de itens**: exibido no resumo.

### 4) Cálculo de impacto
- **Calcular**: envia os itens para a API.
- **Fórmula**: para cada item, $impacto = quantidade \times pegada\_carbono$.
- **Resultado**: total em $kgCO_2eq$.
- **Detalhamento**: tabela com impacto por material e gráficos (barras e rosca).

### 5) Exportação
- **Excel**: exporta o detalhamento e o total do projeto.

### 6) Tema e status
- **Tema**: alternância claro/escuro no botão flutuante.
- **Status de rede**: indicador online/offline para orientação do usuário.

## Boas práticas de uso
- Padronize unidades (ex.: kg, m², m³) para consistência na comparação.
- Mantenha o catálogo de materiais organizado por categoria.
- Use nomes descritivos para facilitar busca e auditoria.

## Mensagens comuns e resolução
- **Falha ao carregar materiais**: verifique se a API está disponível.
- **Falha ao autenticar**: confirme email e senha.
- **Falha ao salvar/remover material**: confirme permissão e conexão.
- **Erro de cálculo**: verifique se há itens e materiais válidos.

## Limitações conhecidas
- A aplicação depende da disponibilidade do backend local.
- Não há controle de versão de catálogo; alterações são imediatas.

## Suporte
Registre problemas no repositório ou contate o responsável técnico do projeto.
