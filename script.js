class IdeaManager {
    constructor() {
        this.ideas = JSON.parse(localStorage.getItem('ideas')) || [];
        this.syncedIds = new Set(JSON.parse(localStorage.getItem('syncedIds')) || []);
        this.init();
    }

    init() {
        this.loadGoogleAppsScriptCode();
        this.bindEvents();
        this.renderIdeas();
        this.updateCounter();
        this.updateSyncStatus();
    }

    loadGoogleAppsScriptCode() {
        const codeElement = document.getElementById('appsScriptCode');
        if (codeElement) {
            // Código do Google Apps Script
            const appsScriptCode = `function doPost(e) {
  try {
    let data;
    
    // Múltiplas formas de receber dados para máxima compatibilidade
    if (e && e.parameter && e.parameter.data) {
      // Dados via FormData
      data = JSON.parse(e.parameter.data);
    } else if (e && e.postData && e.postData.contents) {
      // Dados via JSON direto
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameters) {
      // Dados via parâmetros URL
      data = {
        sheetName: e.parameters.sheetName ? e.parameters.sheetName[0] : 'Planilha1',
        ideas: e.parameters.ideas ? JSON.parse(e.parameters.ideas[0]) : []
      };
    } else {
      // Dados de teste se nada for encontrado
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Nenhum dado recebido. Verifique o formato do envio.',
          debug: {
            hasE: !!e,
            hasParameter: !!(e && e.parameter),
            hasPostData: !!(e && e.postData),
            eKeys: e ? Object.keys(e) : []
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheetName = data.sheetName || 'Planilha1';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // Se a aba não existir, criar uma nova
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }
    
    // Verificar se há cabeçalhos, se não, adicionar
    if (sheet.getLastRow() === 0) {
      const headers = [
        'ID', 'Título', 'Categoria', 'Descrição', 'Prioridade', 
        'Status', 'Data Limite', 'Tags', 'Data de Criação', 'Última Atualização'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Formatação do cabeçalho
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4CAF50');
      headerRange.setFontColor('white');
      headerRange.setHorizontalAlignment('center');
    }
    
    // Adicionar os dados das ideias
    let rowsAdded = 0;
    if (data.ideas && Array.isArray(data.ideas) && data.ideas.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      const numRows = data.ideas.length;
      const numCols = Math.max(...data.ideas.map(row => row.length));
      
      // Inserir todas as linhas de uma vez
      sheet.getRange(startRow, 1, numRows, numCols).setValues(data.ideas);
      rowsAdded = numRows;
      
      // Aplicar formatação alternada nas linhas
      for (let i = 0; i < numRows; i++) {
        const rowNum = startRow + i;
        const rowRange = sheet.getRange(rowNum, 1, 1, numCols);
        
        if (i % 2 === 0) {
          rowRange.setBackground('#f8f9fa');
        }
        
        // Formatação especial para prioridades
        const priorityCell = sheet.getRange(rowNum, 5); // Coluna da prioridade
        const priorityValue = priorityCell.getValue();
        
        if (priorityValue && priorityValue.toString().includes('Alta')) {
          priorityCell.setBackground('#ffebee');
          priorityCell.setFontColor('#c62828');
        } else if (priorityValue && priorityValue.toString().includes('Média')) {
          priorityCell.setBackground('#fff8e1');
          priorityCell.setFontColor('#f57c00');
        } else if (priorityValue && priorityValue.toString().includes('Baixa')) {
          priorityCell.setBackground('#e8f5e8');
          priorityCell.setFontColor('#2e7d32');
        }
      }
    }
    
    // Ajustar largura das colunas automaticamente
    sheet.autoResizeColumns(1, 10);
    
    // Congelar a primeira linha (cabeçalhos)
    sheet.setFrozenRows(1);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: \`\${rowsAdded} ideias adicionadas com sucesso na aba "\${sheetName}"!\`,
        rowsAdded: rowsAdded,
        sheetName: sheetName,
        totalRows: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Erro detalhado: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Erro no servidor: ' + error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Web App funcionando! ✅',
      timestamp: new Date().toISOString(),
      method: 'GET'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Função de teste para verificar se tudo está funcionando
function testFunction() {
  const testData = {
    sheetName: 'Teste',
    ideas: [
      [1, 'Ideia Teste', '🔧 Tecnologia', 'Descrição teste', '🟡 Média', '💭 Ideia', '', 'teste', '01/01/2024', '01/01/2024']
    ]
  };
  
  const mockEvent = {
    parameter: {
      data: JSON.stringify(testData)
    }
  };
  
  return doPost(mockEvent);
}`;
            
            codeElement.textContent = appsScriptCode;
        }
    }

    bindEvents() {
        const ideaForm = document.getElementById('ideaForm');
        if (ideaForm) {
            ideaForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterIdeas());
        }

        const filterCategory = document.getElementById('filterCategory');
        if (filterCategory) {
            filterCategory.addEventListener('change', () => this.filterIdeas());
        }

        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterIdeas());
        }

        const exportExcel = document.getElementById('exportExcel');
        if (exportExcel) {
            exportExcel.addEventListener('click', () => this.exportToExcel());
        }

        const exportGoogleSheets = document.getElementById('exportGoogleSheets');
        if (exportGoogleSheets) {
            exportGoogleSheets.addEventListener('click', () => this.exportToGoogleSheets());
        }

        const copyCode = document.getElementById('copyCode');
        if (copyCode) {
            copyCode.addEventListener('click', () => this.copyAppsScriptCode());
        }

        const testConnection = document.getElementById('testConnection');
        if (testConnection) {
            testConnection.addEventListener('click', () => this.testConnection());
        }
        
        // Carregar configurações salvas
        this.loadSheetsConfig();
    }

    handleSubmit(e) {
        e.preventDefault();
        
        // Validação dos campos obrigatórios
        const title = document.getElementById('title')?.value?.trim();
        const category = document.getElementById('category')?.value;
        const description = document.getElementById('description')?.value?.trim();
        const priority = document.getElementById('priority')?.value;
        const status = document.getElementById('status')?.value;

        if (!title) {
            this.showNotification('O título é obrigatório! ⚠️', 'warning');
            return;
        }

        if (!category) {
            this.showNotification('A categoria é obrigatória! ⚠️', 'warning');
            return;
        }

        if (!description) {
            this.showNotification('A descrição é obrigatória! ⚠️', 'warning');
            return;
        }
        
        const idea = {
            id: Date.now(),
            title: title,
            category: category,
            description: description,
            priority: priority || 'medium',
            status: status || 'ideia',
            deadline: document.getElementById('deadline')?.value || '',
            tags: document.getElementById('tags')?.value?.split(',')?.map(tag => tag.trim())?.filter(tag => tag) || [],
            createdAt: new Date().toLocaleDateString('pt-BR'),
            updatedAt: new Date().toLocaleDateString('pt-BR')
        };

        console.log('Nova ideia criada:', idea); // Debug

        this.ideas.unshift(idea);
        this.saveToStorage();
        this.renderIdeas();
        this.updateCounter();
        e.target.reset();
        
        // Feedback visual
        this.showNotification('Ideia cadastrada com sucesso! ✨');
    }

    saveToStorage() {
        try {
            localStorage.setItem('ideas', JSON.stringify(this.ideas));
            localStorage.setItem('syncedIds', JSON.stringify([...this.syncedIds]));
            this.updateSyncStatus();
            console.log('Dados salvos no localStorage:', this.ideas.length, 'ideias'); // Debug
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            this.showNotification('Erro ao salvar dados! ❌', 'error');
        }
    }

    renderIdeas(ideasToRender = this.ideas) {
        console.log('Renderizando ideias:', ideasToRender.length); // Debug
        
        const container = document.getElementById('ideasContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) {
            console.error('Container de ideias não encontrado!');
            return;
        }

        if (!emptyState) {
            console.error('Estado vazio não encontrado!');
            return;
        }
        
        if (ideasToRender.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            console.log('Nenhuma ideia para renderizar'); // Debug
            return;
        }
        
        emptyState.classList.add('hidden');
        
        try {
            const cardsHtml = ideasToRender.map(idea => this.createIdeaCard(idea)).join('');
            container.innerHTML = cardsHtml;
            console.log('Cards renderizados com sucesso'); // Debug
            
            // Adicionar event listeners para os botões
            this.bindCardEvents(container);
        } catch (error) {
            console.error('Erro ao renderizar cards:', error);
            this.showNotification('Erro ao exibir ideias! ❌', 'error');
        }
    }

    bindCardEvents(container) {
        // Botões de deletar
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteIdea(id);
            });
        });

        // Botões de editar
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.toggleEditMode(id);
            });
        });

        // Botões de salvar
        container.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.saveIdeaChanges(id);
            });
        });

        // Botões de cancelar
        container.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.cancelEdit(id);
            });
        });
    }

    createIdeaCard(idea) {
        if (!idea || !idea.id) {
            console.error('Ideia inválida:', idea);
            return '';
        }

        const priorityClass = `priority-${idea.priority}`;
        const categoryIcons = {
            'tecnologia': '🔧',
            'negocio': '💼',
            'criativo': '🎨',
            'educacao': '📚',
            'saude': '🏥',
            'sustentabilidade': '🌱',
            'outros': '📋'
        };
        
        const statusIcons = {
            'ideia': '💭',
            'planejamento': '📋',
            'desenvolvimento': '⚙️',
            'concluido': '✅'
        };

        const tagsHtml = (idea.tags || []).map(tag => 
            `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">${this.escapeHtml(tag)}</span>`
        ).join(' ');

        const isSynced = this.syncedIds.has(idea.id);
        const syncIndicator = isSynced ? 
            '<span class="text-green-500 text-xs" title="Sincronizado com Google Sheets">☁️ Sincronizado</span>' :
            '<span class="text-orange-500 text-xs" title="Pendente de sincronização">⏳ Pendente</span>';

        return `
            <div class="idea-card bg-white rounded-xl shadow-lg p-6 ${priorityClass} fade-in" data-id="${idea.id}">
                <!-- Modo Visualização -->
                <div class="view-mode">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center space-x-2">
                            <span class="text-2xl">${categoryIcons[idea.category] || '📋'}</span>
                            <h3 class="text-lg font-semibold text-gray-800 line-clamp-2">${this.escapeHtml(idea.title)}</h3>
                        </div>
                        <div class="flex items-center gap-2">
                            ${syncIndicator}
                            <button class="edit-btn text-blue-500 hover:text-blue-700 transition-colors" data-id="${idea.id}" title="Editar">
                                ✏️
                            </button>
                            <button class="delete-btn text-red-500 hover:text-red-700 transition-colors" data-id="${idea.id}" title="Excluir">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <p class="text-gray-600 mb-4 line-clamp-3">${this.escapeHtml(idea.description)}</p>
                    
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-500">Categoria:</span>
                            <span class="text-sm font-medium">${this.getCategoryName(idea.category)}</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-500">Prioridade:</span>
                            <span class="text-sm font-medium">${this.getPriorityName(idea.priority)}</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-500">Status:</span>
                            <span class="text-sm font-medium">${this.getStatusName(idea.status)}</span>
                        </div>
                        
                        ${idea.deadline ? `
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-500">Prazo:</span>
                                <span class="text-sm font-medium">${new Date(idea.deadline).toLocaleDateString('pt-BR')}</span>
                            </div>
                        ` : ''}
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-500">Criado:</span>
                            <span class="text-sm">${idea.createdAt}</span>
                        </div>
                        
                        ${(idea.tags && idea.tags.length > 0) ? `
                            <div class="pt-2">
                                <div class="flex flex-wrap gap-1">
                                    ${tagsHtml}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Modo Edição -->
                <div class="edit-mode hidden">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Título</label>
                            <input type="text" class="edit-title w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="${this.escapeHtml(idea.title)}">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select class="edit-category w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="tecnologia" ${idea.category === 'tecnologia' ? 'selected' : ''}>🔧 Tecnologia</option>
                                    <option value="negocio" ${idea.category === 'negocio' ? 'selected' : ''}>💼 Negócio</option>
                                    <option value="criativo" ${idea.category === 'criativo' ? 'selected' : ''}>🎨 Criativo</option>
                                    <option value="educacao" ${idea.category === 'educacao' ? 'selected' : ''}>📚 Educação</option>
                                    <option value="saude" ${idea.category === 'saude' ? 'selected' : ''}>🏥 Saúde</option>
                                    <option value="sustentabilidade" ${idea.category === 'sustentabilidade' ? 'selected' : ''}>🌱 Sustentabilidade</option>
                                    <option value="outros" ${idea.category === 'outros' ? 'selected' : ''}>📋 Outros</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                <select class="edit-priority w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="low" ${idea.priority === 'low' ? 'selected' : ''}>🟢 Baixa</option>
                                    <option value="medium" ${idea.priority === 'medium' ? 'selected' : ''}>🟡 Média</option>
                                    <option value="high" ${idea.priority === 'high' ? 'selected' : ''}>🔴 Alta</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea class="edit-description w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows="3">${this.escapeHtml(idea.description)}</textarea>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select class="edit-status w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="ideia" ${idea.status === 'ideia' ? 'selected' : ''}>💭 Ideia</option>
                                    <option value="planejamento" ${idea.status === 'planejamento' ? 'selected' : ''}>📋 Planejamento</option>
                                    <option value="desenvolvimento" ${idea.status === 'desenvolvimento' ? 'selected' : ''}>⚙️ Desenvolvimento</option>
                                    <option value="concluido" ${idea.status === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
                                <input type="date" class="edit-deadline w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="${idea.deadline || ''}">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
                            <input type="text" class="edit-tags w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="${(idea.tags || []).join(', ')}" placeholder="tag1, tag2, tag3">
                        </div>
                        
                        <div class="flex gap-2 pt-2">
                            <button class="save-btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2" data-id="${idea.id}">
                                ✅ Salvar
                            </button>
                            <button class="cancel-btn bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2" data-id="${idea.id}">
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Função para escapar HTML e prevenir XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    deleteIdea(id) {
        if (confirm('Tem certeza que deseja excluir esta ideia?')) {
            this.ideas = this.ideas.filter(idea => idea.id !== id);
            this.syncedIds.delete(id); // Remove do controle de sincronização
            this.saveToStorage();
            this.renderIdeas();
            this.updateCounter();
            this.showNotification('Ideia excluída com sucesso! 🗑️');
        }
    }

    updateIdeaStatus(id, newStatus) {
        const idea = this.ideas.find(idea => idea.id === id);
        if (idea) {
            idea.status = newStatus;
            idea.updatedAt = new Date().toLocaleDateString('pt-BR');
            // Remove da lista de sincronizados pois foi modificado
            this.syncedIds.delete(id);
            this.saveToStorage();
            this.renderIdeas(); // Re-renderizar para atualizar indicador
            this.showNotification('Status atualizado! 📝');
        }
    }

    toggleEditMode(id) {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) {
            const viewMode = card.querySelector('.view-mode');
            const editMode = card.querySelector('.edit-mode');
            
            if (viewMode.classList.contains('hidden')) {
                // Cancelar edição
                this.cancelEdit(id);
            } else {
                // Entrar no modo de edição
                viewMode.classList.add('hidden');
                editMode.classList.remove('hidden');
            }
        }
    }

    saveIdeaChanges(id) {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (!card) return;

        const idea = this.ideas.find(idea => idea.id === id);
        if (!idea) return;

        // Capturar valores dos campos de edição
        const title = card.querySelector('.edit-title').value.trim();
        const category = card.querySelector('.edit-category').value;
        const description = card.querySelector('.edit-description').value.trim();
        const priority = card.querySelector('.edit-priority').value;
        const status = card.querySelector('.edit-status').value;
        const deadline = card.querySelector('.edit-deadline').value;
        const tagsInput = card.querySelector('.edit-tags').value.trim();

        // Validação básica
        if (!title) {
            this.showNotification('O título é obrigatório! ⚠️', 'warning');
            return;
        }

        if (!description) {
            this.showNotification('A descrição é obrigatória! ⚠️', 'warning');
            return;
        }

        // Processar tags
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        // Atualizar a ideia
        idea.title = title;
        idea.category = category;
        idea.description = description;
        idea.priority = priority;
        idea.status = status;
        idea.deadline = deadline;
        idea.tags = tags;
        idea.updatedAt = new Date().toLocaleDateString('pt-BR');

        // Remove da lista de sincronizados pois foi modificado
        this.syncedIds.delete(id);

        // Salvar e atualizar interface
        this.saveToStorage();
        this.renderIdeas();
        this.updateCounter();
        
        this.showNotification('Ideia atualizada com sucesso! ✨');
    }

    cancelEdit(id) {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) {
            const viewMode = card.querySelector('.view-mode');
            const editMode = card.querySelector('.edit-mode');
            
            // Voltar ao modo de visualização
            editMode.classList.add('hidden');
            viewMode.classList.remove('hidden');
            
            // Restaurar valores originais (opcional, mas boa prática)
            const idea = this.ideas.find(idea => idea.id === id);
            if (idea) {
                card.querySelector('.edit-title').value = idea.title;
                card.querySelector('.edit-category').value = idea.category;
                card.querySelector('.edit-description').value = idea.description;
                card.querySelector('.edit-priority').value = idea.priority;
                card.querySelector('.edit-status').value = idea.status;
                card.querySelector('.edit-deadline').value = idea.deadline || '';
                card.querySelector('.edit-tags').value = (idea.tags || []).join(', ');
            }
        }
    }

    filterIdeas() {
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const categoryFilter = document.getElementById('filterCategory')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';

        const filteredIdeas = this.ideas.filter(idea => {
            const matchesSearch = idea.title.toLowerCase().includes(searchTerm) || 
                                idea.description.toLowerCase().includes(searchTerm) ||
                                (idea.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
            const matchesCategory = !categoryFilter || idea.category === categoryFilter;
            const matchesStatus = !statusFilter || idea.status === statusFilter;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.renderIdeas(filteredIdeas);
        const totalCount = document.getElementById('totalCount');
        if (totalCount) {
            totalCount.textContent = filteredIdeas.length;
        }
    }

    updateCounter() {
        const totalCount = document.getElementById('totalCount');
        if (totalCount) {
            totalCount.textContent = this.ideas.length;
        }
    }

    exportToExcel() {
        if (this.ideas.length === 0) {
            this.showNotification('Nenhuma ideia para exportar! 📋', 'warning');
            return;
        }

        // Preparar dados para o Excel
        const excelData = this.ideas.map(idea => ({
            'ID': idea.id,
            'Título': idea.title,
            'Categoria': this.getCategoryName(idea.category),
            'Descrição': idea.description,
            'Prioridade': this.getPriorityName(idea.priority),
            'Status': this.getStatusName(idea.status),
            'Data Limite': idea.deadline ? new Date(idea.deadline).toLocaleDateString('pt-BR') : '',
            'Tags': (idea.tags || []).join(', '),
            'Data de Criação': idea.createdAt,
            'Última Atualização': idea.updatedAt
        }));

        // Criar workbook e worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Configurar largura das colunas
        const colWidths = [
            { wch: 12 }, // ID
            { wch: 30 }, // Título
            { wch: 15 }, // Categoria
            { wch: 50 }, // Descrição
            { wch: 12 }, // Prioridade
            { wch: 15 }, // Status
            { wch: 15 }, // Data Limite
            { wch: 30 }, // Tags
            { wch: 15 }, // Data de Criação
            { wch: 18 }  // Última Atualização
        ];
        ws['!cols'] = colWidths;

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Ideias');

        // Gerar nome do arquivo com data atual
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
        const filename = `ideias_${dateStr}_${timeStr}.xlsx`;

        // Fazer download do arquivo
        XLSX.writeFile(wb, filename);
        
        this.showNotification(`Excel exportado com sucesso! 📊 (${this.ideas.length} ideias)`, 'success');
    }

    getCategoryName(category) {
        const categories = {
            'tecnologia': '🔧 Tecnologia',
            'negocio': '💼 Negócio',
            'criativo': '🎨 Criativo',
            'educacao': '📚 Educação',
            'saude': '🏥 Saúde',
            'sustentabilidade': '🌱 Sustentabilidade',
            'outros': '📋 Outros'
        };
        return categories[category] || category;
    }

    getPriorityName(priority) {
        const priorities = {
            'low': '🟢 Baixa',
            'medium': '🟡 Média',
            'high': '🔴 Alta'
        };
        return priorities[priority] || priority;
    }

    getStatusName(status) {
        const statuses = {
            'ideia': '💭 Ideia',
            'planejamento': '📋 Planejamento',
            'desenvolvimento': '⚙️ Desenvolvimento',
            'concluido': '✅ Concluído'
        };
        return statuses[status] || status;
    }

    async exportToGoogleSheets() {
        const webAppUrl = document.getElementById('sheetsUrl')?.value?.trim();
        const sheetName = document.getElementById('sheetName')?.value?.trim() || 'Planilha1';
        
        if (!webAppUrl) {
            this.showNotification('Por favor, configure a URL do Web App! 📋', 'warning');
            return;
        }
        
        if (this.ideas.length === 0) {
            this.showNotification('Nenhuma ideia para sincronizar! 📋', 'warning');
            return;
        }
        
        // Filtrar apenas ideias não sincronizadas
        const unsyncedIdeas = this.ideas.filter(idea => !this.syncedIds.has(idea.id));
        
        if (unsyncedIdeas.length === 0) {
            this.showNotification('✅ Todas as ideias já estão sincronizadas com o Google Sheets!', 'success');
            return;
        }
        
        // Verificar se é uma URL válida do Apps Script
        if (!webAppUrl.includes('script.google.com') && !webAppUrl.includes('script.googleusercontent.com')) {
            this.showNotification('URL inválida! Use a URL do Web App do Apps Script. ❌', 'error');
            return;
        }
        
        try {
            this.showNotification(`Sincronizando ${unsyncedIdeas.length} nova(s) ideia(s)... 🔄`, 'info');
            
            // Primeiro, testar se o Web App está funcionando
            try {
                const testResponse = await fetch(webAppUrl, {
                    method: 'GET',
                    mode: 'cors'
                });
                
                if (!testResponse.ok) {
                    throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
                }
                
                const testResult = await testResponse.json();
                if (!testResult.success) {
                    throw new Error('Web App não está respondendo corretamente');
                }
                
                this.showNotification('Conexão OK! Enviando apenas ideias novas... 📤', 'info');
            } catch (testError) {
                this.showNotification('❌ Erro na conexão: Verifique se a URL está correta e se o Web App foi implantado com acesso "Qualquer pessoa"', 'error');
                console.error('Erro de teste:', testError);
                return;
            }
            
            // Preparar dados apenas das ideias não sincronizadas
            const dataToSend = {
                sheetName: sheetName,
                ideas: unsyncedIdeas.map(idea => [
                    String(idea.id),
                    String(idea.title || ''),
                    String(this.getCategoryName(idea.category) || ''),
                    String(idea.description || ''),
                    String(this.getPriorityName(idea.priority) || ''),
                    String(this.getStatusName(idea.status) || ''),
                    idea.deadline ? String(new Date(idea.deadline).toLocaleDateString('pt-BR')) : '',
                    String((idea.tags || []).join(', ')),
                    String(idea.createdAt || ''),
                    String(idea.updatedAt || '')
                ])
            };
            
            // Tentar múltiplos métodos de envio
            let response;
            let result;
            
            // Método 1: FormData (mais compatível)
            try {
                const formData = new FormData();
                formData.append('data', JSON.stringify(dataToSend));
                
                response = await fetch(webAppUrl, {
                    method: 'POST',
                    body: formData,
                    mode: 'cors'
                });
                
                if (response.ok) {
                    result = await response.json();
                } else {
                    throw new Error('FormData method failed');
                }
            } catch (formDataError) {
                console.log('FormData falhou, tentando JSON direto...');
                
                // Método 2: JSON direto
                try {
                    response = await fetch(webAppUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(dataToSend),
                        mode: 'cors'
                    });
                    
                    if (response.ok) {
                        result = await response.json();
                    } else {
                        throw new Error('JSON method failed');
                    }
                } catch (jsonError) {
                    console.log('JSON falhou, tentando URL params...');
                    
                    // Método 3: URL Parameters (último recurso)
                    const params = new URLSearchParams();
                    params.append('data', JSON.stringify(dataToSend));
                    
                    response = await fetch(webAppUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: params,
                        mode: 'cors'
                    });
                    
                    result = await response.json();
                }
            }
            
            // Verificar resultado
            if (result && result.success) {
                // Marcar as ideias como sincronizadas
                unsyncedIdeas.forEach(idea => {
                    this.syncedIds.add(idea.id);
                });
                
                this.saveToStorage();
                this.renderIdeas(); // Re-renderizar para atualizar indicadores
                this.saveSheetsConfig(webAppUrl, sheetName);
                
                this.showNotification(`✅ ${unsyncedIdeas.length} nova(s) ideia(s) sincronizada(s) com "${result.sheetName || sheetName}"!`, 'success');
            } else {
                const errorMsg = result ? result.message : 'Resposta inválida do servidor';
                this.showNotification(`❌ Erro: ${errorMsg}`, 'error');
                console.error('Resultado completo:', result);
            }
            
        } catch (error) {
            console.error('Erro completo:', error);
            let errorMessage = 'Erro desconhecido ao conectar com Google Sheets';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Erro de rede: Verifique sua conexão com a internet';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'Erro CORS: Verifique se o Web App foi implantado corretamente';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'Erro de formato: O servidor não retornou dados válidos';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showNotification(`🌐 ${errorMessage}`, 'error');
        }
    }
    
    saveSheetsConfig(url, sheetName) {
        localStorage.setItem('sheetsUrl', url);
        localStorage.setItem('sheetName', sheetName);
    }
    
    loadSheetsConfig() {
        const savedUrl = localStorage.getItem('sheetsUrl');
        const savedSheetName = localStorage.getItem('sheetName');
        
        if (savedUrl) {
            const urlInput = document.getElementById('sheetsUrl');
            if (urlInput) urlInput.value = savedUrl;
        }
        if (savedSheetName) {
            const nameInput = document.getElementById('sheetName');
            if (nameInput) nameInput.value = savedSheetName;
        }
    }
    
    copyAppsScriptCode() {
        const code = document.getElementById('appsScriptCode')?.textContent;
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                this.showNotification('Código copiado para a área de transferência! 📋', 'success');
            }).catch(() => {
                this.showNotification('Erro ao copiar. Selecione e copie manualmente. ❌', 'error');
            });
        }
    }

    async testConnection() {
        const webAppUrl = document.getElementById('sheetsUrl')?.value?.trim();
        const statusDiv = document.getElementById('connectionStatus');
        
        if (!webAppUrl) {
            this.showNotification('Por favor, insira a URL do Web App primeiro! 📋', 'warning');
            return;
        }
        
        // Verificar se é uma URL válida do Apps Script
        if (!webAppUrl.includes('script.google.com') && !webAppUrl.includes('script.googleusercontent.com')) {
            if (statusDiv) statusDiv.innerHTML = '<span class="text-red-400">❌ URL inválida</span>';
            this.showNotification('URL inválida! Use a URL do Web App do Apps Script. ❌', 'error');
            return;
        }
        
        if (statusDiv) statusDiv.innerHTML = '<span class="text-blue-400">🔄 Testando...</span>';
        
        try {
            // Teste 1: Verificar se a URL responde
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
            
            const response = await fetch(webAppUrl, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.message && result.message.includes('funcionando')) {
                if (statusDiv) statusDiv.innerHTML = '<span class="text-green-400">✅ Conexão OK!</span>';
                this.showNotification('✅ Conexão testada com sucesso! O Web App está funcionando.', 'success');
                
                // Salvar URL se o teste passou
                this.saveSheetsConfig(webAppUrl, document.getElementById('sheetName')?.value?.trim() || '');
            } else {
                if (statusDiv) statusDiv.innerHTML = '<span class="text-yellow-400">⚠️ Resposta inesperada</span>';
                this.showNotification('⚠️ O Web App respondeu, mas com formato inesperado. Verifique o código do Apps Script.', 'warning');
            }
            
        } catch (error) {
            console.error('Erro no teste:', error);
            
            let errorMessage = '';
            let statusMessage = '';
            
            if (error.name === 'AbortError') {
                errorMessage = 'Timeout: O Web App não respondeu em 10 segundos';
                statusMessage = '<span class="text-red-400">❌ Timeout</span>';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Erro de rede: Verifique se o Web App foi implantado corretamente';
                statusMessage = '<span class="text-red-400">❌ Erro de rede</span>';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'Erro CORS: Verifique as configurações de acesso do Web App';
                statusMessage = '<span class="text-red-400">❌ Erro CORS</span>';
            } else if (error.message.includes('404')) {
                errorMessage = 'URL não encontrada: Verifique se a URL do Web App está correta';
                statusMessage = '<span class="text-red-400">❌ URL não encontrada</span>';
            } else if (error.message.includes('403')) {
                errorMessage = 'Acesso negado: Verifique se o Web App tem acesso "Qualquer pessoa"';
                statusMessage = '<span class="text-red-400">❌ Acesso negado</span>';
            } else {
                errorMessage = `Erro: ${error.message}`;
                statusMessage = '<span class="text-red-400">❌ Erro</span>';
            }
            
            if (statusDiv) statusDiv.innerHTML = statusMessage;
            this.showNotification(errorMessage, 'error');
        }
    }

    updateSyncStatus() {
        const unsyncedCount = this.ideas.filter(idea => !this.syncedIds.has(idea.id)).length;
        
        // Atualizar badge
        const badge = document.getElementById('syncBadge');
        if (badge) {
            if (unsyncedCount > 0) {
                badge.textContent = unsyncedCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        // Atualizar status text
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            if (this.ideas.length === 0) {
                statusElement.textContent = '';
            } else if (unsyncedCount === 0) {
                statusElement.textContent = '✅ Tudo sincronizado';
                statusElement.className = 'block text-xs text-green-300 mt-1';
            } else {
                statusElement.textContent = `⏳ ${unsyncedCount} pendente(s)`;
                statusElement.className = 'block text-xs text-orange-300 mt-1';
            }
        }
    }

    showNotification(message, type = 'success') {
        // Criar notificação temporária
        const bgColor = type === 'success' ? 'bg-green-500' : 
                       type === 'warning' ? 'bg-yellow-500' : 
                       type === 'error' ? 'bg-red-500' :
                       type === 'info' ? 'bg-blue-500' : 'bg-gray-500';
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Função para alternar seções colapsáveis
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const arrowId = sectionId.replace('Section', 'Arrow').replace('Instructions', 'Arrow').replace('Warning', 'Arrow').replace('troubleshooting', 'troubleshootingArrow').replace('Test', 'Arrow');
    const arrow = document.getElementById(arrowId);
    
    if (section && arrow) {
        if (section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            arrow.style.transform = 'rotate(180deg)';
        } else {
            section.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

// Inicializar o sistema
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando IdeaManager...'); // Debug
    new IdeaManager();
});