// js/atividades.js

class AtividadesService {
    constructor() {
        this.sistemaAtividades = new SistemaAtividades();
        this.estadosAtividades = new Map();
        this.init();
    }

    init() {
        this.carregarEstados();
        this.configurarEventListeners();
        console.log('📚 Serviço de Atividades inicializado');
    }

    configurarEventListeners() {
        // Event listeners para ações de atividades
        document.addEventListener('click', (e) => {
            // Delegação de eventos para elementos dinâmicos
            if (e.target.matches('[data-action="entregar-trabalho"]')) {
                const idAtividade = e.target.dataset.id;
                this.entregarTrabalho(idAtividade);
            }

            if (e.target.matches('[data-action="ver-detalhes-entrega"]')) {
                const idAtividade = e.target.dataset.id;
                this.verDetalhesEntrega(idAtividade);
            }

            if (e.target.matches('[data-action="editar-atividade"]')) {
                const idAtividade = e.target.dataset.id;
                this.editarAtividade(idAtividade);
            }

            if (e.target.matches('[data-action="concluir-atividade"]')) {
                const idAtividade = e.target.dataset.id;
                this.marcarComoConcluida(idAtividade);
            }
        });

        // Observar mudanças no DOM para novas atividades
        this.configurarObserver();
    }

    configurarObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('activity-item')) {
                            this.configurarAcessibilidadeAtividade(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.getElementById('atividades-list'), {
            childList: true,
            subtree: true
        });
    }

    configurarAcessibilidadeAtividade(element) {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'article');
        element.setAttribute('aria-label', `Atividade: ${element.querySelector('h4')?.textContent || 'Sem título'}`);

        element.addEventListener('focus', () => {
            if (sistemaVoz.estaAtivo) {
                const texto = this.extrairTextoAcessibilidade(element);
                sistemaVoz.falar(texto);
            }
        });
    }

    extrairTextoAcessibilidade(element) {
        const titulo = element.querySelector('h4')?.textContent || 'Atividade sem título';
        const descricao = element.querySelector('p')?.textContent || 'Sem descrição';
        const professor = element.querySelector('[data-info="professor"]')?.textContent || '';
        const dataEntrega = element.querySelector('[data-info="data-entrega"]')?.textContent || '';
        const status = element.querySelector('.badge')?.textContent || '';

        return `${titulo}. ${descricao}. Professor: ${professor}. Data de entrega: ${dataEntrega}. Status: ${status}`;
    }

    // =============================================
    // CARREGAMENTO DE ATIVIDADES
    // =============================================

    async carregarAtividades() {
        try {
            console.log('🚀 Buscando atividades do banco de dados...');
            
            this.mostrarLoadingAtividades();

            const data = await APIUtils.get('/atividades');
            
            if (data.success && data.data) {
                console.log(`✅ ${data.data.length} atividades carregadas do banco`);
                await this.renderizarAtividades(data.data);
            } else {
                console.log('❌ Nenhuma atividade no banco');
                await this.renderizarAtividades([]);
            }

        } catch (error) {
            console.error('💥 Erro ao carregar atividades:', error);
            await this.renderizarAtividades([]);
        }
    }

    mostrarLoadingAtividades() {
        const loadingHTML = `
            <div class="text-center" style="color: var(--text-secondary); padding: 40px;">
                <div class="loading" style="margin: 20px auto;"></div>
                <br>Carregando atividades do banco de dados...
            </div>
        `;
        DOMUtils.setInnerHTML('atividades-list', loadingHTML);
    }

    async renderizarAtividades(atividades) {
        const list = document.getElementById('atividades-list');
        
        console.log('🎨 Renderizando atividades:', atividades);
        
        if (!atividades || atividades.length === 0) {
            this.renderizarListaVazia();
            return;
        }

        // Ordenar atividades por data de entrega
        atividades.sort((a, b) => new Date(a.data_entrega) - new Date(b.data_entrega));

        const estatisticas = this.calcularEstatisticas(atividades);
        list.innerHTML = this.criarCabecalhoAtividades(estatisticas);

        // Renderizar cada atividade de forma assíncrona
        for (const atividade of atividades) {
            try {
                const atividadeElement = await this.criarElementoAtividade(atividade);
                list.appendChild(atividadeElement);
                
                // Animar entrada
                setTimeout(() => {
                    atividadeElement.style.opacity = '1';
                    atividadeElement.style.transform = 'translateY(0)';
                }, 100);
            } catch (error) {
                console.error('Erro ao renderizar atividade:', atividade.id, error);
            }
        }

        // Aplicar estados salvos (concluídas, etc.)
        this.sistemaAtividades.aplicarEstadosSalvos();
    }

    calcularEstatisticas(atividades) {
        const agora = new Date();
        const atividadesPendentes = atividades.filter(a => {
            const dataEntrega = new Date(a.data_entrega);
            return dataEntrega > agora;
        }).length;

        const atividadesAtrasadas = atividades.filter(a => {
            const dataEntrega = new Date(a.data_entrega);
            return dataEntrega < agora;
        }).length;

        const atividadesHoje = atividades.filter(a => {
            const dataEntrega = new Date(a.data_entrega);
            const hoje = new Date();
            return dataEntrega.toDateString() === hoje.toDateString();
        }).length;

        return {
            total: atividades.length,
            pendentes: atividadesPendentes,
            atrasadas: atividadesAtrasadas,
            hoje: atividadesHoje
        };
    }

    criarCabecalhoAtividades(estatisticas) {
        const badgeClass = estatisticas.atrasadas > 0 ? 'badge-danger' : 'badge-primary';
        
        return `
            <div class="card mb-4">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-tasks"></i> 
                            Atividades Pendentes
                            <span class="badge ${badgeClass}">${estatisticas.pendentes}</span>
                        </h4>
                        <div style="display: flex; gap: 15px; margin-top: 8px; flex-wrap: wrap;">
                            <small style="color: var(--text-secondary);">
                                <i class="fas fa-calendar-day" style="color: var(--warning);"></i>
                                Hoje: ${estatisticas.hoje}
                            </small>
                            <small style="color: var(--text-secondary);">
                                <i class="fas fa-clock" style="color: var(--danger);"></i>
                                Atrasadas: ${estatisticas.atrasadas}
                            </small>
                            <small style="color: var(--text-secondary);">
                                <i class="fas fa-list" style="color: var(--primary);"></i>
                                Total: ${estatisticas.total}
                            </small>
                        </div>
                    </div>
                    ${currentUser && currentUser.tipo === 'professor' ? `
                        <button onclick="atividadesService.criarNovaAtividade()" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Nova Atividade
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderizarListaVazia() {
        const emptyHTML = `
            <div class="text-center" style="color: var(--text-secondary); padding: 40px;">
                <i class="fas fa-calendar-plus" style="font-size: 48px; margin-bottom: 16px;"></i>
                <br>
                <h3>Nenhuma atividade cadastrada</h3>
                <p>Quando professores criarem atividades, elas aparecerão aqui.</p>
                ${currentUser && currentUser.tipo === 'professor' ? `
                    <button onclick="atividadesService.criarNovaAtividade()" class="btn btn-primary mt-3">
                        <i class="fas fa-plus"></i>
                        Criar Primeira Atividade
                    </button>
                ` : ''}
            </div>
        `;
        DOMUtils.setInnerHTML('atividades-list', emptyHTML);
    }

    // =============================================
    // CRIAÇÃO DE ELEMENTOS DE ATIVIDADE
    // =============================================

    async criarElementoAtividade(atividade) {
        const element = DOMUtils.createElement('div', {
            'class': 'activity-item',
            'data-atividade-id': atividade.id,
            'data-tipo': atividade.tipo,
            'style': 'opacity: 0; transform: translateY(20px); transition: all 0.3s ease;'
        });

        const trabalhoEntregue = await this.verificarTrabalhoEntregue(atividade.id);
        const dataEntrega = new Date(atividade.data_entrega);
        const diasRestantes = DateUtils.getDaysRemaining(atividade.data_entrega);
        
        const statusInfo = this.obterStatusAtividade(diasRestantes);
        const tipoInfo = this.obterInfoTipo(atividade.tipo);
        const prioridade = this.calcularPrioridade(diasRestantes);
        
        // Adicionar classes baseadas no estado
        if (trabalhoEntregue) {
            element.classList.add('trabalho-entregue', 'concluida');
        }
        
        if (prioridade === 'alta') {
            element.classList.add('prioridade-alta');
        }

        element.innerHTML = this.criarHTMLAtividade(atividade, trabalhoEntregue, dataEntrega, statusInfo, tipoInfo, prioridade);
        
        // Configurar acessibilidade
        this.configurarAcessibilidadeAtividade(element);
        
        return element;
    }

    criarHTMLAtividade(atividade, trabalhoEntregue, dataEntrega, statusInfo, tipoInfo, prioridade) {
        const isProfessor = currentUser && (currentUser.tipo === 'professor' || currentUser.tipo === 'admin');
        
        return `
            <div class="activity-header">
                <div class="activity-title-section">
                    <h4 class="activity-title">
                        <i class="fas ${tipoInfo.icone}" style="color: ${trabalhoEntregue ? 'var(--success)' : tipoInfo.cor};"></i>
                        ${this.escapeHTML(atividade.titulo)}
                        ${trabalhoEntregue ? ' <i class="fas fa-check-circle success-icon" title="Trabalho entregue"></i>' : ''}
                        ${prioridade === 'alta' ? ' <i class="fas fa-exclamation-triangle warning-icon" title="Alta prioridade"></i>' : ''}
                    </h4>
                    <p class="activity-description">${this.escapeHTML(atividade.descricao || 'Sem descrição')}</p>
                </div>
                <div class="activity-status-section">
                    <span class="badge ${statusInfo.classe}">${statusInfo.texto}</span>
                    ${trabalhoEntregue ? `
                        <span class="badge badge-success">
                            <i class="fas fa-check"></i> Entregue
                        </span>
                    ` : ''}
                </div>
            </div>
            
            <div class="activity-details">
                <div class="activity-info">
                    <div class="info-item" data-info="professor">
                        <i class="fas fa-user-graduate"></i>
                        <strong>Professor:</strong> ${this.escapeHTML(atividade.professor_nome)}
                    </div>
                    <div class="info-item" data-info="data-entrega">
                        <i class="fas fa-clock"></i>
                        <strong>Entrega:</strong> ${dataEntrega.toLocaleString('pt-BR')}
                    </div>
                    <div class="info-item" data-info="valor">
                        <i class="fas fa-star"></i>
                        <strong>Valor:</strong> ${atividade.valor_maximo} pts
                    </div>
                    ${atividade.tipo ? `
                    <div class="info-item" data-info="tipo">
                        <i class="fas fa-tag"></i>
                        <strong>Tipo:</strong> ${this.formatarTipoAtividade(atividade.tipo)}
                    </div>
                    ` : ''}
                </div>
                
                <div class="activity-actions">
                    ${trabalhoEntregue ? `
                        <button class="btn btn-success" disabled>
                            <i class="fas fa-check-circle"></i>
                            Entregue
                        </button>
                        <button class="btn btn-secondary" data-action="ver-detalhes-entrega" data-id="${atividade.id}">
                            <i class="fas fa-eye"></i>
                            Ver Entrega
                        </button>
                    ` : `
                        <button class="btn btn-primary" data-action="entregar-trabalho" data-id="${atividade.id}">
                            <i class="fas fa-paper-plane"></i>
                            Entregar Trabalho
                        </button>
                    `}
                    
                    ${isProfessor ? `
                        <button class="btn btn-secondary" data-action="editar-atividade" data-id="${atividade.id}">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                        <button class="btn btn-outline-danger" data-action="excluir-atividade" data-id="${atividade.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-outline-primary" data-action="concluir-atividade" data-id="${atividade.id}">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // =============================================
    // LÓGICA DE ENTREGA DE TRABALHOS
    // =============================================

    async entregarTrabalho(idAtividade) {
        try {
            console.log('📤 Iniciando entrega do trabalho...', idAtividade);
            
            // Testar conexão primeiro
            const apiOnline = await APIUtils.testConnection();
            
            if (!apiOnline) {
                NotificationUtils.showError('⚠️ API offline. Usando modo de desenvolvimento...');
                // Aqui você pode chamar a versão fallback se quiser
            }
            
            // Buscar dados da atividade
            const atividades = await this.obterDadosAtividade(idAtividade);
            const atividade = atividades.find(a => a.id === idAtividade);
            
            if (!atividade) {
                NotificationUtils.showError('Atividade não encontrada');
                return;
            }
        
            this.mostrarModalEntrega(atividade);
            
        } catch (error) {
            console.error('Erro ao abrir modal de entrega:', error);
            NotificationUtils.showError('Erro ao preparar entrega');
        }
    }

    async obterDadosAtividade(idAtividade) {
        try {
            const data = await APIUtils.get('/atividades');
            return data.success ? data.data : [];
        } catch (error) {
            // Fallback para dados mock
            return this.getMockAtividades();
        }
    }

    mostrarModalEntrega(atividade) {
        const modalHTML = `
            <div id="modal-overlay" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-paper-plane"></i>
                            Entregar Trabalho
                        </h3>
                        <button onclick="fecharModal()" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="form-group">
                            <label><strong>Atividade:</strong> ${this.escapeHTML(atividade.titulo)}</label>
                        </div>
                        
                        <div class="form-group">
                            <label for="modal-titulo">Título do seu trabalho *</label>
                            <input type="text" id="modal-titulo" class="form-control" 
                                   placeholder="Ex: Meu Projeto de Programação" required
                                   aria-required="true">
                        </div>
                        
                        <div class="form-group">
                            <label for="modal-conteudo">Descrição/Conteúdo *</label>
                            <textarea id="modal-conteudo" class="form-control" 
                                      placeholder="Descreva seu trabalho, inclua links se necessário..." 
                                      rows="6" required aria-required="true"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="modal-visibilidade">Visibilidade</label>
                            <select id="modal-visibilidade" class="form-control">
                                <option value="privado">Privado (apenas professor)</option>
                                <option value="turma">Turma (colegas da turma)</option>
                                <option value="publico">Público (toda a comunidade)</option>
                            </select>
                            <small class="form-help">
                                <i class="fas fa-info-circle"></i> Trabalhos públicos aparecem na rede social
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="modal-arquivo">Anexar Arquivo (Opcional)</label>
                            <input type="file" id="modal-arquivo" class="form-control"
                                   accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.png">
                            <small class="form-help">
                                <i class="fas fa-info-circle"></i> Formatos aceitos: PDF, Word, ZIP, JPG, PNG (Máx: 10MB)
                            </small>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button onclick="fecharModal()" class="btn btn-secondary">
                            <i class="fas fa-times"></i>
                            Cancelar
                        </button>
                        <button onclick="atividadesService.confirmarEntrega(${atividade.id})" class="btn btn-primary">
                            <i class="fas fa-check"></i>
                            Confirmar Entrega
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focar no primeiro campo
        setTimeout(() => {
            const tituloField = document.getElementById('modal-titulo');
            if (tituloField) tituloField.focus();
        }, 100);
    }

    async confirmarEntrega(idAtividade) {
        try {
            const titulo = DOMUtils.getValue('modal-titulo');
            const conteudo = DOMUtils.getValue('modal-conteudo');
            const visibilidade = DOMUtils.getValue('modal-visibilidade');
            const arquivo = document.getElementById('modal-arquivo').files[0];

            // Validações
            if (!this.validarEntrega(titulo, conteudo)) {
                return;
            }

            console.log('📦 Enviando trabalho para o banco...', {
                id_atividade: idAtividade,
                titulo,
                conteudo,
                visibilidade,
                tem_arquivo: !!arquivo
            });

            // Mostrar loading
            const botaoConfirmar = document.querySelector('button[onclick="atividadesService.confirmarEntrega(' + idAtividade + ')"]');
            const textoOriginal = botaoConfirmar.innerHTML;
            botaoConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            botaoConfirmar.disabled = true;

            // Preparar dados do formulário
            const formData = new FormData();
            formData.append('id_atividade', idAtividade);
            formData.append('titulo', titulo.trim());
            formData.append('conteudo', conteudo.trim());
            formData.append('visibilidade', visibilidade);
            
            if (arquivo) {
                formData.append('arquivo', arquivo);
            }

            // Enviar para a API
            const response = await fetch(`${API_BASE}/trabalhos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Não definir Content-Type para FormData
                },
                body: formData
            });

            const data = await response.json();

            console.log('📨 Resposta da API:', data);

            if (response.ok && data.success) {
                this.finalizarEntregaSucesso();
            } else {
                const errorMessage = data.error || data.message || 'Erro ao entregar trabalho';
                NotificationUtils.showError(errorMessage);
                this.restaurarBotaoConfirmar(botaoConfirmar, textoOriginal);
            }

        } catch (error) {
            console.error('💥 Erro ao confirmar entrega:', error);
            this.tratarErroEntrega(error);
        }
    }

    validarEntrega(titulo, conteudo) {
        if (!titulo.trim()) {
            NotificationUtils.showError('Digite um título para seu trabalho');
            return false;
        }

        if (!conteudo.trim()) {
            NotificationUtils.showError('Descreva o conteúdo do seu trabalho');
            return false;
        }

        if (titulo.length > 200) {
            NotificationUtils.showError('O título deve ter no máximo 200 caracteres');
            return false;
        }

        if (conteudo.length > 5000) {
            NotificationUtils.showError('A descrição deve ter no máximo 5000 caracteres');
            return false;
        }

        return true;
    }

    finalizarEntregaSucesso() {
        // Fechar modal
        fecharModal();
        
        // Mostrar sucesso
        NotificationUtils.showSuccess('🎉 Trabalho entregue com sucesso!');
        
        // Recarregar as listas
        setTimeout(() => {
            this.carregarAtividades(); // Atualiza status "Entregue" nas atividades
            if (typeof loadTrabalhos === 'function') {
                loadTrabalhos(); // Atualiza lista de trabalhos
            }
        }, 1000);
    }

    restaurarBotaoConfirmar(botao, textoOriginal) {
        botao.innerHTML = textoOriginal;
        botao.disabled = false;
    }

    tratarErroEntrega(error) {
        let errorMessage = 'Erro de conexão ao entregar trabalho';
        
        if (error.message.includes('404')) {
            errorMessage = 'Endpoint não encontrado. Verifique se a rota /trabalhos (POST) existe no backend.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        } else if (error.message.includes('HTML')) {
            errorMessage = 'O servidor retornou uma página de erro. Verifique se o backend está funcionando.';
        }
        
        NotificationUtils.showError(errorMessage);
        
        // Restaurar botão em caso de erro
        const botaoConfirmar = document.querySelector('button[onclick="atividadesService.confirmarEntrega(' + idAtividade + ')"]');
        if (botaoConfirmar) {
            this.restaurarBotaoConfirmar(botaoConfirmar, '<i class="fas fa-check"></i> Confirmar Entrega');
        }
    }

    // =============================================
    // CRIAÇÃO DE ATIVIDADES (PROFESSOR)
    // =============================================

    async criarNovaAtividade() {
        // Verificação de segurança
        if (!this.verificarPermissaoProfessor()) {
            return;
        }

        showTab('criar-atividade');
    }

    async criarAtividade(titulo, descricao, data_entrega, valor_maximo, tipo = 'trabalho') {
        // Verificação de segurança
        if (!this.verificarPermissaoProfessor()) {
            return false;
        }

        if (!this.validarAtividade(titulo, data_entrega, valor_maximo)) {
            return false;
        }

        try {
            console.log('📤 Enviando nova atividade para o banco...');

            const data = await APIUtils.post('/atividades', {
                titulo: titulo.trim(),
                descricao: descricao.trim(),
                tipo: tipo,
                data_entrega: data_entrega,
                valor_maximo: parseFloat(valor_maximo),
                instrucoes: '',
                disciplina: 'Desenvolvimento de Sistemas' // Exemplo
            });

            if (data.success) {
                this.finalizarCriacaoSucesso();
                return true;
            } else {
                NotificationUtils.showError(data.error || 'Erro ao criar atividade');
                return false;
            }
        } catch (error) {
            console.error('💥 Erro ao criar atividade:', error);
            NotificationUtils.showError('Erro de conexão ao criar atividade');
            return false;
        }
    }

    verificarPermissaoProfessor() {
        if (currentUser.tipo !== 'professor' && currentUser.tipo !== 'admin') {
            NotificationUtils.showError('❌ Acesso negado! Apenas professores podem criar atividades.');
            showTab('inicio');
            return false;
        }
        return true;
    }

    validarAtividade(titulo, data_entrega, valor_maximo) {
        if (!titulo.trim()) {
            NotificationUtils.showError('Preencha o título da atividade');
            return false;
        }

        if (!data_entrega) {
            NotificationUtils.showError('Selecione a data de entrega');
            return false;
        }

        // Verificar se a data é futura
        const dataEntrega = new Date(data_entrega);
        if (dataEntrega <= new Date()) {
            NotificationUtils.showError('A data de entrega deve ser futura');
            return false;
        }

        if (!valor_maximo || parseFloat(valor_maximo) <= 0) {
            NotificationUtils.showError('O valor deve ser maior que zero');
            return false;
        }

        if (titulo.length > 200) {
            NotificationUtils.showError('O título deve ter no máximo 200 caracteres');
            return false;
        }

        return true;
    }

    finalizarCriacaoSucesso() {
        NotificationUtils.showSuccess('✅ Atividade criada com sucesso!');
        this.limparFormularioAtividade();
        
        // Recarregar as atividades
        setTimeout(() => {
            this.carregarAtividades();
        }, 500);
        
        // Voltar para aba de atividades
        showTab('atividades');
    }

    limparFormularioAtividade() {
        DOMUtils.setValue('activity-titulo', '');
        DOMUtils.setValue('activity-descricao', '');
        DOMUtils.setValue('activity-data-entrega', '');
        DOMUtils.setValue('activity-valor', '10.00');
        
        // Limpar também campos adicionais se existirem
        const tipoSelect = document.getElementById('activity-tipo');
        if (tipoSelect) tipoSelect.value = 'trabalho';
    }

    // =============================================
    // FUNÇÕES AUXILIARES
    // =============================================

    async verificarTrabalhoEntregue(idAtividade) {
        try {
            console.log(`🔍 Verificando se atividade ${idAtividade} foi entregue...`);
            
            const data = await APIUtils.get('/trabalhos');
            
            if (data.success && data.data) {
                const entregue = data.data.some(trabalho => 
                    trabalho.id_atividade === idAtividade || 
                    trabalho.atividade_id === idAtividade
                );
                console.log(`✅ Atividade ${idAtividade} entregue:`, entregue);
                return entregue;
            }
        } catch (error) {
            console.log('❌ Erro ao verificar trabalho:', error);
        }
        
        return false;
    }

    obterStatusAtividade(diasRestantes) {
        if (diasRestantes < 0) {
            return { texto: 'Atrasada', classe: 'badge-danger' };
        } else if (diasRestantes === 0) {
            return { texto: 'Entrega hoje', classe: 'badge-warning' };
        } else if (diasRestantes <= 3) {
            return { texto: `Entrega em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`, classe: 'badge-warning' };
        } else {
            return { texto: `Entrega em ${diasRestantes} dias`, classe: 'badge-primary' };
        }
    }

    obterInfoTipo(tipo) {
        const tipos = {
            'trabalho': { icone: 'fa-file-alt', cor: 'var(--primary)', label: 'Trabalho' },
            'prova': { icone: 'fa-clipboard-check', cor: 'var(--danger)', label: 'Prova' },
            'projeto': { icone: 'fa-project-diagram', cor: 'var(--success)', label: 'Projeto' },
            'exercicio': { icone: 'fa-pencil-alt', cor: 'var(--warning)', label: 'Exercício' },
            'questionario': { icone: 'fa-list-ol', cor: 'var(--info)', label: 'Questionário' },
            'leitura': { icone: 'fa-book', cor: 'var(--secondary)', label: 'Leitura' }
        };
        
        return tipos[tipo] || { icone: 'fa-tasks', cor: 'var(--secondary)', label: 'Atividade' };
    }

    formatarTipoAtividade(tipo) {
        const tipos = {
            'trabalho': 'Trabalho',
            'prova': 'Prova',
            'projeto': 'Projeto',
            'exercicio': 'Exercício',
            'questionario': 'Questionário',
            'leitura': 'Leitura'
        };
        return tipos[tipo] || tipo;
    }

    calcularPrioridade(diasRestantes) {
        if (diasRestantes < 0) return 'atrasada';
        if (diasRestantes <= 1) return 'alta';
        if (diasRestantes <= 3) return 'media';
        return 'baixa';
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    carregarEstados() {
        // Carregar estados das atividades do localStorage
        const estados = JSON.parse(localStorage.getItem('atividades_estados')) || {};
        this.estadosAtividades = new Map(Object.entries(estados));
    }

    salvarEstados() {
        const estados = Object.fromEntries(this.estadosAtividades);
        localStorage.setItem('atividades_estados', JSON.stringify(estados));
    }

    marcarComoConcluida(idAtividade) {
        const estaConcluida = !this.estadosAtividades.get(idAtividade);
        this.estadosAtividades.set(idAtividade, estaConcluida);
        this.salvarEstados();
        
        this.atualizarInterfaceConclusao(idAtividade, estaConcluida);
        this.mostrarFeedbackConclusao(estaConcluida);
        
        // Feedback de voz se estiver ativo
        if (sistemaVoz.estaAtivo) {
            const mensagem = estaConcluida ? 
                'Atividade marcada como concluída' : 
                'Atividade reaberta';
            sistemaVoz.falar(mensagem);
        }
    }

    atualizarInterfaceConclusao(idAtividade, concluida) {
        const elemento = document.querySelector(`[data-atividade-id="${idAtividade}"]`);
        if (elemento) {
            elemento.classList.toggle('concluida', concluida);
            
            const botao = elemento.querySelector('[data-action="concluir-atividade"]');
            if (botao) {
                botao.innerHTML = concluida ? 
                    '<i class="fas fa-check-circle"></i>' : 
                    '<i class="fas fa-check"></i>';
                botao.className = concluida ? 
                    'btn btn-success' : 
                    'btn btn-outline-primary';
            }
        }
    }

    mostrarFeedbackConclusao(concluida) {
        this.criarElementoFeedback(concluida ? 
            '✅ Atividade concluída!' : 
            '🔄 Atividade reaberta!'
        );
    }

    criarElementoFeedback(mensagem) {
        // Remove feedback anterior se existir
        const feedbackAnterior = document.getElementById('feedback-atividade');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }

        const feedback = document.createElement('div');
        feedback.id = 'feedback-atividade';
        feedback.innerHTML = `
            <div class="feedback-message">
                <i class="fas fa-check"></i>
                <span>${mensagem}</span>
            </div>
        `;

        document.body.appendChild(feedback);

        // Remove após 3 segundos
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 3000);
    }

    // =============================================
    // DADOS MOCK PARA DESENVOLVIMENTO
    // =============================================

    getMockAtividades() {
        return [
            {
                id: 1,
                titulo: 'Trabalho de Programação Web',
                descricao: 'Desenvolver um site responsivo usando HTML, CSS e JavaScript. O tema é livre, mas deve conter pelo menos 3 páginas.',
                data_entrega: '2025-11-15T23:59:00',
                professor_nome: 'Prof. Silva',
                valor_maximo: 10.00,
                tipo: 'trabalho'
            },
            {
                id: 2,
                titulo: 'Prova de Banco de Dados',
                descricao: 'Prova teórica sobre modelagem ER, normalização e comandos SQL avançados.',
                data_entrega: '2025-11-21T14:00:00', 
                professor_nome: 'Prof. Santos',
                valor_maximo: 8.00,
                tipo: 'prova'
            },
            {
                id: 3,
                titulo: 'Projeto de Sistema Acadêmico',
                descricao: 'Em grupo, desenvolver um sistema completo de gestão acadêmica com cadastro de alunos, professores e disciplinas.',
                data_entrega: '2025-11-19T23:59:00',
                professor_nome: 'Prof. Oliveira',
                valor_maximo: 15.00,
                tipo: 'projeto'
            }
        ];
    }

    verDetalhesEntrega(idAtividade) {
        NotificationUtils.showSuccess(`📋 Detalhes da entrega da atividade #${idAtividade}`);
        // Aqui você pode implementar um modal com os detalhes da entrega
    }

    editarAtividade(idAtividade) {
        NotificationUtils.showSuccess(`✏️ Editando atividade #${idAtividade}`);
        // Implementar lógica de edição
    }
}

// =============================================
// INICIALIZAÇÃO E FUNÇÕES GLOBAIS
// =============================================

// Instanciar serviço de atividades
const atividadesService = new AtividadesService();

// Funções globais para uso no HTML
window.loadAtividades = function() {
    atividadesService.carregarAtividades();
}

window.criarAtividade = function() {
    const titulo = DOMUtils.getValue('activity-titulo');
    const descricao = DOMUtils.getValue('activity-descricao');
    const data_entrega = DOMUtils.getValue('activity-data-entrega');
    const valor_maximo = DOMUtils.getValue('activity-valor');
    const tipo = document.getElementById('activity-tipo')?.value || 'trabalho';

    atividadesService.criarAtividade(titulo, descricao, data_entrega, valor_maximo, tipo);
}

window.entregarTrabalho = function(idAtividade) {
    atividadesService.entregarTrabalho(idAtividade);
}

window.verDetalhesEntrega = function(idAtividade) {
    atividadesService.verDetalhesEntrega(idAtividade);
}

window.editarAtividade = function(idAtividade) {
    atividadesService.editarAtividade(idAtividade);
}
// js/main.js

// =============================================
// FUNÇÕES DE NAVEGAÇÃO E INTERFACE
// =============================================

/**
 * Função para alternar entre abas - DEVE SER GLOBAL
 */
function showTab(tabName) {
    console.log('🔄 Mudando para aba:', tabName);
    
    try {
        // Esconde todas as abas de conteúdo
        const tabContents = document.querySelectorAll('[id$="-tab"]');
        tabContents.forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Remove a classe active de todos os botões
        const tabButtons = document.querySelectorAll('.nav-tab');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Mostra a aba selecionada
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.classList.remove('hidden');
        } else {
            console.error('❌ Aba não encontrada:', tabName + '-tab');
            return;
        }
        
        // Adiciona classe active ao botão clicado (busca pelo onclick)
        const activeButton = Array.from(tabButtons).find(button => {
            const onclickAttr = button.getAttribute('onclick');
            return onclickAttr && onclickAttr.includes(`showTab('${tabName}')`);
        });
        
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Carrega o conteúdo específico da aba
        loadTabContent(tabName);
        
    } catch (error) {
        console.error('💥 Erro ao mudar de aba:', error);
    }
}

/**
 * Carrega conteúdo específico de cada aba
 */
function loadTabContent(tabName) {
    console.log('📦 Carregando conteúdo da aba:', tabName);
    
    switch(tabName) {
        case 'inicio':
            loadDashboard();
            break;
        case 'cursos':
            loadCursos();
            break;
        case 'atividades':
            if (typeof loadAtividades === 'function') {
                loadAtividades();
            } else {
                console.log('⚠️ loadAtividades não disponível ainda');
                // Fallback básico
                document.getElementById('atividades-list').innerHTML = `
                    <div class="card">
                        <div class="text-center" style="padding: 40px;">
                            <div class="loading"></div>
                            <p>Carregando atividades...</p>
                        </div>
                    </div>
                `;
            }
            break;
        case 'trabalhos':
            if (typeof loadTrabalhos === 'function') {
                loadTrabalhos();
            }
            break;
        case 'rede-social':
            if (typeof loadPosts === 'function') {
                loadPosts();
            }
            break;
        case 'criar-atividade':
            // Limpar formulário se existir
            const tituloField = document.getElementById('activity-titulo');
            if (tituloField) tituloField.value = '';
            break;
    }
}

/**
 * Carrega o dashboard inicial
 */
function loadDashboard() {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;
    
    const userName = currentUser ? currentUser.nome : 'Usuário';
    const userType = currentUser ? currentUser.tipo : 'aluno';
    
    dashboardContent.innerHTML = `
        <div class="dashboard-grid">
            <div class="stats-grid">
                <div class="card stat-card">
                    <i class="fas fa-tasks" style="font-size: 2em; color: var(--primary);"></i>
                    <div class="stat-number">0</div>
                    <div class="stat-label">Atividades Pendentes</div>
                </div>
                <div class="card stat-card">
                    <i class="fas fa-check-circle" style="font-size: 2em; color: var(--success);"></i>
                    <div class="stat-number">0</div>
                    <div class="stat-label">Trabalhos Entregues</div>
                </div>
                <div class="card stat-card">
                    <i class="fas fa-book" style="font-size: 2em; color: var(--info);"></i>
                    <div class="stat-number">3</div>
                    <div class="stat-label">Cursos Ativos</div>
                </div>
                <div class="card stat-card">
                    <i class="fas fa-calendar" style="font-size: 2em; color: var(--warning);"></i>
                    <div class="stat-number">0</div>
                    <div class="stat-label">Eventos Hoje</div>
                </div>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-bell"></i> Bem-vindo, ${userName}!</h3>
                <p>Seu painel ${userType === 'professor' ? 'do Professor' : 'do Aluno'} está carregado.</p>
                
                ${userType === 'professor' ? `
                    <div class="mt-3">
                        <button onclick="showTab('criar-atividade')" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Criar Nova Atividade
                        </button>
                    </div>
                ` : `
                    <div class="mt-3">
                        <button onclick="showTab('atividades')" class="btn btn-primary">
                            <i class="fas fa-tasks"></i>
                            Ver Minhas Atividades
                        </button>
                    </div>
                `}
            </div>
            
            <div class="card">
                <h3><i class="fas fa-clock"></i> Próximas Atividades</h3>
                <div style="color: var(--text-secondary); text-align: center; padding: 20px;">
                    <i class="fas fa-calendar-plus" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Nenhuma atividade próxima.</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Carrega a lista de cursos
 */
function loadCursos() {
    const cursosList = document.getElementById('cursos-list');
    if (!cursosList) return;
    
    const cursos = [
        {
            id: 1,
            nome: 'Desenvolvimento Web',
            professor: 'Prof. Silva',
            progresso: 65,
            cor: 'var(--primary)',
            icone: 'fas fa-code'
        },
        {
            id: 2,
            nome: 'Banco de Dados',
            professor: 'Prof. Santos', 
            progresso: 40,
            cor: 'var(--success)',
            icone: 'fas fa-database'
        },
        {
            id: 3,
            nome: 'Programação Mobile',
            professor: 'Prof. Oliveira',
            progresso: 20,
            cor: 'var(--warning)',
            icone: 'fas fa-mobile-alt'
        }
    ];
    
    cursosList.innerHTML = cursos.map(curso => `
        <div class="course-card" onclick="showTab('atividades')" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <i class="${curso.icone}" style="font-size: 24px; color: ${curso.cor};"></i>
                <div>
                    <h4 style="margin: 0;">${curso.nome}</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">${curso.professor}</p>
                </div>
            </div>
            <div style="background: var(--border); border-radius: 10px; height: 8px; margin: 12px 0;">
                <div style="background: ${curso.cor}; width: ${curso.progresso}%; height: 100%; border-radius: 10px; transition: width 0.5s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
                <span>Progresso</span>
                <span>${curso.progresso}%</span>
            </div>
        </div>
    `).join('');
}

/**
 * Fecha modais
 */
function fecharModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// =============================================
// FUNÇÕES DE AUTENTICAÇÃO E ACESSIBILIDADE
// =============================================

function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('accessibility-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showRegister() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.remove('hidden');
    document.getElementById('accessibility-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function setAccessibility(enable) {
    console.log('♿ Acessibilidade:', enable ? 'ativada' : 'desativada');
    
    if (enable && typeof sistemaVoz !== 'undefined') {
        sistemaVoz.ativar();
        NotificationUtils.showSuccess('Acessibilidade ativada!');
    }
    
    // Mostrar dashboard após escolha de acessibilidade
    document.getElementById('accessibility-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Carregar aba inicial
    showTab('inicio');
}

// =============================================
// INICIALIZAÇÃO
// =============================================

// Tornar funções globais explicitamente
window.showTab = showTab;
window.loadTabContent = loadTabContent;
window.loadDashboard = loadDashboard;
window.loadCursos = loadCursos;
window.fecharModal = fecharModal;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.setAccessibility = setAccessibility;

console.log('✅ Funções de navegação carregadas!');
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Configurando event listeners...');
    
    // Event delegation para as abas de navegação
    document.addEventListener('click', function(e) {
        const tabElement = e.target.closest('.nav-tab');
        if (tabElement && tabElement.dataset.tab) {
            e.preventDefault();
            showTab(tabElement.dataset.tab);
        }
    });
    
    // Event listener para o botão de tema
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Event listener para logout
    const logoutBtn = document.querySelector('[onclick="logout()"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    console.log('✅ Event listeners configurados!');
});
// =============================================
// CONFIGURAÇÃO DE EVENT LISTENERS CORRIGIDA
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Configurando event listeners...');
    
    // SOLUÇÃO PARA OS CLICKS - funciona com onclick E data-tab
    document.addEventListener('click', function(e) {
        // Tenta encontrar elemento clicável
        const clickableElement = e.target.closest('.nav-tab') || 
                                e.target.closest('[onclick*="showTab"]') ||
                                e.target.closest('[data-tab]');
        
        if (clickableElement) {
            e.preventDefault();
            
            // Tenta extrair o nome da tab de diferentes formas
            let tabName = null;
            
            // 1. Se tem data-tab
            if (clickableElement.dataset.tab) {
                tabName = clickableElement.dataset.tab;
            }
            // 2. Se tem onclick com showTab
            else if (clickableElement.getAttribute('onclick')) {
                const onclick = clickableElement.getAttribute('onclick');
                const match = onclick.match(/showTab\('([^']+)'\)/);
                if (match) {
                    tabName = match[1];
                }
            }
            
            if (tabName) {
                console.log('📱 Clicou na tab:', tabName);
                showTab(tabName);
            }
        }
    });
    
    console.log('✅ Event listeners configurados!');
});

// Função showTab corrigida e robusta
function showTab(tabName) {
    console.log('🔄 Mudando para aba:', tabName);
    
    try {
        // 1. Esconde todas as abas de conteúdo
        const allTabs = document.querySelectorAll('[id$="-tab"]');
        allTabs.forEach(tab => {
            tab.style.display = 'none';
            tab.classList.add('hidden');
        });
        
        // 2. Remove active de todos os botões
        const allButtons = document.querySelectorAll('.nav-tab');
        allButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // 3. Mostra a aba selecionada
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.style.display = 'block';
            targetTab.classList.remove('hidden');
            console.log('✅ Aba encontrada e mostrada:', tabName + '-tab');
        } else {
            console.error('❌ Aba não encontrada:', tabName + '-tab');
            return;
        }
        
        // 4. Ativa o botão correto (busca por onclick ou data-tab)
        const activeButton = Array.from(allButtons).find(button => {
            // Verifica data-tab
            if (button.dataset.tab === tabName) return true;
            
            // Verifica onclick
            const onclick = button.getAttribute('onclick');
            return onclick && onclick.includes(`showTab('${tabName}')`);
        });
        
        if (activeButton) {
            activeButton.classList.add('active');
            console.log('✅ Botão ativado:', tabName);
        }
        
        // 5. Carrega conteúdo da aba
        loadTabContent(tabName);
        
    } catch (error) {
        console.error('💥 Erro em showTab:', error);
    }
}

// Função auxiliar para debug - mostra todos os tabs e botões
function debugTabs() {
    console.log('🐛 DEBUG - Estado das Tabs:');
    
    // Mostra todas as tabs
    const allTabs = document.querySelectorAll('[id$="-tab"]');
    allTabs.forEach(tab => {
        console.log(`Tab: ${tab.id}, Hidden: ${tab.classList.contains('hidden')}, Display: ${tab.style.display}`);
    });
    
    // Mostra todos os botões
    const allButtons = document.querySelectorAll('.nav-tab');
    allButtons.forEach(button => {
        console.log(`Button: ${button.textContent}, Active: ${button.classList.contains('active')}, OnClick: ${button.getAttribute('onclick')}, Data-tab: ${button.dataset.tab}`);
    });
}
// No DOMContentLoaded do main.js, adicione:
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Configurando botão criar atividade...');
    
    // Botão criar atividade com fallback
    document.getElementById('btn-criar-atividade')?.addEventListener('click', function() {
        console.log('🖱️ Botão criar atividade clicado');
        
        // Coleta os dados do formulário
        const titulo = document.getElementById('activity-titulo')?.value;
        const descricao = document.getElementById('activity-descricao')?.value;
        const data_entrega = document.getElementById('activity-data-entrega')?.value;
        const valor_maximo = document.getElementById('activity-valor')?.value;
        const tipo = document.getElementById('activity-tipo')?.value || 'trabalho';

        // Validações
        if (!titulo || !titulo.trim()) {
            alert('Digite um título para a atividade');
            return;
        }
        
        if (!data_entrega) {
            alert('Selecione uma data de entrega');
            return;
        }

        console.log('📤 Dados coletados:', { titulo, data_entrega, valor_maximo });
        
        // Tenta usar o serviço se disponível
        if (typeof atividadesService !== 'undefined' && atividadesService.criarAtividade) {
            atividadesService.criarAtividade(titulo, descricao, data_entrega, valor_maximo, tipo);
        } else {
            console.error('❌ atividadesService não disponível, usando fallback');
            alert('Atividade criada localmente! (Modo de desenvolvimento)\n\n' +
                  `Título: ${titulo}\n` +
                  `Data: ${data_entrega}\n` +
                  `Valor: ${valor_maximo} pts`);
            
            // Limpa o formulário
            document.getElementById('activity-titulo').value = '';
            document.getElementById('activity-descricao').value = '';
            document.getElementById('activity-data-entrega').value = '';
            document.getElementById('activity-valor').value = '10.00';
            
            // Volta para atividades
            showTab('atividades');
        }
    });
});
// Chama o debug para verificar
setTimeout(debugTabs, 1000);
// Exportar para uso em outros módulos
window.AtividadesService = AtividadesService;
window.atividadesService = atividadesService;