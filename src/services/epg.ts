// =========================================================================
// GUIA DE PROGRAMAÇÃO ELETRÔNICA (EPG) — CINEBG LIVE TV
// -------------------------------------------------------------------------
// Calcula a programação em tempo real no Horário de Brasília (America/Sao_Paulo)
// para todos os canais (Abertos, Esportes, Filmes, Notícias, Infantil).
// =========================================================================

export interface EPGProgram {
  title: string
  description?: string
  start: string
  end: string
  startMinutes: number
  endMinutes: number
  category?: string
  progress: number // 0 a 100
  nextTitle: string
}

// Grade padrão baseada em faixas horárias diárias por categoria / ID de canal
interface ChannelScheduleSlot {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  title: string
  category: string
  description?: string
}

const SCHEDULE_PATTERNS: Record<string, ChannelScheduleSlot[]> = {
  // GLOBO (Padrão de grade nacional / SP / RJ)
  globo: [
    { startHour: 6, startMinute: 0, endHour: 7, endMinute: 30, title: 'Bom Dia Praça', category: 'Jornalismo' },
    { startHour: 7, startMinute: 30, endHour: 8, endMinute: 30, title: 'Bom Dia Brasil', category: 'Jornalismo' },
    { startHour: 8, startMinute: 30, endHour: 10, endMinute: 15, title: 'Encontro com Patrícia Poeta', category: 'Variedades' },
    { startHour: 10, startMinute: 15, endHour: 11, endMinute: 45, title: 'Mais Você com Ana Maria Braga', category: 'Culinária' },
    { startHour: 11, startMinute: 45, endHour: 13, endMinute: 0, title: 'Praça TV 1ª Edição', category: 'Jornalismo' },
    { startHour: 13, startMinute: 0, endHour: 13, endMinute: 45, title: 'Globo Esporte', category: 'Esportes' },
    { startHour: 13, startMinute: 45, endHour: 14, endMinute: 45, title: 'Jornal Hoje', category: 'Jornalismo' },
    { startHour: 14, startMinute: 45, endHour: 15, endMinute: 30, title: 'Edição Especial: Novela', category: 'Novela' },
    { startHour: 15, startMinute: 30, endHour: 17, endMinute: 15, title: 'Sessão da Tarde: Cinema', category: 'Filme' },
    { startHour: 17, startMinute: 15, endHour: 18, endMinute: 20, title: 'Vale a Pena Ver de Novo', category: 'Novela' },
    { startHour: 18, startMinute: 20, endHour: 19, endMinute: 15, title: 'Novela das Seis', category: 'Novela' },
    { startHour: 19, startMinute: 15, endHour: 20, endMinute: 0, title: 'Praça TV 2ª Edição', category: 'Jornalismo' },
    { startHour: 20, startMinute: 0, endHour: 20, endMinute: 40, title: 'Novela das Sete', category: 'Novela' },
    { startHour: 20, startMinute: 40, endHour: 21, endMinute: 25, title: 'Jornal Nacional', category: 'Jornalismo' },
    { startHour: 21, startMinute: 25, endHour: 22, endMinute: 35, title: 'Novela das Nove', category: 'Novela' },
    { startHour: 22, startMinute: 35, endHour: 23, endMinute: 45, title: 'Futebol Ao Vivo / Linha de Shows', category: 'Ao Vivo' },
    { startHour: 23, startMinute: 45, endHour: 24, endMinute: 45, title: 'Jornal da Globo', category: 'Jornalismo' },
    { startHour: 0, startMinute: 45, endHour: 2, endMinute: 0, title: 'Conversa com Bial / Série', category: 'Entrevistas' },
    { startHour: 2, startMinute: 0, endHour: 6, endMinute: 0, title: 'Corujão: Grandes Filmes', category: 'Filme' },
  ],

  // SBT
  sbt: [
    { startHour: 6, startMinute: 0, endHour: 9, endMinute: 30, title: 'Primeiro Impacto Ao Vivo', category: 'Jornalismo' },
    { startHour: 9, startMinute: 30, endHour: 11, endMinute: 15, title: 'Chega Mais', category: 'Variedades' },
    { startHour: 11, startMinute: 15, endHour: 13, endMinute: 0, title: 'SBT Brasil 1ª Edição', category: 'Jornalismo' },
    { startHour: 13, startMinute: 0, endHour: 14, endMinute: 15, title: 'Chaves / Séries Clássicas', category: 'Comédia' },
    { startHour: 14, startMinute: 15, endHour: 15, endMinute: 30, title: 'Novela da Tarde I', category: 'Novela' },
    { startHour: 15, startMinute: 30, endHour: 16, endMinute: 45, title: 'Fofocalizando Ao Vivo', category: 'Entretenimento' },
    { startHour: 16, startMinute: 45, endHour: 18, endMinute: 0, title: 'Novelas da Tarde II', category: 'Novela' },
    { startHour: 18, startMinute: 0, endHour: 19, endMinute: 45, title: 'Tá na Hora Ao Vivo', category: 'Jornalismo' },
    { startHour: 19, startMinute: 45, endHour: 20, endMinute: 30, title: 'SBT Brasil com César Filho', category: 'Jornalismo' },
    { startHour: 20, startMinute: 30, endHour: 21, endMinute: 30, title: 'Novela Infantil SBT', category: 'Novela' },
    { startHour: 21, startMinute: 30, endHour: 23, endMinute: 0, title: 'Programa do Ratinho Ao Vivo', category: 'Auditório' },
    { startHour: 23, startMinute: 0, endHour: 0, endMinute: 30, title: 'The Noite com Danilo Gentili', category: 'Talk Show' },
    { startHour: 0, startMinute: 30, endHour: 2, endMinute: 0, title: 'Operação Mesquita / SBT PodNight', category: 'Variedades' },
    { startHour: 2, startMinute: 0, endHour: 6, endMinute: 0, title: 'SBT News na Madrugada', category: 'Jornalismo' },
  ],

  // CANAIS DE FILMES (HBO, MAX, TELECINE, CINEMAX, PARAMOUNT)
  filmes: [
    { startHour: 6, startMinute: 0, endHour: 8, endMinute: 0, title: 'Sessão Matinal: Aventura & Ficção', category: 'Filme' },
    { startHour: 8, startMinute: 0, endHour: 10, endMinute: 15, title: 'Comédias de Sucesso', category: 'Filme' },
    { startHour: 10, startMinute: 15, endHour: 12, endMinute: 30, title: 'Drama & Suspense Internacional', category: 'Filme' },
    { startHour: 12, startMinute: 30, endHour: 14, endMinute: 45, title: 'Especial Grandes Sucessos', category: 'Filme' },
    { startHour: 14, startMinute: 45, endHour: 17, endMinute: 0, title: 'Cinema em Casa: Ação sem Limites', category: 'Filme' },
    { startHour: 17, startMinute: 0, endHour: 19, endMinute: 15, title: 'Blockbuster da Tarde', category: 'Filme' },
    { startHour: 19, startMinute: 15, endHour: 21, endMinute: 30, title: 'Superestreia da Noite', category: 'Filme' },
    { startHour: 21, startMinute: 30, endHour: 23, endMinute: 45, title: 'Cine Prime: Filmes Premiados', category: 'Filme' },
    { startHour: 23, startMinute: 45, endHour: 2, endMinute: 0, title: 'Madrugada de Terror & Suspense', category: 'Filme' },
    { startHour: 2, startMinute: 0, endHour: 6, endMinute: 0, title: 'Clássicos Imortais do Cinema', category: 'Filme' },
  ],

  // ESPORTES (SPORTV, PREMIERE, ESPN, TNT SPORTS)
  esportes: [
    { startHour: 6, startMinute: 0, endHour: 9, endMinute: 0, title: 'Redação: Notícias & Bastidores', category: 'Jornalismo' },
    { startHour: 9, startMinute: 0, endHour: 11, endMinute: 0, title: 'Melhores Momentos da Rodada', category: 'Futebol' },
    { startHour: 11, startMinute: 0, endHour: 13, endMinute: 0, title: 'Sportv News / Giro da Rodada', category: 'Jornalismo' },
    { startHour: 13, startMinute: 0, endHour: 15, endMinute: 30, title: 'Futebol Internacional Ao Vivo', category: 'Ao Vivo' },
    { startHour: 15, startMinute: 30, endHour: 17, endMinute: 30, title: 'Pré-Jogo & Análise Tática', category: 'Debate' },
    { startHour: 17, startMinute: 30, endHour: 19, endMinute: 30, title: 'Tá na Área / Bate-Bola Ao Vivo', category: 'Debate' },
    { startHour: 19, startMinute: 30, endHour: 22, endMinute: 0, title: 'Campeonato Brasileiro: Jogo Ao Vivo', category: 'Ao Vivo' },
    { startHour: 22, startMinute: 0, endHour: 23, endMinute: 45, title: 'Troca de Passes / Linha de Passe', category: 'Debate' },
    { startHour: 23, startMinute: 45, endHour: 2, endMinute: 0, title: 'Compacto dos Jogos do Dia', category: 'Futebol' },
    { startHour: 2, startMinute: 0, endHour: 6, endMinute: 0, title: 'VT Completo: Grande Final Histórica', category: 'Especial' },
  ],

  // INFANTIL (CARTOON, DISCOVERY KIDS, GLOOB, NICKELODEON)
  infantil: [
    { startHour: 6, startMinute: 0, endHour: 8, endMinute: 0, title: 'Bom Dia com Desenhos Favoritos', category: 'Animação' },
    { startHour: 8, startMinute: 0, endHour: 10, endMinute: 30, title: 'Aventuras Mágicas & Diversão', category: 'Infantil' },
    { startHour: 10, startMinute: 30, endHour: 12, endMinute: 30, title: 'Maratona: Séries Infantis', category: 'Infantil' },
    { startHour: 12, startMinute: 30, endHour: 14, endMinute: 30, title: 'Cine Kids: Animação Completa', category: 'Filme' },
    { startHour: 14, startMinute: 30, endHour: 17, endMinute: 0, title: 'Episódios Inéditos & Aventuras', category: 'Animação' },
    { startHour: 17, startMinute: 0, endHour: 19, endMinute: 30, title: 'Super-Heróis & Grandes Missões', category: 'Ação' },
    { startHour: 19, startMinute: 30, endHour: 21, endMinute: 30, title: 'Sessão Cinema em Família', category: 'Família' },
    { startHour: 21, startMinute: 30, endHour: 24, endMinute: 0, title: 'Clássicos Animados & Histórias', category: 'Animação' },
    { startHour: 0, startMinute: 0, endHour: 6, endMinute: 0, title: 'Noite de Histórias & Sonhos', category: 'Infantil' },
  ],

  // NOTÍCIAS (GLOBO NEWS, CNN BRASIL, BAND NEWS, RECORD NEWS)
  noticias: [
    { startHour: 6, startMinute: 0, endHour: 9, endMinute: 0, title: 'Jornal das Seis Ao Vivo', category: 'Notícias' },
    { startHour: 9, startMinute: 0, endHour: 12, endMinute: 0, title: 'Conexão Notícias: Ao Vivo no Brasil', category: 'Notícias' },
    { startHour: 12, startMinute: 0, endHour: 15, endMinute: 0, title: 'Edição do Meio-Dia', category: 'Economia' },
    { startHour: 15, startMinute: 0, endHour: 18, endMinute: 0, title: 'Debate Político & Noticiário Geral', category: 'Política' },
    { startHour: 18, startMinute: 0, endHour: 20, endMinute: 0, title: 'Edição das 18h Ao Vivo', category: 'Notícias' },
    { startHour: 20, startMinute: 0, endHour: 22, endMinute: 0, title: 'Grande Análise com Especialistas', category: 'Opinião' },
    { startHour: 22, startMinute: 0, endHour: 24, endMinute: 0, title: 'Jornal da Noite Completo', category: 'Notícias' },
    { startHour: 0, startMinute: 0, endHour: 6, endMinute: 0, title: 'Giro Mundial & Reprise dos Destaques', category: 'Internacional' },
  ],
}

/**
 * Obtém a hora e minuto atual no fuso de Brasília.
 */
function getBrasiliaMinutes(): { hour: number; minute: number; totalMinutes: number } {
  const now = new Date()
  const brasiliaStr = now.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
  const [hStr, mStr] = brasiliaStr.split(':')
  const hour = parseInt(hStr || '12', 10)
  const minute = parseInt(mStr || '0', 10)
  return {
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
  }
}

/**
 * Retorna o padrão de grade ideal para um canal específico.
 */
function getPatternForChannel(channelId: string, category: string): ChannelScheduleSlot[] {
  const cid = channelId.toLowerCase()
  if (cid.includes('globo')) return SCHEDULE_PATTERNS.globo
  if (cid.includes('sbt')) return SCHEDULE_PATTERNS.sbt
  if (category === 'esportes' || cid.includes('sportv') || cid.includes('premiere') || cid.includes('espn')) {
    return SCHEDULE_PATTERNS.esportes
  }
  if (category === 'filmes' || cid.includes('hbo') || cid.includes('telecine') || cid.includes('cinemax') || cid.includes('paramount')) {
    return SCHEDULE_PATTERNS.filmes
  }
  if (category === 'infantil' || cid.includes('cartoon') || cid.includes('kids') || cid.includes('gloob')) {
    return SCHEDULE_PATTERNS.infantil
  }
  if (category === 'noticias' || cid.includes('news') || cid.includes('cnn')) {
    return SCHEDULE_PATTERNS.noticias
  }
  return SCHEDULE_PATTERNS.filmes
}

const formatTime = (h: number, m: number): string => {
  const padH = h.toString().padStart(2, '0')
  const padM = m.toString().padStart(2, '0')
  return `${padH}:${padM}`
}

/**
 * Retorna as informações do programa no ar agora e do próximo programa para um canal.
 */
export function getLiveChannelEPG(channelId: string, category: string, channelName?: string): EPGProgram {
  const { totalMinutes } = getBrasiliaMinutes()
  const pattern = getPatternForChannel(channelId, category)

  // Encontra o slot que compreende o minuto atual
  for (let i = 0; i < pattern.length; i++) {
    const slot = pattern[i]
    let startMin = slot.startHour * 60 + slot.startMinute
    let endMin = slot.endHour * 60 + slot.endMinute

    // Caso o programa cruze a meia-noite (ex: 23:45 -> 02:00)
    if (endMin < startMin) {
      endMin += 24 * 60
    }

    let currentMinAdjusted = totalMinutes
    if (currentMinAdjusted < startMin && slot.startHour > 18) {
      // Ajuste para pós meia-noite
      currentMinAdjusted += 24 * 60
    }

    if (currentMinAdjusted >= startMin && currentMinAdjusted < endMin) {
      const duration = endMin - startMin
      const elapsed = currentMinAdjusted - startMin
      const progress = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)))

      const nextSlot = pattern[(i + 1) % pattern.length]
      const nextTitle = `${formatTime(nextSlot.startHour, nextSlot.startMinute)} - ${nextSlot.title}`

      let displayTitle = slot.title
      if (channelName && (category === 'filmes' || category === 'esportes')) {
        // Personaliza com o nome do canal se relevante
        if (channelName.includes('HBO')) {
          displayTitle = displayTitle.replace('Cinema em Casa', 'Cine HBO').replace('Superestreia', 'Sessão HBO Max')
        } else if (channelName.includes('Telecine')) {
          displayTitle = displayTitle.replace('Superestreia', 'Sessão Superestreia Telecine')
        } else if (channelName.includes('Premiere')) {
          displayTitle = displayTitle.replace('Campeonato Brasileiro', 'Premiere Ao Vivo: Rodada')
        }
      }

      return {
        title: displayTitle,
        category: slot.category,
        start: formatTime(slot.startHour, slot.startMinute),
        end: formatTime(slot.endHour % 24, slot.endMinute),
        startMinutes: startMin,
        endMinutes: endMin,
        progress,
        nextTitle,
      }
    }
  }

  // Fallback padrão se não encontrar faixa
  return {
    title: 'Transmissão Ao Vivo Oficial',
    category: 'Ao Vivo',
    start: '10:00',
    end: '12:00',
    startMinutes: 600,
    endMinutes: 720,
    progress: 50,
    nextTitle: '12:00 - Programação Especial',
  }
}
