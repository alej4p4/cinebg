"""
Script utilitário para criar automaticamente as Issues padrão no GitHub
Uso:
  python scripts/create-issues.py <OWNER/REPO> <GITHUB_TOKEN>
Exemplo:
  python scripts/create-issues.py meu-usuario/cinebg ghp_meutoken123
"""

import sys
import urllib.request
import json
import ssl

ISSUES = [
    {
        "title": "fix: isolamento de sandbox no StreamPlayer para anular popups e redirecionamentos ParkLogic",
        "labels": ["bug", "fix", "player", "security"],
        "body": """## 🐛 Contexto do Problema
Iframes desprotegidos permitiam que scripts de terceiros e domínios expirados (ParkLogic) acionassem popups indesejados e redirecionassem a janela principal da aplicação via `window.top.location`.

## 🎯 Solução Implementada
- Adicionado atributo estrito `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-encrypted-media"` no iframe.
- Omissão deliberada de `allow-top-navigation` e `allow-popups`.
- Reforço do utilitário `antiRedirect.ts`.

## ✅ Critérios de Aceite
- [x] Zero redirecionamentos da aplicação principal.
- [x] Popups e novas abas bloqueados no nível de motor.
- [x] Build de produção aprovado (`npm run build`)."""
    },
    {
        "title": "improvement: motor de streaming multi-áudio dublado (PT-BR) com fallback silencioso estilo YuCine",
        "labels": ["enhancement", "improvement", "streaming", "audio"],
        "body": """## 💡 Oportunidade
Os provedores de embed anteriores possuíam apenas áudio original em inglês ou estavam com domínios caídos (rive.stream, autoembed.cc). Usuários necessitam de conteúdos em português dublado como no YuCine.

## 🚀 Solução
- Integração do motor `multiembed.mov` com suporte a servidores multi-áudio dublados.
- Eliminação de domínios mortos e vinculação de VidLink Pro e VidSrc como contingências ativas.
- Algoritmo de fallback automático silencioso (transição em segundo plano se a fonte atual demorar mais que 7s).

## ✅ Critérios de Aceite
- [x] Opção primária carrega conteúdos dublados.
- [x] Fallback automático sem travar a navegação do usuário.
- [x] Build aprovado (`npm run build`)."""
    },
    {
        "title": "improvement: simplificação da interface do player eliminando seleção técnica de servidores",
        "labels": ["enhancement", "improvement", "ui/ux"],
        "body": """## 💡 Oportunidade
Exibir servidores com nomes técnicos (Server Alpha, Server Beta, VidLink, etc.) degrada a usabilidade para o usuário leigo e para Smart TVs.

## 🚀 Solução
- Interface nativa estilo YuCine com seletor direto: [Dublado 🇧🇷] e [Original / Legendado 🇺🇸].
- O sistema escolhe a melhor fonte de forma transparente.

## ✅ Critérios de Aceite
- [x] Interface 100% limpa sem termos técnicos de provedores.
- [x] Alternância instantânea de áudio."""
    },
    {
        "title": "feat: preparação e empacotamento Android/TV via Capacitor para geração de APK instalável",
        "labels": ["feature", "android", "apk", "smart-tv"],
        "body": """## 🌟 Descrição
Configuração completa do pipeline do Capacitor 6 para exportar a aplicação Web para plataforma Android (Smart TVs, TV Box e dispositivos móveis).

## 🎯 Escopo
- Configuração de navegação D-pad / controle remoto (`@noriginmedia/norigin-spatial-navigation`).
- Script de automação `npm run build:apk`.
- Sincronização dos assets de produção com a pasta `android/`.

## ✅ Critérios de Aceite
- [ ] Execução limpa de `npx cap sync android`.
- [ ] Geração do arquivo APK funcional para instalação."""
    }
]

def main():
    if len(sys.argv) < 3:
        print("Uso: python scripts/create-issues.py <OWNER/REPO> <GITHUB_TOKEN>")
        print("Exemplo: python scripts/create-issues.py seunome/cinebg ghp_token...")
        return

    repo = sys.argv[1]
    token = sys.argv[2]
    url = f"https://api.github.com/repos/{repo}/issues"

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    for issue in ISSUES:
        print(f"Criando: {issue['title']}...")
        payload = json.dumps(issue).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CineBG-Agent-CLI',
            'Content-Type': 'application/json'
        })
        try:
            with urllib.request.urlopen(req, context=ctx) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print(f"  -> Criada com sucesso! Issue #{data.get('number')}: {data.get('html_url')}")
        except Exception as e:
            print(f"  -> Erro ao criar issue: {e}")

if __name__ == '__main__':
    main()
