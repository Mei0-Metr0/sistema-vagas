from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import io

app = Flask(__name__)

def ordenar_por_nota_final(df):
    '''
    Função para ordenar o DataFrame pela coluna "Nota final" de forma decrescente

    Args:
        df - DataFrame a ser ordenado
    Returns:
        df_ordenado - DataFrame ordenado
    '''
    df_ordenado = df.sort_values(by='Nota Final', ascending=False)
    return df_ordenado.reset_index(drop=True) # Deixa os índices sequencias mesmo após a ordenação.

def passo(df_ordenado, passo, vo, ch):
    '''
    Args:
        df_ordenado - DataFrame ordenado
        passo - número do passo
        vo - vagas ofertadas
        ch - chamada

    Returns:
        vs - vagas selecionadas
        tl - tamanho da lista
        sc - saldo de candidatos
        df_ordenado - DataFrame atualizado
    '''
    # Cria as colunas 'vagaSelecionada', 'vagaGarantida' e 'ch' se não existirem
    if 'vagaSelecionada' not in df_ordenado.columns:
        df_ordenado['vagaSelecionada'] = ""
    if 'vagaGarantida' not in df_ordenado.columns:
        df_ordenado['vagaGarantida'] = ""
    if 'ch' not in df_ordenado.columns:
        df_ordenado['ch'] = 0
    
    # Define a condição para selecionar os candidatos de acordo com os 10 passos e atualiza as colunas 'vagaSelecionada' e 'ch' de acordo com a cota especificada pelo passo
    if passo == 1:
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0)
        cotaSelecionada = "AC"
    elif passo == 2:
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0) & (df_ordenado['Cota do candidato'] != 'AC')
        cotaSelecionada = "LI_EP"
    elif passo == 3:
        cotaSelecionada = "LI_PCD"
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0) & ((df_ordenado['Cota do candidato'] == 'LI_PCD') | (df_ordenado['Cota do candidato'] == 'LB_PCD'))
    elif passo == 4:
        cotaSelecionada = "LI_Q"
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0) & ((df_ordenado['Cota do candidato'] == 'LI_Q') | (df_ordenado['Cota do candidato'] == 'LB_Q'))
    elif passo == 5:
        cotaSelecionada = "LI_PPI"
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0) & ((df_ordenado['Cota do candidato'] == 'LI_PPI') | (df_ordenado['Cota do candidato'] == 'LB_PPI'))
    elif passo == 6:
        cotaSelecionada = "LB_EP"
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0) & ((df_ordenado['Cota do candidato'] == 'LB_EP') | (df_ordenado['Cota do candidato'] == 'LB_PCD') | (df_ordenado['Cota do candidato'] == 'LB_Q') | (df_ordenado['Cota do candidato'] == 'LB_PPI'))
    elif passo == 7:
        cotaSelecionada = "LB_PCD" # [VERIFICAR] Acredito que esteja errado
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0) & ((df_ordenado['Cota do candidato'] == 'LB_PCD') | (df_ordenado['Cota do candidato'] == 'LI_PCD'))
    elif passo == 8:
        cotaSelecionada = "LB_Q"
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0) & ((df_ordenado['Cota do candidato'] == 'LB_Q'))
    elif passo == 9:
        cotaSelecionada = "LB_PPI"
        condicao = (df_ordenado['ch'] == 0) & (df_ordenado['vagaSelecionada'].str.len() == 0) & (df_ordenado['vagaGarantida'].str.len() == 0) & ((df_ordenado['Cota do candidato'] == 'LB_PPI'))

    indices_preencher = df_ordenado[condicao].head(vo).index # Filtra os índices que atendem a condição e seleciona os primeiros 'vo' candidatos
    tl = len(condicao[condicao == True]) # Contagem do total de candidatos que atendem a condição
    
    df_ordenado.loc[indices_preencher, 'vagaSelecionada'] = cotaSelecionada # Atualiza a coluna 'vagaSelecionada' com a cota selecionada
    df_ordenado.loc[indices_preencher, 'ch'] = ch # Atualiza a coluna 'ch' com o número da chamada
    
    vs = len(indices_preencher) # Contagem do total de candidatos que foram selecionados (pode ser menor que vo se não houver candidatos suficientes).
    sc = len(condicao[condicao == True]) - vo # Contagem do saldo de candidatos que não foram selecionados (Se positivo: há mais candidatos que vagas. Se negativo: há mais vagas que candidatos).
    
    return vs, tl, sc, df_ordenado

def ajustar_saldo_vagas(saldo_vagas):
    '''
    Função para ajustar o saldo de vagas, garantindo que não haja saldo negativo
    Zera os saldos negativos após a redistribuição
    Mantem os saldos positivos intactos quando não há déficits para compensar
    Args:
        saldo_vagas - lista com o saldo de vagas
    Returns:
        saldo_vagas_novo - lista com o saldo de vagas ajustado
    '''

    saldo_vagas_novo = saldo_vagas.copy()
    for i in range(len(saldo_vagas_novo) - 2, -1, -1): 
        if saldo_vagas_novo[i+1] < 0: # Se uma cota tem saldo negativo, transfere esse déficit para a cota anterior
            saldo_vagas_novo[i] += saldo_vagas_novo[i+1] 
            saldo_vagas_novo[i+1] = 0
    return saldo_vagas_novo

INDICE_PARA_COTA = {
    0: "AC",
    1: "LI_EP",
    2: "LI_PCD",
    3: "LI_Q",
    4: "LI_PPI",
    5: "LB_EP",
    6: "LB_PCD",
    7: "LB_Q",
    8: "LB_PPI"
}

def gerar_chamada(df, vagas, chamada_num=1, fator_multiplicacao=1):
    '''
    Função para gerar a chamada de candidatos com base nas vagas disponíveis e no DataFrame de candidatos.
    Args:
        df - DataFrame com os dados dos candidatos
        vagas - dicionário com as vagas disponíveis para cada cota
        chamada_num - número da chamada (default: 1)
        fator_multiplicacao - fator de multiplicação para ajustar as vagas (default: 1)
    Returns:
        df_processado - DataFrame atualizado com as vagas selecionadas
        estatisticas - dicionário com as estatísticas da chamada
    '''

    df_processado = df.copy()
    
    if 'vagaSelecionada' not in df_processado.columns:
        df_processado['vagaSelecionada'] = ""
    if 'vagaGarantida' not in df_processado.columns:
        df_processado['vagaGarantida'] = ""
    if 'ch' not in df_processado.columns:
        df_processado['ch'] = 0
    
    # Processamento por Tipo de Cota
    
    # Ordena por nota
    df_ordenado = ordenar_por_nota_final(df_processado)

    # Ajusta vagas pelo fator de multiplicação
    vagas_ajustadas = {k: int(v * fator_multiplicacao) for k, v in vagas.items()}
    
    # Executa o processo para cada tipo de cota (9 passos)
    saldo_vagas = [0] * 9            # Diferença entre candidatos elegíveis e vagas ofertadas, se positivo indica que há mais candidatos que vagas, se negativo indica que faltam candidatos para preencher todas as vagas
    tamalho_lista = [0] * 9          # Total de candidatos elegíveis para cada cota, útil para entender a demanda por cada tipo de cota
    vagas_selecionadas = [0] * 9     # Contabiliza quantas vagas foram efetivamente preenchidas em cada cota
    
    vagas_selecionadas[0], tamalho_lista[0], saldo_vagas[0], df_ordenado = passo(df_ordenado, 1, vagas_ajustadas["AC"], chamada_num)
    vagas_selecionadas[1], tamalho_lista[1], saldo_vagas[1], df_ordenado = passo(df_ordenado, 2, vagas_ajustadas["LI_EP"], chamada_num)
    vagas_selecionadas[2], tamalho_lista[2], saldo_vagas[2], df_ordenado = passo(df_ordenado, 3, vagas_ajustadas["LI_PCD"], chamada_num)
    vagas_selecionadas[3], tamalho_lista[3], saldo_vagas[3], df_ordenado = passo(df_ordenado, 4, vagas_ajustadas["LI_Q"], chamada_num)
    vagas_selecionadas[4], tamalho_lista[4], saldo_vagas[4], df_ordenado = passo(df_ordenado, 5, vagas_ajustadas["LI_PPI"], chamada_num)
    vagas_selecionadas[5], tamalho_lista[5], saldo_vagas[5], df_ordenado = passo(df_ordenado, 6, vagas_ajustadas["LB_EP"], chamada_num)
    vagas_selecionadas[6], tamalho_lista[6], saldo_vagas[6], df_ordenado = passo(df_ordenado, 7, vagas_ajustadas["LB_PCD"], chamada_num)
    vagas_selecionadas[7], tamalho_lista[7], saldo_vagas[7], df_ordenado = passo(df_ordenado, 8, vagas_ajustadas["LB_Q"], chamada_num)
    vagas_selecionadas[8], tamalho_lista[8], saldo_vagas[8], df_ordenado = passo(df_ordenado, 9, vagas_ajustadas["LB_PPI"], chamada_num)
    
    # Ajuste de saldos
    # Redistribui os saldos negativos (quando faltam candidatos) para outras cotas
    saldo_vagas_novo = ajustar_saldo_vagas(saldo_vagas)
    
    # Preenchimento de Vagas Remanescentes
    for i in range(len(saldo_vagas)):
        difference = saldo_vagas[i] - saldo_vagas_novo[i] # Quando positiva, indica que vagas foram realocadas para essa cota
        if difference > 0:
            _, _, _, df_ordenado = passo(df_ordenado, i+1, difference, chamada_num)
    
    return df_ordenado, {
        'saldo_vagas': saldo_vagas,
        'saldo_vagas_ajustado': saldo_vagas_novo,
        'vagas_selecionadas': vagas_selecionadas,
        'tamanho_lista': tamalho_lista
    }

def marcar_nao_homologados(df, nao_homologados_cpfs):
    '''
    Função para marcar candidatos não homologados no DataFrame.

    Args:
        df - DataFrame com os dados dos candidatos
        nao_homologados_cpfs - lista de CPFs dos candidatos não homologados
    Returns:
        df_atualizado - DataFrame atualizado com os candidatos não homologados marcados
    '''
    df_atualizado = df.copy()
    
    if 'vagaSelecionada' not in df_atualizado.columns:
        df_atualizado['vagaSelecionada'] = ""
    if 'vagaGarantida' not in df_atualizado.columns:
        df_atualizado['vagaGarantida'] = ""
    if 'ch' not in df_atualizado.columns:
        df_atualizado['ch'] = 0
    
    for cpf in nao_homologados_cpfs:
        idx = df_atualizado[df_atualizado['CPF'] == cpf].index
        if len(idx) > 0:
            df_atualizado.loc[idx, 'vagaSelecionada'] = ""
            df_atualizado.loc[idx, 'vagaGarantida'] = "Não homologado"
            df_atualizado.loc[idx, 'ch'] = 0
    
    return df_atualizado

def calcular_novas_vagas(df, vagas_originais):
    '''
    Função para calcular o número de vagas disponíveis após a chamada.

    Args:
        df - DataFrame com os dados dos candidatos
        vagas_originais - dicionário com as vagas originais para cada cota
    Returns:
        vagas_disponiveis - dicionário com o número de vagas disponíveis para cada cota
    '''
    if 'vagaSelecionada' not in df.columns:
        df['vagaSelecionada'] = ""
    if 'vagaGarantida' not in df.columns:
        df['vagaGarantida'] = ""
    
    vagas_ocupadas = {
        "AC": 0, "LI_EP": 0, "LI_PCD": 0, "LI_Q": 0, "LI_PPI": 0,
        "LB_EP": 0, "LB_PCD": 0, "LB_Q": 0, "LB_PPI": 0
    }
    
    for cota in vagas_ocupadas.keys():
        vagas_ocupadas[cota] = len(df[(df['vagaSelecionada'] == cota) & (df['vagaGarantida'] != "Não homologado")])
    
    vagas_disponiveis = {
        cota: vagas_originais[cota] - vagas_ocupadas[cota] for cota in vagas_originais.keys()
    }
    
    return vagas_disponiveis

app.df = None
app.vagas = {
    "AC": 0, "LI_EP": 0, "LI_PCD": 0, "LI_Q": 0, "LI_PPI": 0,
    "LB_EP": 0, "LB_PCD": 0, "LB_Q": 0, "LB_PPI": 0
}
app.chamada_num = 1
app.vagas_originais = None
app.estatisticas = None

# Rotas
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/confirmar_vagas', methods=['POST'])
def confirmar_vagas():
    data = request.get_json()
    for cota, quantidade in data.items():
        app.vagas[cota] = int(quantidade)
    app.vagas_originais = app.vagas.copy()
    return jsonify({"status": "success", "total_vagas": sum(app.vagas.values())})

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "Nenhum arquivo enviado"})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "Nenhum arquivo selecionado"})
    
    try:
        df = pd.read_csv(file)
        required_columns = ['CPF', 'Nota Final', 'Cota do candidato']
        if all(col in df.columns for col in required_columns):
            if 'vagaSelecionada' not in df.columns:
                df['vagaSelecionada'] = ""
            if 'vagaGarantida' not in df.columns:
                df['vagaGarantida'] = ""
            if 'ch' not in df.columns:
                df['ch'] = 0
            
            app.df = df
            return jsonify({
                "status": "success",
                "preview": df.head(10).to_dict('records')
            })
        else:
            missing_cols = [col for col in required_columns if col not in df.columns]
            return jsonify({"status": "error", "message": f"Colunas necessárias faltando: {', '.join(missing_cols)}"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Erro ao processar arquivo: {str(e)}"})

@app.route('/gerar_chamada', methods=['POST'])
def gerar_chamada_route():
    if app.df is None or app.vagas_originais is None:
        return jsonify({"status": "error", "message": "Dados ou vagas não configurados"})
    
    data = request.get_json()
    fator_multiplicacao = float(data.get('fator_multiplicacao', 1.0))
    
    df_atualizado, estatisticas = gerar_chamada(
        app.df,
        app.vagas,
        app.chamada_num,
        fator_multiplicacao
    )
    
    app.df = df_atualizado
    app.estatisticas = estatisticas
    
    candidatos_chamados = app.df[app.df['ch'] == app.chamada_num].to_dict('records')
    
    saldo_df = [{
        'Cota': INDICE_PARA_COTA[i],
        'Saldo': estatisticas['saldo_vagas'][i],
        'Saldo Ajustado': estatisticas['saldo_vagas_ajustado'][i]  
    } for i in range(9)]

    vagas_df = [{
        'Cota': INDICE_PARA_COTA[i],
        'Vagas Selecionadas': estatisticas['vagas_selecionadas'][i],  
        'Tamanho da Lista': estatisticas['tamanho_lista'][i] 
    } for i in range(9)]
    
    return jsonify({
        "status": "success",
        "chamada_num": app.chamada_num,
        "candidatos_chamados": candidatos_chamados,
        "saldo_vagas": saldo_df,
        "vagas_info": vagas_df
    })

@app.route('/marcar_nao_homologados', methods=['POST'])
def marcar_nao_homologados_route():
    if app.df is None or app.chamada_num == 0:
        return jsonify({"status": "error", "message": "Nenhuma chamada gerada"})
    
    data = request.get_json()
    nao_homologados_cpfs = data.get('nao_homologados_cpfs', [])
    
    df_atualizado = marcar_nao_homologados(app.df, nao_homologados_cpfs)
    app.df = df_atualizado
    
    vagas_disponiveis = calcular_novas_vagas(app.df, app.vagas_originais)
    app.vagas = vagas_disponiveis
    
    vagas_info = [{
        'Cota': cota,
        'Vagas Originais': app.vagas_originais[cota],
        'Vagas Disponíveis': vagas_disponiveis[cota]
    } for cota in vagas_disponiveis.keys()]
    
    app.chamada_num += 1
    
    return jsonify({
        "status": "success",
        "vagas_disponiveis": vagas_info,
        "proxima_chamada": app.chamada_num
    })

@app.route('/download_chamada', methods=['GET'])
def download_chamada():
    if app.df is None:
        return jsonify({"status": "error", "message": "Nenhum dado carregado"})
    
    chamada_num = request.args.get('chamada_num', type=int, default=1)  
    
    if 'ch' not in app.df.columns or app.df['ch'].max() < chamada_num:
        return jsonify({"status": "error", "message": "Chamada não encontrada"})
    
    candidatos_chamados = app.df[app.df['ch'] == chamada_num]
    
    output = io.StringIO()
    candidatos_chamados.to_csv(output, index=False)
    output.seek(0)
    
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'chamada_{chamada_num}.csv'
    )

@app.route('/get_candidatos_chamada', methods=['GET'])
def get_candidatos_chamada():
    chamada_num = request.args.get('chamada_num', type=int)
    
    if app.df is None or 'ch' not in app.df.columns:
        return jsonify({"status": "error", "message": "Nenhuma chamada gerada"})
    
    candidatos = app.df[app.df['ch'] == chamada_num].to_dict('records')
    
    return jsonify({
        "status": "success",
        "candidatos_chamados": candidatos
    })

if __name__ == '__main__':
    app.run(debug=True)