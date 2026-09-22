# Contexto para o time de frontend — Reset de senha + política de senha

Mudanças no backend (branch `hotfix-login`) que quebram contrato com endpoints antigos. Precisa de ajuste no app (motorista/passageiro) e no painel web onde tiver fluxo de "esqueci minha senha" ou criação/edição de conta com senha.

---

## 1. Novo fluxo de reset de senha — agora em DUAS etapas

O endpoint `POST /api/auth/password-reset/confirm` **mudou de contrato** e agora exige passar por um endpoint novo antes.

### Fluxo antigo (não funciona mais)
```
POST /api/auth/password-reset/confirm
{ "email": "...", "code": "123456", "newPassword": "..." }
```

### Fluxo novo — tela 1: usuário digita o código recebido por e-mail

```
POST /api/auth/password-reset/verify-code
{ "email": "user@example.com", "code": "123456" }
```

**Sucesso (200):**
```json
{ "resetToken": "8f4a1c2e-...-guid" }
```
Guarda esse `resetToken` (em memória/estado de navegação — **não precisa persistir em storage**, é de uso único e expira em 10 minutos). Navega pra tela 2.

**Erros possíveis:**
| Status | Quando |
|---|---|
| `400` | Código inválido ou expirado (`{ "error": "..." }`) |
| `409` | Código já foi usado |
| `429` | Muitas tentativas erradas pro mesmo e-mail (proteção contra força-bruta — bloqueia por 30 min) |

### Tela 2 — definir a nova senha

```
POST /api/auth/password-reset/confirm
{ "resetToken": "8f4a1c2e-...-guid", "newPassword": "NovaSenha#123" }
```

Repara: **não manda mais `email` nem `code`** nessa etapa — só o `resetToken` da tela 1 + a senha nova.

**Sucesso:** `200`, sem corpo.

**Erros possíveis:**
| Status | Quando |
|---|---|
| `400` | Token inválido/expirado, ou senha não cumpre a política (mensagem detalhada em `error`) |
| `409` | Token já foi usado |

**Importante — o `resetToken` expira em 10 minutos** contados a partir da verificação do código (tela 1). Se o usuário demorar demais na tela 2, mostrar erro e mandar ele repetir a tela 1 (pedir o código de novo, se necessário).

### `POST /api/auth/password-reset/request` — sem mudança de contrato
Continua igual: `{ "email": "..." }` → sempre `202`. Limite de **3 pedidos por e-mail por hora** (já existia). Se der `429`, mostrar algo como *"Você já solicitou várias vezes. Tente novamente em 1 hora."*

---

## 2. Requisitos de senha — agora unificados e reforçados

Antes, a criação de conta (admin criando motorista/passageiro, autocadastro) **não validava nada de força de senha** — só tamanho mínimo. Agora todo lugar que define senha (criação de conta E reset) usa a mesma regra:

- 8 a 72 caracteres
- pelo menos 1 letra **maiúscula**
- pelo menos 1 letra **minúscula**
- pelo menos 1 **número**
- pelo menos 1 **caractere especial** (`!@#$%^&*()...` — qualquer coisa que não seja letra/número/espaço)

**Senhas já cadastradas não são afetadas** — ninguém é forçado a trocar, a regra só vale pra senha nova sendo definida agora.

### Endpoint novo pra buscar as regras dinamicamente

```
GET /api/auth/password-policy
```
Não exige autenticação. Resposta:
```json
{
  "minLength": 8,
  "maxLength": 72,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireDigit": true,
  "requireSpecialChar": true
}
```

**Uso recomendado:** chamar esse endpoint na tela de criação de conta e na tela 2 do reset de senha, pra montar dinamicamente a lista de requisitos exibida ao usuário (ex: checklist "✓ 8+ caracteres · ✓ 1 maiúscula · ✗ 1 caractere especial", atualizando em tempo real enquanto digita). Assim, se a regra mudar no backend no futuro, o app não precisa de deploy novo pra refletir.

Se preferir não integrar agora, pode fixar o texto estático: **"Mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial."** — mas o endpoint existe pra evitar esse tipo de regra hardcoded duplicada divergir do backend com o tempo.

### Erros de senha fraca

Tanto na criação de conta quanto no reset (`confirm`), se a senha não cumprir a regra, vem `400` com mensagem já formatada e concatenada, ex:
```json
{ "error": "A senha deve conter ao menos uma letra maiúscula. A senha deve conter ao menos um caractere especial (ex: ! @ # $ % &)." }
```
Pode exibir essa string direto, ou (melhor) usar o `GET /api/auth/password-policy` pra validar client-side ANTES de submeter, evitando até bater no backend com senha fraca.

---

## 3. Limite de tentativas — o que muda na prática pro usuário

- **Pedir código novo:** máx. 3 vezes por e-mail, por hora (sem mudança — já existia).
- **Confirmar o código (tela 1, novo `verify-code`):** máx. **5 tentativas erradas** por e-mail, dentro de 30 minutos (mesmo tempo de vida do código). Depois de 5 erros, mesmo que o usuário digite o código certo na 6ª vez, o backend responde `429` — precisa esperar a janela passar ou pedir um código novo (o que, ao gerar um código novo, começa uma nova janela).

Recomendo no app: contar os erros localmente também e, a partir da 3ª tentativa errada, já avisar "restam N tentativas antes de precisar pedir um novo código" — melhora a percepção, já que o app não recebe esse contador do backend (só sabe que bateu no limite quando toma o 429).

---

## Resumo das mudanças de endpoint

| Endpoint | Mudança |
|---|---|
| `POST /api/auth/password-reset/request` | Sem mudança de contrato |
| `POST /api/auth/password-reset/verify-code` | **Novo** — tela 1 |
| `POST /api/auth/password-reset/confirm` | **Contrato mudou**: agora `{ resetToken, newPassword }` em vez de `{ email, code, newPassword }` |
| `GET /api/auth/password-policy` | **Novo** — público, sem auth |
