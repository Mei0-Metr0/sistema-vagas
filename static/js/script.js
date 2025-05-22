document.addEventListener('DOMContentLoaded', function() {
    
    const cotasInputs = {
        'AC': document.getElementById('ac'),
        'LI_EP': document.getElementById('li_ep'),
        'LI_PCD': document.getElementById('li_pcd'),
        'LI_Q': document.getElementById('li_q'),
        'LI_PPI': document.getElementById('li_ppi'),
        'LB_EP': document.getElementById('lb_ep'),
        'LB_PCD': document.getElementById('lb_pcd'),
        'LB_Q': document.getElementById('lb_q'),
        'LB_PPI': document.getElementById('lb_ppi')
    };
    
    const totalVagasSpan = document.getElementById('total-vagas');
    const confirmarVagasBtn = document.getElementById('confirmar-vagas');
    const csvFileInput = document.getElementById('csv-file');
    const uploadCsvBtn = document.getElementById('upload-csv');
    const uploadStatusDiv = document.getElementById('upload-status');
    const csvPreviewDiv = document.getElementById('csv-preview');
    const fatorMultiplicacaoInput = document.getElementById('fator-multiplicacao');
    const fatorValueSpan = document.getElementById('fator-value');
    const gerarChamadaBtn = document.getElementById('gerar-chamada');
    const chamadaStatusDiv = document.getElementById('chamada-status');
    const estatisticasChamadaDiv = document.getElementById('estatisticas-chamada');
    const saldoVagasTbody = document.querySelector('#saldo-vagas tbody');
    const vagasSelecionadasTbody = document.querySelector('#vagas-selecionadas tbody');
    const candidatosChamadosTable = document.getElementById('candidatos-chamados');
    const downloadChamadaBtn = document.getElementById('download-chamada');
    const naoHomologadosSection = document.getElementById('nao-homologados-section');
    const marcarNaoHomologadosBtn = document.getElementById('marcar-nao-homologados');
    const naoHomologadosStatusDiv = document.getElementById('nao-homologados-status');
    const vagasDisponiveisDiv = document.getElementById('vagas-disponiveis');
    const vagasDisponiveisTbody = document.getElementById('vagas-disponiveis-body');
    const proximaChamadaNumSpan = document.getElementById('proxima-chamada-num');

    // Variáveis de estado
    let chamadaNum = 1;
    let allCpfs = [];
    let selectedCpfs = new Set();
    let currentSort = { column: 'Nota Final', direction: 'desc' };
    let currentFilter = 'todas';

    // Event Listeners
    Object.values(cotasInputs).forEach(input => {
        input.addEventListener('change', calcularTotalVagas);
    });
    
    confirmarVagasBtn.addEventListener('click', confirmarVagas);
    uploadCsvBtn.addEventListener('click', uploadCSV);
    fatorMultiplicacaoInput.addEventListener('input', updateFatorValue);
    gerarChamadaBtn.addEventListener('click', gerarChamada);
    downloadChamadaBtn.addEventListener('click', downloadChamada);
    marcarNaoHomologadosBtn.addEventListener('click', marcarNaoHomologados);

    document.getElementById('filter-cota').addEventListener('change', function() {
        currentFilter = this.value;
        displayCandidatosChamados(currentCandidatosData);
    });

    document.getElementById('pular-homologacao').addEventListener('click', function() {
        fetch('/marcar_nao_homologados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nao_homologados_cpfs: [] })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert(naoHomologadosStatusDiv, 'Processamento concluído sem candidatos não homologados!', 'success');
                displayNovasVagas(data);
                proximaChamadaNumSpan.textContent = data.proxima_chamada;
                
                fetchCandidatosAtualizados();
            } else {
                showAlert(naoHomologadosStatusDiv, data.message || 'Erro ao processar', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(naoHomologadosStatusDiv, 'Erro ao processar', 'error');
        });
    });
    
    // Inicialização
    calcularTotalVagas();
    updateFatorValue();
    setupCPFSearch();

    // Funções
    function displayCandidatosChamados(data) {
        const filteredData = data.filter(candidato => 
            candidato['vagaGarantida'] !== "Não homologado"
        );
        
        currentCandidatosData = [...filteredData];
        
        // Aplicar filtro e ordenação
        const filteredDataForDisplay  = applyFilter(currentCandidatosData);
        const sortedData = applySort(filteredDataForDisplay );
        
        const headers = Object.keys(sortedData[0]);
        
        // Cabeçalho
        let thead = candidatosChamadosTable.querySelector('thead');
        thead.innerHTML = '<tr></tr>';
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            
            // Adicionar indicador de ordenação se for a coluna atual
            if (header === currentSort.column) {
                th.classList.add(`sort-${currentSort.direction}`);
            }
            
            th.addEventListener('click', () => {
                toggleSort(header);
            });
            thead.querySelector('tr').appendChild(th);
        });
        
        // Corpo
        let tbody = candidatosChamadosTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (sortedData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="${headers.length}" class="text-center">Nenhum candidato encontrado</td>`;
            tbody.appendChild(row);
        } else {
            sortedData.forEach(candidato => {
                const row = document.createElement('tr');
                headers.forEach(header => {
                    row.innerHTML += `<td>${candidato[header]}</td>`;
                });
                
                // Adiciona efeito visual para novos candidatos
                if (candidato['ch'] === chamadaNum && candidato['vagaSelecionada']) {
                    row.classList.add('table-success');
                    setTimeout(() => {
                        row.classList.remove('table-success');
                    }, 3000);
                }
                
                tbody.appendChild(row);
            });
        }
    }

    function applySort(data) {
        return [...data].sort((a, b) => {
            let valueA = a[currentSort.column];
            let valueB = b[currentSort.column];
            
            if (currentSort.column === 'Nota Final') {
                valueA = parseFloat(valueA);
                valueB = parseFloat(valueB);
            }
            
            if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
            if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
            return 0;
        });
    }

    function applyFilter(data) {
        if (currentFilter === 'todas') return data;
        return data.filter(candidato => candidato['Cota do candidato'] === currentFilter);
    }

    function toggleSort(column) {
        if (currentSort.column === column) {
            // Inverter direção se clicado na mesma coluna
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Ordenar pela nova coluna (padrão decrescente para notas, crescente para texto)
            currentSort.column = column;
            currentSort.direction = column === 'Nota Final' ? 'desc' : 'asc';
        }
        
        displayCandidatosChamados(currentCandidatosData);
    }

    function calcularTotalVagas() {
        let total = 0;
        Object.values(cotasInputs).forEach(input => {
            total += parseInt(input.value) || 0;
        });
        totalVagasSpan.textContent = total;
    }
    
    function confirmarVagas() {
        const vagas = {};
        Object.keys(cotasInputs).forEach(key => {
            vagas[key] = cotasInputs[key].value;
        });
        
        fetch('/confirmar_vagas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vagas)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert(confirmarVagasBtn, 'Distribuição de vagas confirmada!', 'success');
            } else {
                showAlert(confirmarVagasBtn, 'Erro ao confirmar vagas', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(confirmarVagasBtn, 'Erro ao confirmar vagas', 'error');
        });
    }
    
    function uploadCSV() {
        const file = csvFileInput.files[0];
        if (!file) {
            showAlert(uploadStatusDiv, 'Nenhum arquivo selecionado', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/upload_csv', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert(uploadStatusDiv, 'Arquivo carregado com sucesso!', 'success');
                displayCSVPreview(data.preview);
            } else {
                showAlert(uploadStatusDiv, data.message || 'Erro ao carregar arquivo', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(uploadStatusDiv, 'Erro ao carregar arquivo', 'error');
        });
    }
    
    function displayCSVPreview(data) {
        if (!data || data.length === 0) {
            csvPreviewDiv.innerHTML = '<p>Nenhum dado para exibir</p>';
            return;
        }
        
        const headers = Object.keys(data[0]);
        let html = '<table class="table table-striped table-bordered"><thead><tr>';
        
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        data.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header]}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        csvPreviewDiv.innerHTML = html;
    }
    
    function updateFatorValue() {
        fatorValueSpan.textContent = fatorMultiplicacaoInput.value;
    }
    
    function gerarChamada() {
        const fatorMultiplicacao = parseFloat(fatorMultiplicacaoInput.value);
        
        fetch('/gerar_chamada', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fator_multiplicacao: fatorMultiplicacao })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                chamadaNum = data.chamada_num;
                gerarChamadaBtn.textContent = `Gerar ${chamadaNum + 1}ª chamada`;
                showAlert(chamadaStatusDiv, `${chamadaNum}ª chamada gerada com sucesso!`, 'success');
                
                displayEstatisticas(data);
                naoHomologadosSection.style.display = 'block';
                updateCPFsNaoHomologados(data.candidatos_chamados);
                
                downloadChamadaBtn.href = `/download_chamada?chamada_num=${chamadaNum}`;
                downloadChamadaBtn.style.display = 'inline-block';
            } else {
                showAlert(chamadaStatusDiv, data.message || 'Erro ao gerar chamada', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(chamadaStatusDiv, 'Erro ao gerar chamada', 'error');
        });
    }
    
    function displayEstatisticas(data) {
        estatisticasChamadaDiv.style.display = 'block';
        
        // Preencher tabela de saldo de vagas
        saldoVagasTbody.innerHTML = '';
        data.saldo_vagas.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.Cota}</td>
                <td>${item.Saldo}</td>
                <td>${item['Saldo Ajustado']}</td>
            `;
            saldoVagasTbody.appendChild(row);
        });
        
        // Preencher tabela de vagas selecionadas
        vagasSelecionadasTbody.innerHTML = '';
        data.vagas_info.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.Cota}</td>
                <td>${item['Vagas Selecionadas']}</td>
                <td>${item['Tamanho da Lista']}</td>
            `;
            vagasSelecionadasTbody.appendChild(row);
        });
        
        // Preencher tabela de candidatos chamados
        if (data.candidatos_chamados && data.candidatos_chamados.length > 0) {
            // Resetar filtros ao carregar novos dados
            document.getElementById('filter-cota').value = 'todas';
            currentFilter = 'todas';
            currentSort = { column: 'Nota Final', direction: 'desc' };
            
            displayCandidatosChamados(data.candidatos_chamados);
        }
    }
    
    function updateCPFsNaoHomologados(candidatos) {
        allCpfs = candidatos.map(c => c.CPF);
        renderSelectedTags();
    }
    
    function renderSelectedTags() {
        const container = document.getElementById('selected-cpfs');
        container.innerHTML = '';
        
        selectedCpfs.forEach(cpf => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `
                ${cpf}
                <span class="remove-tag" data-cpf="${cpf}">×</span>
            `;
            container.appendChild(tag);
        });
        
        document.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', function() {
                const cpfToRemove = this.getAttribute('data-cpf');
                selectedCpfs.delete(cpfToRemove);
                renderSelectedTags();
            });
        });
    }
    
    function setupCPFSearch() {
        const searchInput = document.getElementById('cpf-search');
        const resultsContainer = document.getElementById('cpf-results');
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            resultsContainer.innerHTML = '';
            
            if (searchTerm.length < 3) {
                resultsContainer.style.display = 'none';
                return;
            }
            
            const filtered = allCpfs.filter(cpf => 
                cpf.toLowerCase().includes(searchTerm) && !selectedCpfs.has(cpf)
            );
            
            if (filtered.length === 0) {
                resultsContainer.innerHTML = '<div class="result-item">Nenhum CPF encontrado</div>';
                resultsContainer.style.display = 'block';
                return;
            }
            
            filtered.forEach(cpf => {
                const item = document.createElement('div');
                item.className = 'result-item';
                item.textContent = cpf;
                item.addEventListener('click', function() {
                    selectedCpfs.add(cpf);
                    searchInput.value = '';
                    resultsContainer.style.display = 'none';
                    renderSelectedTags();
                });
                resultsContainer.appendChild(item);
            });
            
            resultsContainer.style.display = 'block';
        });
        
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.style.display = 'none';
            }
        });
        
        searchInput.addEventListener('focus', function() {
            if (this.value.length >= 3) {
                resultsContainer.style.display = 'block';
            }
        });
    }
    
    function marcarNaoHomologados() {
        if (selectedCpfs.size === 0) {
            showAlert(naoHomologadosStatusDiv, 'Selecione pelo menos um CPF', 'error');
            return;
        }
        
        fetch('/marcar_nao_homologados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nao_homologados_cpfs: Array.from(selectedCpfs) })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert(naoHomologadosStatusDiv, 'Candidatos marcados como não homologados!', 'success');
                displayNovasVagas(data);
                proximaChamadaNumSpan.textContent = data.proxima_chamada;
                
                // Atualiza a lista de CPFs
                selectedCpfs.clear();
                renderSelectedTags();
                document.getElementById('cpf-search').value = '';
                
                // Busca os candidatos atualizados do servidor
                fetchCandidatosAtualizados();
            } else {
                showAlert(naoHomologadosStatusDiv, data.message || 'Erro ao marcar candidatos', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(naoHomologadosStatusDiv, 'Erro ao marcar candidatos', 'error');
        });
    }

    function fetchCandidatosAtualizados() {
        fetch(`/get_candidatos_chamada?chamada_num=${chamadaNum}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayCandidatosChamados(data.candidatos_chamados);
                updateCPFsNaoHomologados(data.candidatos_chamados);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    function displayNovasVagas(data) {
        vagasDisponiveisDiv.style.display = 'block';
        vagasDisponiveisTbody.innerHTML = '';
        
        data.vagas_disponiveis.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.Cota}</td>
                <td>${item['Vagas Originais']}</td>
                <td>${item['Vagas Disponíveis']}</td>
            `;
            vagasDisponiveisTbody.appendChild(row);
        });
    }
    
    function downloadChamada(e) {
        e.preventDefault();
        window.location.href = e.target.href;
    }
    
    function showAlert(element, message, type) {
        element.style.display = 'block';
        element.textContent = message;
        element.className = 'alert';
        
        if (type === 'success') {
            element.classList.add('alert-success');
        } else if (type === 'error') {
            element.classList.add('alert-error');
        } else {
            element.classList.add('alert-info');
        }
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
});