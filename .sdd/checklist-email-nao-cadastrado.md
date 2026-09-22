# Checklist — "Email não cadastrado" na tela de esqueci senha

Mesma mudança nos 3 fronts, só troca o valor de `expectedRole`. O endpoint é sempre `POST /api/auth/password-reset/request`.

---

## App Motorista

Na tela de "Esqueci minha senha", no envio do e-mail:

```json
POST /api/auth/password-reset/request
{ "email": "motorista@exemplo.com", "expectedRole": "Driver" }
```

Tratar a resposta:
- **`202`** → seguir pra tela de "digite o código recebido" (normal, como já é hoje).
- **`404`** → mostrar o erro na própria tela, sem navegar: **"Email não cadastrado."** (usar o texto que vem em `error` na resposta).
- **`429`** → **"Muitas tentativas. Tente novamente mais tarde."**

## App Passageiro

Igual ao motorista, só muda o `expectedRole`:

```json
POST /api/auth/password-reset/request
{ "email": "passageiro@exemplo.com", "expectedRole": "Passenger" }
```

Mesmo tratamento de `202` / `404` / `429` acima.

## Painel Web (Moto Web)

```json
POST /api/auth/password-reset/request
{ "email": "admin@jacarei.sp.gov.br", "expectedRole": "GlobalAdmin" }
```

Mesmo tratamento de `202` / `404` / `429` acima.

---

## Ponto de atenção pros três

Se o e-mail existir só **no banco de outro perfil** (ex: alguém tenta resetar senha de admin pela tela do app motorista), a resposta também é `404 "Email não cadastrado."` — é comportamento esperado, não bug. O backend trata "e-mail não existe" e "e-mail existe mas com outra role" exatamente igual, de propósito.

## Sem mudança nas telas seguintes

As telas de "digite o código" (`/verify-code`) e "nova senha" (`/confirm`) já estavam descritas no documento anterior — nada muda ali por causa dessa atualização.
