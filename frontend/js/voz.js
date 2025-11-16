// js/voz.js

class SistemaVoz {
    constructor() {
        this.synth = window.speechSynthesis;
        this.estaAtivo = false;
        this.voz = null;
        this.volume = 1.0;
        this.velocidade = 1.0;
        this.tonalidade = 1.0;
        this.ultimoTexto = '';
        this.emFala = false;
        
        this.config = {
            vozesDisponiveis: [],
            vozPadrao: 'pt-BR',
            timeouts: {
                feedback: 3000,
                leituraAuto: 5000
            },
            limites: {
                maxCaracteres: 500,
                tempoMaximoFala: 30
            }
        };

        this.init();
    }

    async init() {
        try {
            await this.carregarVozes();
            this.carregarConfiguracoes();
            this.criarInterfaceControle();
            this.configurarEventListeners();
            this.configurarOuvinteVoz();
            
            console.log('🎤 Sistema de Voz inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de voz:', error);
        }
    }

    // =============================================
    // CONFIGURAÇÃO E INICIALIZAÇÃO
    // =============================================

    async carregarVozes() {
        return new Promise((resolve) => {
            const tentarCarregar = () => {
                const vozes = this.synth.getVoices();
                
                if (vozes.length > 0) {
                    this.config.vozesDisponiveis = vozes;
                    this.selecionarVozPadrao();
                    console.log(`✅ ${vozes.length} vozes carregadas`);
                    resolve(vozes);
                } else {
                    console.log('🕒 Aguardando carregamento de vozes...');
                    setTimeout(tentarCarregar, 500);
                }
            };

            // Configurar callback para quando as vozes forem carregadas
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = tentarCarregar;
            }

            // Tentar carregar imediatamente
            tentarCarregar();
        });
    }

    selecionarVozPadrao() {
        const vozes = this.config.vozesDisponiveis;
        
        // Priorizar vozes em português do Brasil
        let vozSelecionada = vozes.find(voice => 
            voice.lang.includes('pt-BR') || voice.lang === 'pt-BR'
        );

        // Se não encontrar, buscar qualquer voz em português
        if (!vozSelecionada) {
            vozSelecionada = vozes.find(voice => 
                voice.lang.includes('pt') || voice.lang.includes('PT')
            );
        }

        // Fallback para primeira voz disponível
        if (!vozSelecionada && vozes.length > 0) {
            vozSelecionada = vozes[0];
        }

        this.voz = vozSelecionada;
        
        if (vozSelecionada) {
            console.log(`🗣️ Voz selecionada: ${vozSelecionada.name} (${vozSelecionada.lang})`);
        } else {
            console.warn('⚠️ Nenhuma voz disponível encontrada');
        }
    }

    carregarConfiguracoes() {
        const configSalva = localStorage.getItem('bytewave_voz_config');
        
        if (configSalva) {
            try {
                const config = JSON.parse(configSalva);
                this.estaAtivo = config.estaAtivo || false;
                this.volume = config.volume || 1.0;
                this.velocidade = config.velocidade || 1.0;
                this.tonalidade = config.tonalidade || 1.0;
                
                // Tentar restaurar voz selecionada
                if (config.vozId && this.config.vozesDisponiveis.length > 0) {
                    const vozSalva = this.config.vozesDisponiveis.find(v => 
                        v.voiceURI === config.vozId
                    );
                    if (vozSalva) this.voz = vozSalva;
                }
            } catch (error) {
                console.error('Erro ao carregar configurações de voz:', error);
            }
        }
    }

    salvarConfiguracoes() {
        const config = {
            estaAtivo: this.estaAtivo,
            volume: this.volume,
            velocidade: this.velocidade,
            tonalidade: this.tonalidade,
            vozId: this.voz ? this.voz.voiceURI : null,
            ultimaAtualizacao: new Date().toISOString()
        };

        localStorage.setItem('bytewave_voz_config', JSON.stringify(config));
    }

    // =============================================
    // INTERFACE DE CONTROLE
    // =============================================

    criarInterfaceControle() {
        // Remover controles anteriores se existirem
        this.removerInterfaceExistente();

        // Criar container principal
        this.container = document.createElement('div');
        this.container.id = 'sistema-voz-container';
        this.container.className = 'sistema-voz-container';

        // Criar botão de toggle principal
        this.botaoPrincipal = this.criarBotaoPrincipal();
        this.container.appendChild(this.botaoPrincipal);

        // Criar painel de controle expandido
        this.painelControle = this.criarPainelControle();
        this.container.appendChild(this.painelControle);

        document.body.appendChild(this.container);

        // Atualizar estado visual
        this.atualizarInterface();
    }

    criarBotaoPrincipal() {
        const botao = document.createElement('button');
        botao.id = 'botao-voz-principal';
        botao.className = 'botao-voz-principal';
        botao.setAttribute('aria-label', 'Controle de acessibilidade por voz');
        botao.setAttribute('aria-expanded', 'false');
        
        botao.innerHTML = `
            <span class="icone-voz">
                <i class="fas fa-assistive-listening-systems"></i>
            </span>
            <span class="status-voz">${this.estaAtivo ? 'ON' : 'OFF'}</span>
        `;

        botao.addEventListener('click', (e) => {
            e.stopPropagation();
            this.alternar();
        });

        botao.addEventListener('mouseenter', () => {
            if (!this.estaAtivo) {
                this.mostrarDica('Clique para ativar acessibilidade por voz');
            }
        });

        return botao;
    }

    criarPainelControle() {
        const painel = document.createElement('div');
        painel.id = 'painel-controle-voz';
        painel.className = 'painel-controle-voz hidden';
        painel.setAttribute('aria-hidden', 'true');

        painel.innerHTML = `
            <div class="cabecalho-painel">
                <h4><i class="fas fa-universal-access"></i> Controle de Voz</h4>
                <button class="btn-fechar-painel" aria-label="Fechar painel">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="controles-voz">
                <!-- Seletor de Voz -->
                <div class="controle-grupo">
                    <label for="seletor-voz">
                        <i class="fas fa-microphone"></i> Voz
                    </label>
                    <select id="seletor-voz" class="controle-select">
                        <option value="">Carregando vozes...</option>
                    </select>
                </div>

                <!-- Controle de Volume -->
                <div class="controle-grupo">
                    <label for="controle-volume">
                        <i class="fas fa-volume-up"></i> Volume
                    </label>
                    <div class="controle-range-container">
                        <input type="range" id="controle-volume" class="controle-range" 
                               min="0" max="1" step="0.1" value="${this.volume}">
                        <span class="valor-range">${Math.round(this.volume * 100)}%</span>
                    </div>
                </div>

                <!-- Controle de Velocidade -->
                <div class="controle-grupo">
                    <label for="controle-velocidade">
                        <i class="fas fa-tachometer-alt"></i> Velocidade
                    </label>
                    <div class="controle-range-container">
                        <input type="range" id="controle-velocidade" class="controle-range" 
                               min="0.5" max="2" step="0.1" value="${this.velocidade}">
                        <span class="valor-range">${this.velocidade}x</span>
                    </div>
                </div>

                <!-- Controle de Tonalidade -->
                <div class="controle-grupo">
                    <label for="controle-tonalidade">
                        <i class="fas fa-music"></i> Tom
                    </label>
                    <div class="controle-range-container">
                        <input type="range" id="controle-tonalidade" class="controle-range" 
                               min="0.5" max="2" step="0.1" value="${this.tonalidade}">
                        <span class="valor-range">${this.tonalidade}</span>
                    </div>
                </div>

                <!-- Botões de Ação -->
                <div class="botoes-acao">
                    <button id="btn-testar-voz" class="btn btn-secondary btn-pequeno">
                        <i class="fas fa-play"></i> Testar Voz
                    </button>
                    <button id="btn-parar-voz" class="btn btn-danger btn-pequeno">
                        <i class="fas fa-stop"></i> Parar
                    </button>
                    <button id="btn-ler-pagina" class="btn btn-primary btn-pequeno">
                        <i class="fas fa-book-reader"></i> Ler Página
                    </button>
                </div>

                <!-- Modo de Leitura -->
                <div class="controle-grupo">
                    <label class="checkbox-label">
                        <input type="checkbox" id="modo-leitura-auto" ${this.estaAtivo ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Modo de leitura automática
                    </label>
                </div>

                <!-- Estatísticas -->
                <div class="estatisticas-voz">
                    <div class="estatistica-item">
                        <i class="fas fa-clock"></i>
                        <span>Status: <strong id="status-voz">${this.estaAtivo ? 'Ativo' : 'Inativo'}</strong></span>
                    </div>
                </div>
            </div>
        `;

        // Configurar event listeners do painel
        this.configurarPainelControles(painel);

        return painel;
    }

    configurarPainelControles(painel) {
        // Fechar painel
        painel.querySelector('.btn-fechar-painel').addEventListener('click', () => {
            this.fecharPainel();
        });

        // Seletor de voz
        const seletorVoz = painel.querySelector('#seletor-voz');
        this.preencherSeletorVoz(seletorVoz);

        seletorVoz.addEventListener('change', (e) => {
            const vozId = e.target.value;
            this.alterarVoz(vozId);
        });

        // Controles de range
        ['volume', 'velocidade', 'tonalidade'].forEach(tipo => {
            const controle = painel.querySelector(`#controle-${tipo}`);
            const valorDisplay = controle.parentNode.querySelector('.valor-range');

            controle.addEventListener('input', (e) => {
                const valor = parseFloat(e.target.value);
                this[`${tipo}`] = valor;
                
                // Atualizar display
                if (tipo === 'volume') {
                    valorDisplay.textContent = `${Math.round(valor * 100)}%`;
                } else if (tipo === 'velocidade') {
                    valorDisplay.textContent = `${valor}x`;
                } else {
                    valorDisplay.textContent = valor;
                }

                this.salvarConfiguracoes();
            });
        });

        // Botões de ação
        painel.querySelector('#btn-testar-voz').addEventListener('click', () => {
            this.testarVoz();
        });

        painel.querySelector('#btn-parar-voz').addEventListener('click', () => {
            this.parar();
        });

        painel.querySelector('#btn-ler-pagina').addEventListener('click', () => {
            this.lerConteudoPagina();
        });

        // Modo leitura automática
        painel.querySelector('#modo-leitura-auto').addEventListener('change', (e) => {
            this.estaAtivo = e.target.checked;
            this.salvarConfiguracoes();
            this.atualizarInterface();
            this.configurarLeituraAutomatica();
        });

        // Fechar painel ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.fecharPainel();
            }
        });
    }

    preencherSeletorVoz(seletor) {
        seletor.innerHTML = '';

        if (this.config.vozesDisponiveis.length === 0) {
            seletor.innerHTML = '<option value="">Nenhuma voz disponível</option>';
            return;
        }

        this.config.vozesDisponiveis.forEach((voz, index) => {
            const option = document.createElement('option');
            option.value = voz.voiceURI;
            option.textContent = `${voz.name} (${voz.lang}) ${voz.default ? ' - Padrão' : ''}`;
            
            if (this.voz && voz.voiceURI === this.voz.voiceURI) {
                option.selected = true;
            }

            seletor.appendChild(option);
        });
    }

    // =============================================
    // CONTROLE PRINCIPAL DA VOZ
    // =============================================

    alternar() {
        this.estaAtivo = !this.estaAtivo;
        this.salvarConfiguracoes();
        this.atualizarInterface();
        this.configurarLeituraAutomatica();

        if (this.estaAtivo) {
            this.falar('Acessibilidade por voz ativada. Navegação por voz habilitada.');
            this.mostrarFeedback('Acessibilidade ativada', 'success');
            this.abrirPainel(); // Abrir painel ao ativar
        } else {
            this.parar();
            this.mostrarFeedback('Acessibilidade desativada', 'info');
            this.fecharPainel(); // Fechar painel ao desativar
        }

        return this.estaAtivo;
    }

    ativar() {
        if (!this.estaAtivo) {
            this.alternar();
        }
    }

    desativar() {
        if (this.estaAtivo) {
            this.alternar();
        }
    }

    falar(texto, interromper = true, prioridade = 'normal') {
        if (!this.estaAtivo || !texto || this.emFala && prioridade === 'baixa') {
            return false;
        }

        // Limitar tamanho do texto para evitar problemas de performance
        if (texto.length > this.config.limites.maxCaracteres) {
            texto = texto.substring(0, this.config.limites.maxCaracteres) + '...';
        }

        // Evitar repetição do mesmo texto rapidamente
        if (interromper && texto === this.ultimoTexto && this.emFala) {
            return false;
        }

        if (interromper) {
            this.parar();
        }

        this.ultimoTexto = texto;
        this.emFala = true;

        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(texto);
            
            // Configurar voz
            if (this.voz) {
                utterance.voice = this.voz;
            }
            
            // Configurar parâmetros
            utterance.lang = 'pt-BR';
            utterance.rate = this.velocidade;
            utterance.pitch = this.tonalidade;
            utterance.volume = this.volume;

            // Event listeners
            utterance.onend = () => {
                this.emFala = false;
                this.ultimaFala = Date.now();
                resolve(true);
            };

            utterance.onerror = (event) => {
                console.error('Erro na síntese de voz:', event);
                this.emFala = false;
                this.mostrarFeedback('Erro na síntese de voz', 'error');
                resolve(false);
            };

            utterance.onstart = () => {
                this.atualizarStatusVoz('Falando...');
            };

            // Timeout de segurança
            setTimeout(() => {
                if (this.emFala) {
                    this.parar();
                    resolve(false);
                }
            }, this.config.limites.tempoMaximoFala * 1000);

            this.synth.speak(utterance);
        });
    }

    parar() {
        if (this.synth.speaking) {
            this.synth.cancel();
            this.emFala = false;
            this.atualizarStatusVoz('Parado');
        }
    }

    pausar() {
        if (this.synth.speaking && !this.synth.paused) {
            this.synth.pause();
            this.atualizarStatusVoz('Pausado');
        }
    }

    continuar() {
        if (this.synth.speaking && this.synth.paused) {
            this.synth.resume();
            this.atualizarStatusVoz('Falando...');
        }
    }

    // =============================================
    // FUNÇÕES DE LEITURA AUTOMÁTICA
    // =============================================

    configurarLeituraAutomatica() {
        // Limpar listeners anteriores
        this.removerListenersLeitura();

        if (!this.estaAtivo) {
            return;
        }

        // Ler títulos quando focados
        const titulos = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        titulos.forEach(titulo => {
            titulo.setAttribute('tabindex', '0');
            titulo.setAttribute('role', 'heading');
            titulo.setAttribute('aria-live', 'polite');

            titulo.addEventListener('focus', () => {
                this.falar(titulo.textContent, true, 'alta');
            });

            titulo.addEventListener('mouseenter', () => {
                if (this.config.modoLeituraHover) {
                    this.falar(titulo.textContent, true, 'baixa');
                }
            });
        });

        // Ler cards e atividades
        const elementosInterativos = document.querySelectorAll(
            '.card, .activity-item, .course-card, .post-card, .stat-card'
        );
        
        elementosInterativos.forEach(elemento => {
            elemento.setAttribute('tabindex', '0');
            elemento.setAttribute('role', 'article');

            elemento.addEventListener('focus', () => {
                const texto = this.extrairTextoElemento(elemento);
                this.falar(texto, true, 'normal');
            });
        });

        // Ler botões e links
        const botoes = document.querySelectorAll('button, a, .btn, [role="button"]');
        botoes.forEach(botao => {
            botao.addEventListener('focus', () => {
                const texto = botao.textContent || 
                             botao.getAttribute('aria-label') || 
                             botao.title || 
                             'Botão';
                this.falar(texto, true, 'baixa');
            });
        });

        // Ler formulários
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`) ||
                         input.previousElementSibling;
            
            input.addEventListener('focus', () => {
                let texto = input.getAttribute('placeholder') || 
                           input.getAttribute('aria-label') || 
                           'Campo de entrada';
                
                if (label && label.textContent) {
                    texto = `${label.textContent}. ${texto}`;
                }

                this.falar(texto, true, 'baixa');
            });

            input.addEventListener('change', () => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    const estado = input.checked ? 'marcado' : 'desmarcado';
                    this.falar(`${texto} ${estado}`, false, 'baixa');
                }
            });
        });

        console.log('🎯 Leitura automática configurada');
    }

    configurarOuvinteVoz() {
        // Reconhecimento de voz para comandos (se suportado)
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.configurarReconhecimentoVoz();
        }
    }

    configurarReconhecimentoVoz() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognizer = new SpeechRecognition();
            
            this.recognizer.continuous = false;
            this.recognizer.interimResults = false;
            this.recognizer.lang = 'pt-BR';

            this.recognizer.onresult = (event) => {
                const comando = event.results[0][0].transcript.toLowerCase();
                this.processarComandoVoz(comando);
            };

            this.recognizer.onerror = (event) => {
                console.log('Erro no reconhecimento de voz:', event.error);
            };

        } catch (error) {
            console.log('Reconhecimento de voz não suportado:', error);
        }
    }

    processarComandoVoz(comando) {
        if (!this.estaAtivo) return;

        console.log('🎤 Comando de voz:', comando);

        const comandos = {
            'parar': () => this.parar(),
            'pausar': () => this.pausar(),
            'continuar': () => this.continuar(),
            'ler página': () => this.lerConteudoPagina(),
            'ajuda': () => this.mostrarAjudaVoz(),
            'início': () => showTab('inicio'),
            'atividades': () => showTab('atividades'),
            'trabalhos': () => showTab('trabalhos'),
            'cursos': () => showTab('cursos')
        };

        for (const [key, action] of Object.entries(comandos)) {
            if (comando.includes(key)) {
                action();
                this.falar(`Executando comando: ${key}`);
                break;
            }
        }
    }

    // =============================================
    // FUNÇÕES DE LEITURA DE CONTEÚDO
    // =============================================

    async lerConteudoPagina() {
        if (!this.estaAtivo) return;

        const elementos = this.selecionarConteudoPrincipal();
        let conteudoCompleto = '';

        for (const elemento of elementos) {
            const texto = this.extrairTextoElemento(elemento);
            if (texto) {
                conteudoCompleto += texto + '. ';
            }
        }

        if (conteudoCompleto) {
            await this.falar('Conteúdo da página: ' + conteudoCompleto);
        } else {
            this.falar('Nenhum conteúdo encontrado para leitura.');
        }
    }

    selecionarConteudoPrincipal() {
        const seletores = [
            '.tab-content .fade-in:not(.hidden)',
            '.card h1, .card h2, .card h3',
            '.activity-item',
            '.stat-card',
            '.post-card'
        ];

        const elementos = [];
        seletores.forEach(seletor => {
            document.querySelectorAll(seletor).forEach(el => {
                if (this.isElementVisible(el)) {
                    elementos.push(el);
                }
            });
        });

        return elementos.slice(0, 10); // Limitar para não sobrecarregar
    }

    extrairTextoElemento(elemento) {
        // Clonar elemento para remover elementos indesejados
        const clone = elemento.cloneNode(true);
        
        // Remover elementos interativos e scripts
        const elementosRemover = clone.querySelectorAll(
            'script, style, button, .btn, nav, footer, .actions, .activity-actions'
        );
        
        elementosRemover.forEach(el => el.remove());
        
        // Extrair texto limpo
        let texto = clone.textContent
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200); // Limitar tamanho

        return texto;
    }

    isElementVisible(el) {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               el.offsetParent !== null;
    }

    // =============================================
    // FUNÇÕES AUXILIARES
    // =============================================

    alterarVoz(vozId) {
        const voz = this.config.vozesDisponiveis.find(v => v.voiceURI === vozId);
        if (voz) {
            this.voz = voz;
            this.salvarConfiguracoes();
            this.mostrarFeedback(`Voz alterada para: ${voz.name}`, 'success');
        }
    }

    testarVoz() {
        const textosTeste = [
            "Sistema de acessibilidade por voz funcionando corretamente.",
            "Você pode navegar usando o teclado e ouvir a descrição dos elementos.",
            "Use os controles para ajustar volume, velocidade e tonalidade."
        ];

        let index = 0;
        
        const falarProximo = () => {
            if (index < textosTeste.length) {
                this.falar(textosTeste[index], true, 'alta').then(() => {
                    index++;
                    setTimeout(falarProximo, 1000);
                });
            }
        };

        falarProximo();
    }

    atualizarInterface() {
        if (!this.botaoPrincipal) return;

        // Atualizar botão principal
        this.botaoPrincipal.classList.toggle('ativo', this.estaAtivo);
        this.botaoPrincipal.setAttribute('aria-expanded', this.estaAtivo.toString());
        
        const statusEl = this.botaoPrincipal.querySelector('.status-voz');
        if (statusEl) {
            statusEl.textContent = this.estaAtivo ? 'ON' : 'OFF';
        }

        const iconEl = this.botaoPrincipal.querySelector('.icone-voz i');
        if (iconEl) {
            iconEl.className = this.estaAtivo ? 
                'fas fa-assistive-listening-systems' : 
                'fas fa-microphone-slash';
        }

        // Atualizar painel
        if (this.painelControle) {
            const statusVoz = this.painelControle.querySelector('#status-voz');
            if (statusVoz) {
                statusVoz.textContent = this.estaAtivo ? 'Ativo' : 'Inativo';
                statusVoz.className = this.estaAtivo ? 'status-ativo' : 'status-inativo';
            }

            const checkbox = this.painelControle.querySelector('#modo-leitura-auto');
            if (checkbox) {
                checkbox.checked = this.estaAtivo;
            }
        }
    }

    atualizarStatusVoz(status) {
        if (this.painelControle) {
            const statusEl = this.painelControle.querySelector('#status-voz');
            if (statusEl) {
                statusEl.textContent = status;
                
                // Adicionar classe baseada no status
                statusEl.className = '';
                if (status.includes('Falando')) statusEl.classList.add('status-falando');
                else if (status.includes('Parado')) statusEl.classList.add('status-parado');
                else if (status.includes('Pausado')) statusEl.classList.add('status-pausado');
            }
        }
    }

    abrirPainel() {
        if (this.painelControle) {
            this.painelControle.classList.remove('hidden');
            this.painelControle.setAttribute('aria-hidden', 'false');
            this.botaoPrincipal.setAttribute('aria-expanded', 'true');
        }
    }

    fecharPainel() {
        if (this.painelControle) {
            this.painelControle.classList.add('hidden');
            this.painelControle.setAttribute('aria-hidden', 'true');
            this.botaoPrincipal.setAttribute('aria-expanded', 'false');
        }
    }

    togglePainel() {
        if (this.painelControle.classList.contains('hidden')) {
            this.abrirPainel();
        } else {
            this.fecharPainel();
        }
    }

    mostrarFeedback(mensagem, tipo = 'info') {
        // Remover feedback anterior
        this.removerFeedbackExistente();

        const feedback = document.createElement('div');
        feedback.id = 'feedback-voz';
        feedback.className = `feedback-voz feedback-${tipo}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        feedback.innerHTML = `
            <i class="fas ${icons[tipo] || icons.info}"></i>
            <span>${mensagem}</span>
        `;

        document.body.appendChild(feedback);

        // Mostrar animação
        setTimeout(() => feedback.classList.add('show'), 100);

        // Remover após timeout
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 300);
        }, this.config.timeouts.feedback);
    }

    mostrarDica(mensagem) {
        if (!this.estaAtivo) {
            this.mostrarFeedback(mensagem, 'info');
        }
    }

    mostrarAjudaVoz() {
        const comandos = `
            Comandos disponíveis: 
            "Parar" - Para a fala atual,
            "Pausar" - Pausa a fala,
            "Continuar" - Continua a fala,
            "Ler página" - Lê o conteúdo principal,
            "Início", "Atividades", "Trabalhos", "Cursos" - Navega entre abas
        `;

        this.falar(comandos, true, 'alta');
    }

    // =============================================
    // LIMPEZA E GERENCIAMENTO DE MEMÓRIA
    // =============================================

    removerListenersLeitura() {
        // Esta função seria implementada para remover event listeners específicos
        // Em uma implementação real, você guardaria as referências dos listeners
    }

    removerInterfaceExistente() {
        const existing = document.getElementById('sistema-voz-container');
        if (existing) {
            existing.remove();
        }
    }

    removerFeedbackExistente() {
        const existing = document.getElementById('feedback-voz');
        if (existing) {
            existing.remove();
        }
    }

    destruir() {
        this.parar();
        this.removerListenersLeitura();
        this.removerInterfaceExistente();
        this.removerFeedbackExistente();
        
        if (this.recognizer) {
            this.recognizer.abort();
        }
    }

    // =============================================
    // GETTERS E UTILITÁRIOS
    // =============================================

    getVozesDisponiveis() {
        return this.config.vozesDisponiveis;
    }

    getStatus() {
        return {
            ativo: this.estaAtivo,
            falando: this.emFala,
            vozAtual: this.voz ? this.voz.name : null,
            volume: this.volume,
            velocidade: this.velocidade,
            tonalidade: this.tonalidade
        };
    }

    isSuportado() {
        return 'speechSynthesis' in window;
    }

    // =============================================
    // STATIC METHODS
    // =============================================

    static criarInstancia() {
        if (!window.sistemaVozInstancia) {
            window.sistemaVozInstancia = new SistemaVoz();
        }
        return window.sistemaVozInstancia;
    }

    static getInstancia() {
        return window.sistemaVozInstancia || this.criarInstancia();
    }
}

// =============================================
// INICIALIZAÇÃO E FUNÇÕES GLOBAIS
// =============================================

// Criar instância global
const sistemaVoz = SistemaVoz.criarInstancia();

// Funções globais para uso no HTML
window.sistemaVoz = sistemaVoz;

window.toggleSistemaVoz = function() {
    sistemaVoz.alternar();
}

window.ativarSistemaVoz = function() {
    sistemaVoz.ativar();
}

window.desativarSistemaVoz = function() {
    sistemaVoz.desativar();
}

window.falarTexto = function(texto, interromper = true) {
    return sistemaVoz.falar(texto, interromper);
}

// Exportar para uso em outros módulos
window.SistemaVoz = SistemaVoz;

console.log('🎤 Módulo de voz carregado e pronto!');