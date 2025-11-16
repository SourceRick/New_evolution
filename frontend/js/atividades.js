// js/atividades.js

class AtividadesService {
    constructor() {
        this.sistemaAtividades = new SistemaAtividades();
    }

    async loadAtividades() {
        try {
            console.log('🚀 Buscando atividades do banco de dados...');
            
            DOMUtils.setInnerHTML('atividades-list', NotificationUtils.showLoading('Carregando atividades...'));

            const data = await APIUtils.get('/atividades');
            
            if (data.success && data.data) {
                console.log(`✅ ${data.data.length} atividades carregadas do banco`);
                await this.renderAtividades(data.data);
            } else {
                console.log('❌ Nenhuma atividade no banco');
                await this.renderAtividades([]);
            }

        } catch (error) {
            console.error('💥 Erro ao carregar atividades:', error);
            await this.renderAtividades([]);
        }
    }

    async renderAtividades(atividades) {
        const list = document.getElementById('atividades-list');
        
        console.log('🎨 Renderizando atividades:', atividades);
        
        if (!atividades || atividades.length === 0) {
            this.renderEmptyAtividades();
            return;
        }

        const atividadesPendentes = atividades.filter(a => {
            const dataEntrega = new Date(a.data_entrega);
            return dataEntrega > new Date();
        }).length;

        list.innerHTML = this.createAtividadesHeader(atividadesPendentes, atividades.length);

        // Renderizar cada atividade de forma assíncrona
        for (const atividade of atividades) {
            const atividadeElement = await this.createElementoAtividade(atividade);
            list.appendChild(atividadeElement);
        }
    }

    renderEmptyAtividades() {
        const emptyHTML = `
            <div class="text-center" style="color: var(--text-secondary); padding: 40px;">
                <i class="fas fa-calendar-plus" style="font-size: 48px; margin-bottom: 16px;"></i>
                <br>
                <h3>Nenhuma atividade cadastrada</h3>
                <p>Quando professores criarem atividades, elas aparecerão aqui.</p>
                ${currentUser && currentUser.tipo === 'professor' ? `
                    <button onclick="showTab('criar-atividade')" class="btn btn-primary mt-3">
                        <i class="fas fa-plus"></i>
                        Criar Primeira Atividade
                    </button>
                ` : ''}
            </div>
        `;
        DOMUtils.setInnerHTML('atividades-list', emptyHTML);
    }

    createAtividadesHeader(pendentes, total) {
        return `
            <div class="card mb-4">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h4 style="margin: 0;"><i class="fas fa-tasks"></i> Atividades Pendentes</h4>
                        <p style="margin: 5px 0 0 0; color: var(--text-secondary);">
                            ${pendentes} de ${total} atividades
                        </p>
                    </div>
                    ${currentUser && currentUser.tipo === 'professor' ? `
                        <button onclick="showTab('criar-atividade')" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Nova Atividade
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async createElementoAtividade(atividade) {
        const element = DOMUtils.createElement('div', {
            'class': 'activity-item',
            'data-atividade-id': atividade.id
        });

        const trabalhoEntregue = await this.verificarTrabalhoEntregue(atividade.id);
        const dataEntrega = new Date(atividade.data_entrega);
        const diasRestantes = DateUtils.getDaysRemaining(atividade.data_entrega);
        
        const statusInfo = this.obterStatusAtividade(diasRestantes);
        const tipoInfo = this.obterInfoTipo(atividade.tipo);
        
        if (trabalhoEntregue) {
            element.classList.add('trabalho-entregue');
        }

        element.innerHTML = this.createAtividadeHTML(atividade, trabalhoEntregue, dataEntrega, statusInfo, tipoInfo);
        return element;
    }

    createAtividadeHTML(atividade, trabalhoEntregue, dataEntrega, statusInfo, tipoInfo) {
        return `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                <div style="flex: 1; min-width: 250px;">
                    <h4 style="margin: 0 0 8px 0;">
                        <i class="fas ${tipoInfo.icone}" style="color: ${trabalhoEntregue ? 'var(--success)' : tipoInfo.cor}; margin-right: 8px;"></i>
                        ${atividade.titulo}
                        ${trabalhoEntregue ? ' <i class="fas fa-check-circle" style="color: var(--success); font-size: 0.8em;"></i>' : ''}
                    </h4>
                    <p style="margin: 0; color: var(--text-secondary); line-height: 1.4;">
                        ${atividade.descricao || 'Sem descrição'}
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                    <span class="badge ${statusInfo.classe}">${statusInfo.texto}</span>
                    ${trabalhoEntregue ? `
                        <span class="badge badge-success">
                            <i class="fas fa-check"></i> Entregue
                        </span>
                    ` : ''}
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; flex-wrap: wrap; gap: 15px;">
                <div style="font-size: 14px; color: var(--text-secondary); display: flex; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <i class="fas fa-user-graduate"></i>
                        <strong> Professor:</strong> ${atividade.professor_nome}
                    </div>
                    <div>
                        <i class="fas fa-clock"></i>
                        <strong> Entrega:</strong> ${dataEntrega.toLocaleString('pt-BR')}
                    </div>
                    <div>
                        <i class="fas fa-star"></i>
                        <strong> Valor:</strong> ${atividade.valor_maximo} pts
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${trabalhoEntregue ? `
                        <button class="btn btn-success" disabled style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-check-circle"></i>
                            Entregue
                        </button>
                        <button onclick="verDetalhesEntrega(${atividade.id})" class="btn btn-secondary">
                            <i class="fas fa-eye"></i>
                            Ver Entrega
                        </button>
                    ` : `
                        <button onclick="entregarTrabalho(${atividade.id})" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i>
                            Entregar Trabalho
                        </button>
                    `}
                    
                    ${currentUser && currentUser.tipo === 'professor' ? `
                        <button onclick="editarAtividade(${atividade.id})" class="btn btn-secondary">
                            <i class="fas fa-edit"></i>
                            Editar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

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
            'trabalho': { icone: 'fa-file-alt', cor: 'var(--primary)' },
            'prova': { icone: 'fa-clipboard-check', cor: 'var(--danger)' },
            'projeto': { icone: 'fa-project-diagram', cor: 'var(--success)' },
            'exercicio': { icone: 'fa-pencil-alt', cor: 'var(--warning)' },
            'questionario': { icone: 'fa-list-ol', cor: 'var(--info)' }
        };
        
        return tipos[tipo] || { icone: 'fa-tasks', cor: 'var(--secondary)' };
    }

    async criarAtividade(titulo, descricao, data_entrega, valor_maximo) {
        // Verificação de segurança
        if (currentUser.tipo !== 'professor' && currentUser.tipo !== 'admin') {
            NotificationUtils.showError('❌ Acesso negado! Apenas professores podem criar atividades.');
            showTab('inicio');
            return false;
        }

        if (!titulo || !data_entrega) {
            NotificationUtils.showError('Preencha todos os campos obrigatórios');
            return false;
        }

        try {
            console.log('📤 Enviando nova atividade para o banco...');

            const data = await APIUtils.post('/atividades', {
                titulo,
                descricao,
                tipo: 'trabalho',
                data_entrega,
                valor_maximo: parseFloat(valor_maximo),
                instrucoes: ''
            });

            if (data.success) {
                NotificationUtils.showSuccess('✅ Atividade criada com sucesso!');
                this.limparFormularioAtividade();
                
                // Recarregar as atividades
                setTimeout(() => {
                    this.loadAtividades();
                }, 500);
                
                showTab('atividades');
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

    limparFormularioAtividade() {
        DOMUtils.setValue('activity-titulo', '');
        DOMUtils.setValue('activity-descricao', '');
        DOMUtils.setValue('activity-data-entrega', '');
        DOMUtils.setValue('activity-valor', '10.00');
    }
    criarAtividadeForm() {
    console.log('📝 Criando atividade a partir do formulário...');
    
    const titulo = DOMUtils.getValue('activity-titulo');
    const descricao = DOMUtils.getValue('activity-descricao');
    const data_entrega = DOMUtils.getValue('activity-data-entrega');
    const valor_maximo = DOMUtils.getValue('activity-valor');
    const tipo = document.getElementById('activity-tipo')?.value || 'trabalho';

    this.criarAtividade(titulo, descricao, data_entrega, valor_maximo, tipo);
}
}
const atividadesService = new AtividadesService();

// GARANTIR que seja global - ADICIONE ESTA LINHA:
window.atividadesService = atividadesService;

// =============================================
// FUNÇÕES GLOBAIS PARA USO NO HTML - APENAS UMA VEZ!
// =============================================

// Função global para criar atividade
window.criarAtividade = function() {
    console.log('📝 Iniciando criação de atividade...');
    
    // Verifica se o serviço está disponível
    if (typeof atividadesService === 'undefined') {
        console.error('❌ atividadesService não disponível');
        NotificationUtils.showError('Sistema de atividades não carregado. Recarregue a página.');
        return;
    }
    
    const titulo = DOMUtils.getValue('activity-titulo');
    const descricao = DOMUtils.getValue('activity-descricao');
    const data_entrega = DOMUtils.getValue('activity-data-entrega');
    const valor_maximo = DOMUtils.getValue('activity-valor');
    const tipo = document.getElementById('activity-tipo')?.value || 'trabalho';

    atividadesService.criarAtividade(titulo, descricao, data_entrega, valor_maximo, tipo);
}

// Função global para entregar trabalho
window.entregarTrabalho = function(idAtividade) {
    if (typeof atividadesService === 'undefined') {
        console.error('❌ atividadesService não disponível');
        return;
    }
    atividadesService.entregarTrabalho(idAtividade);
}

// Função global para ver detalhes
window.verDetalhesEntrega = function(idAtividade) {
    if (typeof atividadesService === 'undefined') {
        console.error('❌ atividadesService não disponível');
        return;
    }
    atividadesService.verDetalhesEntrega(idAtividade);
}

// Função global para editar atividade
window.editarAtividade = function(idAtividade) {
    if (typeof atividadesService === 'undefined') {
        console.error('❌ atividadesService não disponível');
        return;
    }
    atividadesService.editarAtividade(idAtividade);
}

// Função global para carregar atividades
window.loadAtividades = function() {
    if (typeof atividadesService === 'undefined') {
        console.error('❌ atividadesService não disponível');
        return;
    }
    atividadesService.loadAtividades();
}

console.log('✅ Funções globais de atividades carregadas!');