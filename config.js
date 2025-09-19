// Configurações globais da aplicação
const APP_CONFIG = {
    // Informações da aplicação
    name: 'Sistema de Cadastro de Ideias',
    version: '1.0.0',
    author: 'JXCoder-development',
    
    // Configurações de armazenamento
    storage: {
        keys: {
            ideas: 'ideas',
            syncedIds: 'syncedIds',
            sheetsUrl: 'sheetsUrl',
            sheetName: 'sheetName'
        }
    },
    
    // Configurações de notificação
    notifications: {
        duration: 4000, // 4 segundos
        types: {
            success: 'success',
            warning: 'warning',
            error: 'error',
            info: 'info'
        }
    },
    
    // Configurações de exportação
    export: {
        excel: {
            defaultFilename: 'ideias',
            columnWidths: [
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
            ]
        }
    },
    
    // Configurações do Google Sheets
    googleSheets: {
        defaultSheetName: 'Planilha1',
        timeout: 10000, // 10 segundos
        validDomains: ['script.google.com', 'script.googleusercontent.com']
    },
    
    // Mapeamentos de dados
    categories: {
        'tecnologia': {
            name: '🔧 Tecnologia',
            icon: '🔧'
        },
        'negocio': {
            name: '💼 Negócio',
            icon: '💼'
        },
        'criativo': {
            name: '🎨 Criativo',
            icon: '🎨'
        },
        'educacao': {
            name: '📚 Educação',
            icon: '📚'
        },
        'saude': {
            name: '🏥 Saúde',
            icon: '🏥'
        },
        'sustentabilidade': {
            name: '🌱 Sustentabilidade',
            icon: '🌱'
        },
        'outros': {
            name: '📋 Outros',
            icon: '📋'
        }
    },
    
    priorities: {
        'low': {
            name: '🟢 Baixa',
            icon: '🟢',
            class: 'priority-low'
        },
        'medium': {
            name: '🟡 Média',
            icon: '🟡',
            class: 'priority-medium'
        },
        'high': {
            name: '🔴 Alta',
            icon: '🔴',
            class: 'priority-high'
        }
    },
    
    statuses: {
        'ideia': {
            name: '💭 Ideia',
            icon: '💭'
        },
        'planejamento': {
            name: '📋 Planejamento',
            icon: '📋'
        },
        'desenvolvimento': {
            name: '⚙️ Desenvolvimento',
            icon: '⚙️'
        },
        'concluido': {
            name: '✅ Concluído',
            icon: '✅'
        }
    },
    
    // Código do Google Apps Script
    googleAppsScriptCode: `function doPost(e) {
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
}`,
    
    // URLs e links sociais
    socialLinks: {
        github: 'https://github.com/JXCoder-development',
        behance: 'https://www.behance.net/JXCoder-development',
        bento: 'https://bento.me/JXCoder-development',
        linkedin: 'https://linkedin.com/in/JXCoder-development',
        twitter: 'https://twitter.com/JXCoder_dev'
    }
};

// Exportar configurações para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}