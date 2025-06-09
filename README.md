# Sistema de Distribuição de Vagas (Lei 14.723/2023)

<div align="center" style="display: display_block">

![image_info](https://img.shields.io/badge/Licença-Mozilla_Public_License_2.0-red)
![image_info](https://img.shields.io/badge/Backend-Python-yellow)
![image_info](https://img.shields.io/badge/Frontend-React,_Vite-blue)

</div>

<div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" width="100" height="100" />
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/fastapi/fastapi-original.svg" width="100" height="100"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" width="100" height="100" />
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vite/vite-original.svg" width="100" height="100"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redux/redux-original.svg" width="100" height="100"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bootstrap/bootstrap-original.svg" width="100" height="100"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-plain-wordmark.svg" width="100" height="100"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" width="100" height="100"/>
</div>

## Autores

<div align="center">
    <table>
    <tr>
        <td align="center">
        <a href="https://github.com/Mei0-Metr0">
            <img src="https://avatars.githubusercontent.com/u/163468366?v=4" width="100px;" alt="Mei0-Metr0"/><br>
            <sub>
            <b>Joice Kelly Oliveira Mendes - Mei0-Metr0</b>
            </sub>
        </a>
        </td>
        <td align="center">
        <a href="https://github.com/alerario">
            <img src="https://avatars.githubusercontent.com/u/4432271?v=4" width="100px;" alt="LCostaF"/><br>
            <sub>
            <b>Alexandre L'Erario - Orientador</b>
            </sub>
        </a>
        </td>
    </tr>
    </table>
</div>

<div align="center">

**Universidade Tecnológica Federal do Paraná - UTFPR**

</div>

## Sobre

Este é um sistema para auxiliar na distribuição de vagas e geração de chamadas em processos seletivos universitários, com foco no cumprimento da Lei 14.723/2023 (nova Lei de Cotas). 

A aplicação consiste em um backend FastAPI (Python) e um frontend React (Vite) JS.

## Funcionalidades Principais

* **Upload de Candidatos:** 
    * Carregamento de uma lista de candidatos a partir de um arquivo CSV.
    * Seleção de Delimitador: Permite escolher o separador do arquivo (ponto e vírgula, vírgula) diretamente na interface.
    * Os nomes das colunas no CSV são processados sem distinção entre maiúsculas e minúsculas (case-insensitive) e com remoção de espaços extras em branco após e antes dos campos.
* **Filtro de Candidatos:**
    * Após o upload, o sistema realiza uma filtragem da lista de candidatos.
    * O usuário deve selecionar em cascata: `Campus` -> `Curso` -> `Turno`. As opções são carregadas dinamicamente.
    * Todo o processo subsequente (distribuição de vagas, chamadas) é realizado apenas com o conjunto de candidatos que corresponde ao filtro aplicado.
* **Definição de Vagas:** 
    * Permite definir a quantidade de vagas disponíveis para cada tipo de cota.
    * Entrada Rápida: Além dos campos individuais, oferece um campo de "Colagem Rápida" onde o usuário pode colar uma linha de números que preenche todos os campos de vagas automaticamente, seguindo uma ordem pré-definida.
* **Geração de Chamadas:**
    * Gera chamadas com base nas vagas definidas e na lista de candidatos já filtrada.
    * Aplica um fator de multiplicação opcional para convocar mais candidatos que o número de vagas.
    * Segue uma lógica de 9 passos para preenchimento de cotas, começando por Ampla Concorrência (AC) e seguindo para as demais cotas (LI\_EP, LI\_PCD, etc.).
    * Exibe estatísticas da chamada gerada e uma tabela com os candidatos convocados, que possui filtros por "Cota do Candidato" e "Vaga Selecionada" para análise.
    * Permite o download da lista de candidatos da chamada gerada em formato CSV.
* **Gestão de Não Homologados:**
    * Permite marcar candidatos da última chamada como "não homologados".
    * Recalcula as vagas disponíveis para a próxima chamada, considerando as vagas liberadas.
* **Reset do Sistema:** Funcionalidade para limpar todos os dados carregados (candidatos, vagas, filtros, chamadas) e retornar o sistema ao estado inicial.

## Pré-requisitos

### Backend:
* Python 3.10
* pip

### Frontend:
* Node.js
* npm ou yarn

## Configuração e Execução

### 1. Backend (FastAPI)

1.  **Clone o repositório (se aplicável):**
    ```bash
    # git clone <url-do-repositorio>
    # cd sistema-vagas/backend
    ```

2.  **Crie e ative um ambiente virtual (recomendado):**
    ```bash
    # Criar o ambiente
    # No Windows 
    # python -m venv venv
    # No Linux 
    # python3 -m venv venv

    # Ativar o ambiente
    # No Windows:
    # venv\Scripts\activate
    # No Linux:
    # source venv/bin/activate
    ```

3.  **Instale as dependências:**
    Navegue até a pasta `backend/` (onde contém `requirements.txt`) e execute:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Execute o servidor de desenvolvimento:**
    A partir da pasta `backend/app` (onde o `main.py` está localizado), execute:
    ```bash
    uvicorn main:app --reload
    ```
    O backend estará acessível em `http://localhost:8000`. A documentação da API (Swagger UI) estará em `http://localhost:8000/docs`.

### 2. Frontend (React + Vite)

1.  **Navegue até a pasta do frontend:**
    ```bash
    # cd sistema-vagas/frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    # yarn install
    ```

3.  **Variáveis de Ambiente: (Opcional)**
    Crie um arquivo `.env` na raiz da pasta `frontend` contendo a variável do arquivo .env.example que atualmente contém apenas a URL do servidor backend local.
    ```env
    # frontend/.env
    API_URL=
    ```

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    # ou
    # yarn dev
    ```
    O frontend estará acessível geralmente em `http://localhost:5173` (o Vite informará a porta no console).

## Como Usar a Aplicação

Após iniciar o backend e o frontend:

1.  **Adicionar Logo (Opcional):**
    * Coloque sua imagem de logo (ex: `logo-utfpr.png`) na pasta `frontend/public/`.
    * O `App.jsx` está configurado para buscar `/logo.png` (ajuste o nome/extensão se necessário).

2.  **Fluxo Principal:**
    * **Página Inicial:** Você verá o título "Sistema de Distribuição de Vagas" com a logo (se adicionada) e um botão "Resetar Sistema".
    * **Etapa 1: Upload do CSV de Candidatos**
        * Clique na área designada ou arraste e solte um arquivo CSV contendo os dados dos candidatos.
        * Colunas esperadas no CSV: `CPF`, `Nota Final`, `Cota do candidato`. Opcionalmente: `Nome`, `Email`. Os nomes das colunas não diferenciam maiúsculas de minúsculas.
        * Antes de enviar, selecione o separador correto do seu arquivo (ex: `;` ou `,`) no menu ao lado do campo de upload.
        * Após selecionar, uma pré-visualização será exibida.
        * Clique em "Enviar arquivo". Uma mensagem de sucesso com o número de registros processados será exibida. Após o sucesso, a próxima etapa será exibida.
    * **Etapa 2: Filtrar Candidatos**
        * Esta etapa é obrigatória e aparecerá após o upload.
        * Selecione em ordem:
            1. O Campus.
            2. O Curso (as opções serão carregadas com base no campus escolhido).
            3. O Turno (as opções serão carregadas com base no curso escolhido).
        * Clique em "Aplicar Filtro e Continuar". O sistema agora trabalhará exclusivamente com os candidatos que correspondem a essa seleção.
    * **Etapa 3: Informar a Distribuição das Cotas**
        * Preencha a quantidade de vagas para cada uma das 9 categorias de cota (AC, LI\_EP, etc.).
            - Opção A (Colagem Rápida): Cole uma string de 9 números separados por espaço no campo "Colagem Rápida". Os campos individuais serão preenchidos automaticamente na seguinte ordem: AC, LI_EP, LI_PCD, LI_Q, LI_PPI, LB_EP, LB_PCD, LB_Q, LB_PPI.
            - Opção B (Manual): Preencha a quantidade de vagas para cada uma das 9 categorias de cota individualmente.
        * O total de vagas será calculado automaticamente.
        * Clique em "Confirmar distribuição".
    * **Etapa 3: Gerar Chamada**
        * Ajuste o "Fator de multiplicação" (número inteiro: 1, 2, 3...) se desejar convocar mais candidatos do que o número de vagas. (ex: 1.0 para chamar exatamente o número de vagas, 1.2 para chamar 20% a mais).
        * Clique no botão "Gerar Xª chamada".
        * A aplicação exibirá:
            * **Estatísticas da chamada:**
                * "Saldo de vagas por cota": Mostra o saldo de candidatos versus oferta para a chamada atual e um saldo ajustado (considerando a lógica de remanejamento de déficit entre cotas implementada).
                * "Vagas selecionadas e tamanho das listas": Quantas vagas foram preenchidas por cota e o tamanho da lista de elegíveis para cada cota.
            * **Tabela de Candidatos Chamados:** Lista os candidatos selecionados na chamada atual, com filtros por cota do candidato e vaga selecionada.
            * **Botão de Download:** Permite baixar um CSV da chamada gerada.
    * **Etapa 4: Informar Candidatos Não Homologados**
        * Esta seção se torna visível após gerar uma chamada.
        * Busque e selecione os CPFs dos candidatos da chamada atual que **não foram homologados**.
        * Clique em "Marcar candidatos não homologados".
        * Se não houver candidatos não homologados, clique em "Não há candidatos para homologação".
        * Após o processamento, a tabela "Novas vagas disponíveis" será exibida:
            * **Vagas Ofertadas (Última Chamada):** Mostra o número de vagas que foram efetivamente ofertadas para cada cota na chamada que acabou de ser processada.
            * **Vagas Disponíveis (Próxima Chamada):** Mostra o saldo atualizado de vagas para a próxima chamada, já considerando as vagas liberadas pelos não homologados.
        * O sistema indicará que está pronto para a próxima chamada. Você pode então voltar à Etapa 3 para gerar a próxima chamada.
    * **Resetar Sistema:**
        * A qualquer momento, o botão "Resetar Sistema" no cabeçalho pode ser usado.
        * Ele pedirá confirmação e, se confirmado, limpará todos os dados do backend (candidatos, vagas, chamadas) e resetará o estado do frontend, recarregando a página.

## Licença
Este projeto está licenciado sob os termos da [Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/).