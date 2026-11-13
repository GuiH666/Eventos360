# Checklist de testes — Eventos 360

Aparelho: ______________ · Android: ______ · Build testado: ☐ Development ☐ APK (preview) ☐ AAB · Versão: ______ · Data: ___/___/_____ · Testador: ______________

Marque **OK** ou **FALHOU** e anote a observação. Guarde um print dos itens marcados com 📷.

## A. Instalação e abertura
| # | Teste | Resultado esperado | Resultado |
|---|---|---|---|
| A1 | Instalar o APK | Instala sem erro e o ícone de calendário aparece | |
| A2 | Abrir o app (1ª vez, com internet) | Esqueleto de carregamento e depois a lista de eventos 📷 | |
| A3 | Fechar e abrir de novo | Lista aparece na hora (cópia salva) e atualiza em seguida | |

## B. Lista, busca e filtros (FlatList)
| # | Teste | Resultado esperado | Resultado |
|---|---|---|---|
| B1 | Rolar a lista | Rola fluida; cada cartão mostra data, título, local, modalidade 📷 | |
| B2 | Filtrar por categoria "Oficina" | Só oficinas | |
| B3 | Filtrar por modalidade "Online" | Só online; combinar com categoria funciona | |
| B4 | Filtrar por data "Próximos 7 dias" e "Mês que vem" | Só eventos da janela | |
| B5 | Buscar "react" e "19/11" | Encontra a Oficina de React Native | |
| B6 | Buscar "zzz" | "Nenhum evento encontrado" + Limpar filtros 📷 | |
| B7 | Puxar a lista para baixo | Indicador de atualização e lista recarregada | |

## C. Eventos encerrados e indisponíveis
| # | Teste | Resultado esperado | Resultado |
|---|---|---|---|
| C1 | Ativar "Mostrar encerrados" | Aparecem 4 eventos com selo "Encerrado", esmaecidos 📷 | |
| C2 | Abrir um evento encerrado | Aviso explicativo e botão "Evento encerrado" desativado | |
| C3 | Abrir o evento esgotado (Workshop: Currículo e LinkedIn) | Selo "Esgotado" e inscrição bloqueada | |
| C4 | Abrir o evento cancelado (Encontro de Egressos) | Título riscado, aviso vermelho, inscrição bloqueada 📷 | |

## D. Detalhes e favoritos (persistência)
| # | Teste | Resultado esperado | Resultado |
|---|---|---|---|
| D1 | Abrir um evento | Detalhes completos: data, local, vagas com barra, descrição 📷 | |
| D2 | Tocar no coração | Toast "Favoritado · lembrete …" e vibração | |
| D3 | Aba Favoritos | O evento aparece com o lembrete ligado 📷 | |
| D4 | Fechar totalmente o app e reabrir | Favorito continua lá | |
| D5 | Remover dos favoritos | Some da aba; lembrete cancelado | |
| D6 | Compartilhar | Abre a folha de compartilhamento com título, data e local | |

## E. Formulário de inscrição (validação)
| # | Teste | Resultado esperado | Resultado |
|---|---|---|---|
| E1 | Confirmar com tudo vazio | Erros em nome, e-mail, curso e termo 📷 | |
| E2 | Nome "Ana" | "Informe nome e sobrenome." | |
| E3 | E-mail "ana@x" | Mensagem de e-mail inválido | |
| E4 | Telefone "123" | Mensagem de DDD + número; máscara (11) 91234-5678 ao digitar | |
| E5 | "Tenho interesse" sem curso | Curso vira opcional | |
| E6 | Preencher corretamente e confirmar | Volta ao detalhe, toast "Inscrição confirmada" e selo verde "Você está inscrito" 📷 | |
| E7 | Aba Inscrições | Registro aparece; Cancelar pede confirmação e remove | |
| E8 | Inscrever o mesmo e-mail no mesmo evento | "Este e-mail já está registrado neste evento." | |
| E9 | Teclado aberto | Campo focado nunca fica escondido atrás do teclado | |

## F. Notificação local e permissão
| # | Teste | Resultado esperado | Resultado |
|---|---|---|---|
| F1 | Favoritar com permissão ainda não pedida | Alerta explicativo "Receber lembretes?" antes do pedido do sistema 📷 | |
| F2 | Negar a permissão | Evento favoritado, toast "lembrete desativado (sem permissão)"; Ajustes mostra "Pendente"/"Bloqueada" | |
| F3 | Ajustes → Permitir notificações / Abrir configurações | Pede de novo ou abre as configurações do app; ao voltar, status "Ativa" | |
| F4 | Ajustes → Enviar notificação de teste (minimizar o app) | Notificação aparece em ~5 s 📷 | |
| F5 | Tocar na notificação | App abre direto nos detalhes do evento | |
| F6 | Trocar antecedência (1 dia / 1 h / 15 min) | Toast "N lembretes refeitos"; horário muda na aba Favoritos | |

## G. Falhas de comunicação
| # | Teste | Resultado esperado | Resultado |
|---|---|---|---|
| G1 | Modo avião + abrir o app (já tendo aberto antes) | Lista da cópia salva + faixa "Sem conexão… mostrando eventos salvos" 📷 | |
| G2 | Desligar o modo avião e tocar "Tentar de novo" | Faixa some, origem "API (online)" em Ajustes | |
| G3 | Limpar dados do app (Configurações do Android) + modo avião + abrir | Tela de erro "Sem conexão com a API" + Tentar novamente 📷 | |

## H. Aparência e plataforma
| # | Teste | Resultado esperado | Resultado |
|---|---|---|---|
| H1 | Ajustes → Claro / Escuro / Automático | Tema troca e é lembrado ao reabrir; dados não são perdidos 📷 | |
| H2 | Barra de status nos detalhes | Ícones legíveis sobre a faixa colorida | |
| H3 | Botão voltar do Android | Fecha modal / volta de tela; nunca fecha o app no meio do fluxo | |
