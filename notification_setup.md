# 📧 Configuração do Sistema de Notificações Automáticas

Este documento explica como configurar o sistema de notificações automáticas do CRM Treinos MP para enviar lembretes por email sobre eventos do dia seguinte.

## 🔧 Configuração das Variáveis de Ambiente

### 1. Token de Segurança (OBRIGATÓRIO)

Para proteger o endpoint de notificações automáticas, configure um token seguro:

```bash
export NOTIFICATIONS_CRON_TOKEN="seu-token-super-secreto-e-seguro-aqui"
```

**⚠️ IMPORTANTE**: Use um token longo e aleatório. Exemplo:

```bash
export NOTIFICATIONS_CRON_TOKEN="$(openssl rand -hex 32)"
```

### 2. Configuração do Scheduler Interno (OPCIONAL)

O sistema inclui um scheduler interno que pode ser habilitado:

```bash
# Habilitar scheduler interno
export NOTIFICATIONS_SCHEDULER_ENABLED="true"

# Configurar horário de envio (padrão: 20:00)
export NOTIFICATIONS_HOUR="20"           # Hora (0-23)
export NOTIFICATIONS_MINUTE="0"          # Minuto (0-59)

# Intervalo de verificação (padrão: 60 minutos)
export NOTIFICATIONS_CHECK_INTERVAL="60"
```

### 3. Tokens do Replit Mail (AUTOMÁTICO)

O sistema usa automaticamente os tokens de ambiente do Replit:

- `REPL_IDENTITY` ou `WEB_REPL_RENEWAL` (configurados automaticamente pelo Replit)

## 🤖 Opções de Automação

### Opção 1: Scheduler Interno (Recomendado)

O mais simples é usar o scheduler interno:

1. Configure as variáveis de ambiente:

```bash
export NOTIFICATIONS_SCHEDULER_ENABLED="true"
export NOTIFICATIONS_HOUR="20"
export NOTIFICATIONS_MINUTE="0"
export NOTIFICATIONS_CRON_TOKEN="$(openssl rand -hex 32)"
```

2. Reinicie a aplicação - o scheduler iniciará automaticamente

3. Verifique os logs para confirmar:

```
[SCHEDULER] Starting notification scheduler - will check every 60 minutes
[SCHEDULER] Configured to send notifications at 20:00
```

### Opção 2: Cron Job Externo

Para maior controle, use um cron job externo:

1. Configure o token:

```bash
echo "seu-token-secreto" > /tmp/notification_token
```

2. Configure o cron job para executar diariamente às 20:00:

```bash
crontab -e
```

Adicione a linha:

```
0 20 * * * /caminho/para/cron-notification.sh
```

3. Torne o script executável:

```bash
chmod +x cron-notification.sh
```

### Opção 3: Serviços de Automação Externa

Use serviços como GitHub Actions, Zapier, ou IFTTT para fazer requisições HTTP diárias:

**Endpoint**: `POST /api/notifications/automated`
**Headers**:

```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

## 📊 Monitoramento e Status

### Verificar Status do Scheduler

Acesse: `GET /api/notifications/status` (endpoint pode ser adicionado)

### Testar Manualmente

Professores podem testar o sistema:

1. **Preview de notificações**: `GET /api/notifications/preview`
2. **Envio manual**: `POST /api/notifications/send`

### Logs para Monitoramento

Procure por estas marcações nos logs:

```
[SCHEDULER] - Atividade do scheduler interno
[NOTIFICATION] - Processamento de notificações
```

## 🔐 Segurança

### Proteções Implementadas

- **Token obrigatório**: Endpoint `/api/notifications/automated` protegido
- **Comparação timing-safe**: Previne ataques de timing
- **Sem vazamento de logs**: Tokens não aparecem nos logs
- **Validação de ambiente**: Falha segura se mal configurado

### Boas Práticas

1. **Use tokens longos e aleatórios**
2. **Monitore os logs regularmente**
3. **Configure alertas para falhas**
4. **Teste periodicamente**

## 🚨 Solução de Problemas

### Erro: "Notification service not configured"

- Verifique se `NOTIFICATIONS_CRON_TOKEN` está configurado

### Erro: "Unauthorized - Invalid token"

- Verifique se o token enviado corresponde ao configurado

### Notificações não sendo enviadas

- Verifique os logs por erros do Replit Mail
- Confirme que há eventos para amanhã
- Verifique se `reminderSent` não está marcado como `true`

### Scheduler interno não funciona

- Confirme `NOTIFICATIONS_SCHEDULER_ENABLED="true"`
- Verifique horário configurado em `NOTIFICATIONS_HOUR`
- Procure logs `[SCHEDULER]`

## 📝 Exemplo de Configuração Completa

```bash
# .env ou variáveis de ambiente
NOTIFICATIONS_CRON_TOKEN="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
NOTIFICATIONS_SCHEDULER_ENABLED="true"
NOTIFICATIONS_HOUR="20"
NOTIFICATIONS_MINUTE="0"
NOTIFICATIONS_CHECK_INTERVAL="60"
```

Com essa configuração, o sistema enviará automaticamente notificações todos os dias às 20:00 para eventos do dia seguinte.
