// =============================================
// DADOS MOCK PARA DESENVOLVIMENTO
// =============================================

export const usuarios = [
    {
        id: 1,
        nome: 'Professor Silva',
        email: 'prof.silva@email.com',
        senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        tipo: 'professor',
        ativo: true,
        foto_url: null,
        criado_em: new Date('2024-01-01T10:00:00').toISOString(),
        ultimo_acesso: new Date().toISOString()
    },
    {
        id: 2,
        nome: 'Aluno João',
        email: 'joao@email.com',
        senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        tipo: 'aluno',
        ativo: true,
        foto_url: null,
        criado_em: new Date('2024-01-02T09:00:00').toISOString(),
        ultimo_acesso: new Date().toISOString()
    },
    {
        id: 3,
        nome: 'Aluna Maria',
        email: 'maria@email.com',
        senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        tipo: 'aluno',
        ativo: true,
        foto_url: null,
        criado_em: new Date('2024-01-03T11:30:00').toISOString(),
        ultimo_acesso: new Date().toISOString()
    },
    {
        id: 4,
        nome: 'Administrador Sistema',
        email: 'admin@bytewave.com',
        senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        tipo: 'admin',
        ativo: true,
        foto_url: null,
        criado_em: new Date('2024-01-01T08:00:00').toISOString(),
        ultimo_acesso: new Date().toISOString()
    }
];

export const atividades = [
    {
        id: 1,
        titulo: 'Trabalho de Programação Web',
        descricao: 'Desenvolver um site responsivo usando HTML, CSS e JavaScript. O tema é livre, mas deve conter pelo menos 3 páginas com navegação entre elas.',
        tipo: 'trabalho',
        data_criacao: new Date('2024-01-10').toISOString(),
        data_entrega: '2024-12-15T23:59:00',
        id_professor: 1,
        valor_maximo: 10.00,
        instrucoes: 'Entregar o código fonte em ZIP e o link do GitHub. Incluir README com instruções de execução.',
        anexos_permitidos: true,
        professor_nome: 'Professor Silva',
        disciplina: 'Programação Web',
        tags: ['html', 'css', 'javascript', 'responsivo']
    },
    {
        id: 2,
        titulo: 'Prova de Banco de Dados',
        descricao: 'Prova teórica sobre modelagem ER, normalização e comandos SQL avançados.',
        tipo: 'prova',
        data_criacao: new Date('2024-01-12').toISOString(),
        data_entrega: '2024-12-20T14:00:00',
        id_professor: 1,
        valor_maximo: 8.00,
        instrucoes: 'Prova individual, sem consulta. Responder todas as questões no papel.',
        anexos_permitidos: false,
        professor_nome: 'Professor Silva',
        disciplina: 'Banco de Dados',
        tags: ['sql', 'modelagem', 'normalização']
    },
    {
        id: 3,
        titulo: 'Projeto de Sistema Acadêmico',
        descricao: 'Em grupo, desenvolver um sistema completo de gestão acadêmica com cadastro de alunos, professores e disciplinas.',
        tipo: 'projeto',
        data_criacao: new Date('2024-01-15').toISOString(),
        data_entrega: '2024-12-25T23:59:00',
        id_professor: 1,
        valor_maximo: 15.00,
        instrucoes: 'Trabalho em grupo de 3-4 pessoas. Entregar documentação e código. Apresentação obrigatória.',
        anexos_permitidos: true,
        professor_nome: 'Professor Silva',
        disciplina: 'Desenvolvimento de Sistemas',
        tags: ['projeto', 'grupo', 'sistema', 'documentação']
    },
    {
        id: 4,
        titulo: 'Exercícios de Lógica de Programação',
        descricao: 'Lista de exercícios para praticar lógica de programação com JavaScript.',
        tipo: 'exercicio',
        data_criacao: new Date('2024-01-08').toISOString(),
        data_entrega: '2024-12-18T23:59:00',
        id_professor: 1,
        valor_maximo: 5.00,
        instrucoes: 'Resolver os 10 exercícios propostos. Entregar arquivo .js com as soluções.',
        anexos_permitidos: true,
        professor_nome: 'Professor Silva',
        disciplina: 'Algoritmos',
        tags: ['javascript', 'lógica', 'exercícios']
    }
];

export const trabalhos = [
    {
        id: 1,
        id_atividade: 1,
        id_aluno: 2,
        titulo: 'Meu Site Pessoal - Portfolio',
        conteudo: 'Desenvolvi um site pessoal completo com portfolio, blog e formulário de contato. Usei HTML5, CSS3 com Grid/Flexbox, e JavaScript vanilla para as interações.\n\n**Recursos implementados:**\n- Design totalmente responsivo\n- Animações CSS suaves\n- Formulário de contato funcional com validação\n- Portfolio interativo com filtros\n- Blog com sistema de comentários (simulado)\n- Otimização para SEO básico\n\n**Tecnologias:** HTML5, CSS3, JavaScript, GitHub Pages para deploy',
        data_entrega: new Date('2024-01-14T10:30:00').toISOString(),
        nota: 9.5,
        comentario_professor: 'Excelente trabalho! Design responsivo muito bem implementado. Código limpo e bem organizado. A paleta de cores está harmoniosa e a tipografia escolhida facilita a leitura. Pontos fortes: navegação intuitiva e performance otimizada.',
        status: 'avaliado',
        visibilidade: 'publico',
        anonimo: false,
        aluno_nome: 'Aluno João',
        atividade_titulo: 'Trabalho de Programação Web',
        arquivos: [
            {
                nome: 'projeto-site-portfolio.zip',
                tipo: 'zip',
                tamanho: '2.4 MB',
                url: '/arquivos/projeto-site-portfolio.zip'
            },
            {
                nome: 'documentacao.pdf',
                tipo: 'pdf',
                tamanho: '1.1 MB',
                url: '/arquivos/documentacao.pdf'
            }
        ],
        criado_em: new Date('2024-01-14T10:30:00').toISOString(),
        atualizado_em: new Date('2024-01-16T14:20:00').toISOString()
    },
    {
        id: 2,
        id_atividade: 2,
        id_aluno: 2,
        titulo: 'Prova de Banco de Dados - Respostas',
        conteudo: 'Respostas da prova teórica sobre modelagem ER e comandos SQL avançados.\n\n**Questão 1:** Modelagem ER para sistema de biblioteca\n**Questão 2:** Normalização até 3FN\n**Questão 3:** Comandos SQL - JOIN, GROUP BY, Subqueries',
        data_entrega: new Date('2024-01-18T14:00:00').toISOString(),
        nota: null,
        comentario_professor: null,
        status: 'entregue',
        visibilidade: 'privado',
        anonimo: false,
        aluno_nome: 'Aluno João',
        atividade_titulo: 'Prova de Banco de Dados',
        arquivos: [
            {
                nome: 'respostas-prova.pdf',
                tipo: 'pdf',
                tamanho: '1.2 MB',
                url: '/arquivos/respostas-prova.pdf'
            }
        ],
        criado_em: new Date('2024-01-18T13:45:00').toISOString(),
        atualizado_em: new Date('2024-01-18T13:45:00').toISOString()
    },
    {
        id: 3,
        id_atividade: 1,
        id_aluno: 3,
        titulo: 'Site Institucional - Empresa XYZ',
        conteudo: 'Desenvolvimento de site institucional para uma empresa fictícia de tecnologia, com páginas: Home, Sobre, Serviços, Portfolio e Contato.\n\n**Funcionalidades:**\n- Layout moderno e profissional\n- Galeria de projetos interativa\n- Formulário de orçamento\n- Integração com redes sociais\n- Blog corporativo\n\n**Destaques:**\n- Design system consistente\n- Performance otimizada\n- Código semântico e acessível',
        data_entrega: new Date('2024-01-15T23:59:00').toISOString(),
        nota: 8.0,
        comentario_professor: 'Bom trabalho! O design está moderno e as funcionalidades atendem ao solicitado. Sugestão: melhorar a responsividade em dispositivos móveis pequenos e adicionar mais contrastes para acessibilidade.',
        status: 'avaliado',
        visibilidade: 'turma',
        anonimo: false,
        aluno_nome: 'Aluna Maria',
        atividade_titulo: 'Trabalho de Programação Web',
        arquivos: [
            {
                nome: 'site-empresa-xyz.zip',
                tipo: 'zip',
                tamanho: '3.1 MB',
                url: '/arquivos/site-empresa-xyz.zip'
            },
            {
                nome: 'apresentacao-projeto.pptx',
                tipo: 'powerpoint',
                tamanho: '4.2 MB',
                url: '/arquivos/apresentacao-projeto.pptx'
            }
        ],
        criado_em: new Date('2024-01-15T22:30:00').toISOString(),
        atualizado_em: new Date('2024-01-17T09:15:00').toISOString()
    },
    {
        id: 4,
        id_atividade: 4,
        id_aluno: 3,
        titulo: 'Exercícios de Lógica - Soluções',
        conteudo: 'Soluções para os 10 exercícios de lógica de programação propostos.\n\n**Exercícios resolvidos:**\n1. Calculadora de IMC\n2. Verificador de palíndromos\n3. Gerador de sequência Fibonacci\n4. Ordenação de arrays\n5. Validador de CPF\n6. Conversor de temperaturas\n7. Calculadora de fatorial\n8. Jogo da adivinhação\n9. Manipulação de strings\n10. Análise de números primos',
        data_entrega: new Date('2024-01-16T20:00:00').toISOString(),
        nota: 10.0,
        comentario_professor: 'Perfeito! Todas as soluções corretas e bem comentadas. Código limpo e eficiente. Parabéns pelo excelente trabalho!',
        status: 'avaliado',
        visibilidade: 'privado',
        anonimo: false,
        aluno_nome: 'Aluna Maria',
        atividade_titulo: 'Exercícios de Lógica de Programação',
        arquivos: [
            {
                nome: 'exercicios-logica.js',
                tipo: 'javascript',
                tamanho: '0.8 MB',
                url: '/arquivos/exercicios-logica.js'
            }
        ],
        criado_em: new Date('2024-01-16T19:45:00').toISOString(),
        atualizado_em: new Date('2024-01-18T11:30:00').toISOString()
    }
];

export const postsSociais = [
    {
        id: 1,
        id_trabalho: 1,
        titulo: 'Meu Site Pessoal - Portfolio Profissional',
        conteudo: 'Acabei de entregar meu site pessoal desenvolvido para a disciplina de Programação Web! 🚀\n\nGostaria muito de feedbacks sobre:\n• Design e usabilidade\n• Performance\n• Código e estrutura\n• Experiência mobile\n\n**Tecnologias usadas:**\n- HTML5 Semântico\n- CSS3 com Grid/Flexbox\n- JavaScript Vanilla\n- GitHub Pages para deploy\n\nConfira o código no GitHub e me digam o que acham! Qualquer sugestão é bem-vinda! 💡',
        tags: JSON.stringify(['web', 'portfolio', 'html', 'css', 'javascript', 'frontend', 'responsivo', 'github']),
        visualizacoes: 47,
        curtidas: 12,
        permite_comentarios: true,
        ativo: true,
        criado_em: new Date('2024-01-14T10:30:00').toISOString(),
        atualizado_em: new Date('2024-01-14T10:30:00').toISOString(),
        autor_nome: 'Aluno João',
        autor_id: 2,
        trabalho_titulo: 'Meu Site Pessoal - Portfolio',
        atividade_titulo: 'Trabalho de Programação Web',
        anexos: [
            {
                tipo: 'imagem',
                url: '/arquivos/site-preview.jpg',
                descricao: 'Preview do site em desktop e mobile'
            },
            {
                tipo: 'link',
                url: 'https://github.com/joao/meu-portfolio',
                descricao: 'Código fonte no GitHub'
            },
            {
                tipo: 'link',
                url: 'https://joao.github.io/meu-portfolio',
                descricao: 'Site publicado'
            }
        ]
    },
    {
        id: 2,
        id_trabalho: 3,
        titulo: 'Site Institucional - Empresa XYZ',
        conteudo: 'Compartilhando meu projeto de site institucional desenvolvido em grupo! 🏢\n\n**Focamos em:**\n• UX/UI moderna e intuitiva\n• Performance otimizada (Lighthouse Score: 95+)\n• SEO básico implementado\n• Integração com redes sociais\n• Formulários funcionais\n\n**Desafios superados:**\n- Responsividade cross-device\n- Otimização de imagens\n- Validação de formulários\n- Deploy automatizado\n\nAceitamos sugestões para melhorias! Qual feature vocês acham que poderia ser adicionada? 💭',
        tags: JSON.stringify(['web', 'empresa', 'grupo', 'ux', 'seo', 'projeto', 'institucional', 'deploy']),
        visualizacoes: 32,
        curtidas: 8,
        permite_comentarios: true,
        ativo: true,
        criado_em: new Date('2024-01-15T14:20:00').toISOString(),
        atualizado_em: new Date('2024-01-15T14:20:00').toISOString(),
        autor_nome: 'Aluna Maria',
        autor_id: 3,
        trabalho_titulo: 'Site Institucional - Empresa XYZ',
        atividade_titulo: 'Trabalho de Programação Web',
        anexos: [
            {
                tipo: 'imagem',
                url: '/arquivos/empresa-xyz-preview.jpg',
                descricao: 'Layout do site em diferentes dispositivos'
            },
            {
                tipo: 'documento',
                url: '/arquivos/case-study.pdf',
                descricao: 'Case study do projeto'
            }
        ]
    },
    {
        id: 3,
        titulo: 'Dicas para Organização de Estudos 📚',
        conteudo: 'Compartilhando meu método de organização que tem me ajudado muito nos estudos de programação! 🎯\n\n**Minha stack de organização:**\n\n📅 **Técnica Pomodoro**: 25min foco total + 5min descanso\n🗂️ **Organização por pastas**: Separar por disciplina/projeto\n📝 **Resumos visuais**: Mapas mentais funcionam demais!\n🎯 **Metas diárias**: Pequenas conquistas todo dia\n📱 **Apps que uso**: Notion, Trello, Forest\n💻 **Ambiente**: Mesa limpa, iluminação boa, fone cancelamento de ruído\n\n**Dica extra:** Revisar o conteúdo no mesmo dia da aula aumenta a retenção em 60%!\n\nQual método vocês usam? Compartilhem suas experiências! 👇',
        tags: JSON.stringify(['dicas', 'organização', 'estudos', 'produtividade', 'aprendizado', 'programação', 'metodologia']),
        visualizacoes: 89,
        curtidas: 25,
        permite_comentarios: true,
        ativo: true,
        criado_em: new Date('2024-01-16T09:15:00').toISOString(),
        atualizado_em: new Date('2024-01-16T09:15:00').toISOString(),
        autor_nome: 'Professor Silva',
        autor_id: 1,
        trabalho_titulo: null,
        atividade_titulo: null,
        anexos: [
            {
                tipo: 'documento',
                url: '/arquivos/plano-estudos.pdf',
                descricao: 'Modelo de plano de estudos personalizável'
            },
            {
                tipo: 'link',
                url: 'https://example.com/recursos-estudo',
                descricao: 'Recursos extras para estudo'
            }
        ]
    },
    {
        id: 4,
        titulo: 'Desafio: Algoritmo de Ordenação Customizado 🧩',
        conteudo: 'Galera, criei um desafio interessante para praticarmos algoritmos!\n\n**O problema:** Desenvolver um algoritmo de ordenação que:\n- Aceite números e strings no mesmo array\n- Mantenha a ordem relativa entre tipos diferentes\n- Seja eficiente (O(n log n) no melhor caso)\n- Tenha tratamento de erros robusto\n\n**Exemplo de entrada:** `[3, "apple", 1, "banana", 2, 5, "cherry"]`\n**Saída esperada:** `[1, 2, 3, 5, "apple", "banana", "cherry"]`\n\nQuem topa o desafio? Postem suas soluções nos comentários! 🏆\n\nVamos aprender juntos! 💪',
        tags: JSON.stringify(['desafio', 'algoritmo', 'ordenacao', 'javascript', 'logica', 'programacao', 'exercicio']),
        visualizacoes: 56,
        curtidas: 18,
        permite_comentarios: true,
        ativo: true,
        criado_em: new Date('2024-01-17T16:45:00').toISOString(),
        atualizado_em: new Date('2024-01-17T16:45:00').toISOString(),
        autor_nome: 'Professor Silva',
        autor_id: 1,
        trabalho_titulo: null,
        atividade_titulo: null,
        anexos: [
            {
                tipo: 'documento',
                url: '/arquivos/desafio-ordenacao.pdf',
                descricao: 'Especificação completa do desafio'
            }
        ]
    }
];

export const comentarios = [
    {
        id: 1,
        id_post: 1,
        id_usuario: 3,
        conteudo: 'Parabéns pelo trabalho, João! O design está muito clean e profissional. 👏\nGostei especialmente da paleta de cores e da tipografia escolhida. A navegação é intuitiva e o portfolio mostra bem seus projetos.\n\n**Sugestão:** Que tal adicionar um modo escuro? Seria um diferencial interessante!',
        editado: false,
        ativo: true,
        criado_em: new Date('2024-01-14T11:15:00').toISOString(),
        atualizado_em: new Date('2024-01-14T11:15:00').toISOString(),
        autor_nome: 'Aluna Maria',
        autor_id: 3,
        respostas: [
            {
                id: 101,
                id_comentario: 1,
                id_usuario: 2,
                conteudo: 'Obrigado, Maria! A paleta foi inspirada no Material Design. Boa ideia sobre o modo escuro, vou implementar! 🌙',
                editado: false,
                ativo: true,
                criado_em: new Date('2024-01-14T11:30:00').toISOString(),
                autor_nome: 'Aluno João',
                autor_id: 2
            }
        ]
    },
    {
        id: 2,
        id_post: 1,
        id_usuario: 1,
        conteudo: 'Muito bom ver o projeto publicado aqui! A navegação mobile está excelente. 💪\nO código está bem estruturado e comentado. \n\n**Feedback técnico:** Testei o contraste de cores e sugiro aumentar um pouco para melhor acessibilidade. No geral, trabalho impecável!',
        editado: false,
        ativo: true,
        criado_em: new Date('2024-01-14T14:20:00').toISOString(),
        atualizado_em: new Date('2024-01-14T14:20:00').toISOString(),
        autor_nome: 'Professor Silva',
        autor_id: 1
    },
    {
        id: 3,
        id_post: 3,
        id_usuario: 2,
        conteudo: 'Ótimas dicas, professor! Uso o Pomodoro também e mudou completamente minha produtividade. 🕒\nRecomendo o app "Forest" para ajudar no foco - planta uma árvore virtual enquanto você estuda! 🌳\n\nAlguém mais tem dicas de apps para organização?',
        editado: false,
        ativo: true,
        criado_em: new Date('2024-01-16T10:30:00').toISOString(),
        atualizado_em: new Date('2024-01-16T10:30:00').toISOString(),
        autor_nome: 'Aluno João',
        autor_id: 2
    },
    {
        id: 4,
        id_post: 4,
        id_usuario: 3,
        conteudo: 'Topo o desafio! 🚀\n\n**Minha solução em JavaScript:**\n```javascript\nfunction customSort(arr) {\n    const numbers = arr.filter(item => typeof item === \"number\").sort((a, b) => a - b);\n    const strings = arr.filter(item => typeof item === \"string\").sort();\n    return [...numbers, ...strings];\n}\n```\n\nFunciona para o exemplo! Alguém consegue fazer de forma mais eficiente?',
        editado: false,
        ativo: true,
        criado_em: new Date('2024-01-17T17:30:00').toISOString(),
        atualizado_em: new Date('2024-01-17T17:30:00').toISOString(),
        autor_nome: 'Aluna Maria',
        autor_id: 3
    }
];

export const avaliacoesSociais = [
    {
        id: 1,
        id_post: 1,
        id_avaliador: 3,
        tipo: 'curtir',
        comentario: null,
        criado_em: new Date('2024-01-14T11:15:00').toISOString()
    },
    {
        id: 2,
        id_post: 1,
        id_avaliador: 1,
        tipo: 'curtir',
        comentario: null,
        criado_em: new Date('2024-01-14T14:20:00').toISOString()
    },
    {
        id: 3,
        id_post: 3,
        id_avaliador: 2,
        tipo: 'util',
        comentario: 'Vou implementar essas dicas no meu dia a dia!',
        criado_em: new Date('2024-01-16T10:30:00').toISOString()
    },
    {
        id: 4,
        id_post: 4,
        id_avaliador: 3,
        tipo: 'criativo',
        comentario: 'Desafio muito interessante!',
        criado_em: new Date('2024-01-17T17:30:00').toISOString()
    },
    {
        id: 5,
        id_post: 2,
        id_avaliador: 2,
        tipo: 'curtir',
        comentario: null,
        criado_em: new Date('2024-01-15T15:00:00').toISOString()
    }
];

export default {
    usuarios,
    atividades,
    trabalhos,
    postsSociais,
    comentarios,
    avaliacoesSociais
};