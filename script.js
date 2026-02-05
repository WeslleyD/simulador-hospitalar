let baseDeDados = JSON.parse(localStorage.getItem('censoDataV2')) || [];
let semanaAtualView = 0;

function salvarEAtualizar() {
    localStorage.setItem('censoDataV2', JSON.stringify(baseDeDados));
    calcularSimulacao();
}

function adicionarEntrada() {
    const semana = parseInt(document.getElementById('select-semana').value);
    const dia = parseInt(document.getElementById('select-dia').value);
    const classe = document.getElementById('select-classe').value;
    const qtd = parseInt(document.getElementById('input-qtd').value);
    const duracao = parseInt(document.getElementById('select-duracao').value);

    if (!qtd || qtd <= 0) return;

    let diaEntradaAbs = (semana * 7) + dia;
    let diaAltaAbs;

    // REGRA DE ALTA ESTRATÉGICA
    if (dia === 0) { // Entrada na Segunda
        if (duracao === 7) {
            // Regra 1: Internou Segunda (1 sem) -> Alta na Sexta da mesma semana
            diaAltaAbs = (semana * 7) + 4; 
        } else if (duracao === 14) {
            // Regra 2: Internou Segunda (2 sem) -> Alta na Sexta da semana seguinte
            diaAltaAbs = (semana * 7) + 11; 
        } else {
            diaAltaAbs = diaEntradaAbs + duracao;
        }
    } else {
        // Regra Padrão para outros dias
        diaAltaAbs = diaEntradaAbs + duracao;
    }

    baseDeDados.push({
        id: Date.now(),
        inicio: diaEntradaAbs,
        fim: diaAltaAbs,
        classe, qtd, semana, diaOriginal: dia, duracaoOriginal: duracao
    });

    salvarEAtualizar();
}

function excluirRegistro(id) {
    baseDeDados = baseDeDados.filter(i => i.id !== id);
    salvarEAtualizar();
}

function mudarSemana(s) {
    semanaAtualView = s;
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach((b, idx) => b.classList.toggle('active', idx === s));
    document.getElementById('titulo-semana').innerText = s < 4 ? `Mês Atual - S${s+1}` : `Mês Seg. - S${s-3}`;
    calcularSimulacao();
}

function limparTudo() {
    if(confirm("Deseja apagar todos os dados permanentemente?")) {
        baseDeDados = [];
        localStorage.removeItem('censoDataV2');
        calcularSimulacao();
    }
}

function calcularSimulacao() {
    const nomesDias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    const nomesSem = ["S1", "S2", "S3", "S4", "MS1", "MS2"];
    const tbody = document.getElementById('table-body');
    const listaReg = document.getElementById('lista-registros');
    
    tbody.innerHTML = "";
    listaReg.innerHTML = "";

    baseDeDados.forEach(reg => {
        listaReg.innerHTML += `
            <div class="item-reg">
                ${nomesSem[reg.semana]}: ${reg.classe} (${reg.qtd}) 
                <button class="btn-del" onclick="excluirRegistro(${reg.id})">✕</button>
            </div>`;
    });

    let censoTotal = Array(42).fill(0);
    let detalheTotal = Array.from({ length: 42 }, () => ({ entradas: 0, altas: 0, classes: {} }));

    baseDeDados.forEach(reg => {
        if (reg.inicio < 42) detalheTotal[reg.inicio].entradas += reg.qtd;
        if (reg.fim < 42) detalheTotal[reg.fim].altas += reg.qtd;
        
        // Censo conta do dia de entrada até o dia anterior à alta
        for (let i = reg.inicio; i < reg.fim && i < 42; i++) {
            censoTotal[i] += reg.qtd;
            detalheTotal[i].classes[reg.classe] = (detalheTotal[i].classes[reg.classe] || 0) + reg.qtd;
        }
    });

    let inicio = semanaAtualView * 7;
    for (let d = inicio; d < inicio + 7; d++) {
        let diaRel = d % 7;
        let censo = censoTotal[d];
        let info = detalheTotal[d];
        const meta = censo >= 34 && censo <= 40;
        let tags = Object.entries(info.classes).map(([n, q]) => `<span class="tag">${n}:${q}</span>`).join("");

        tbody.innerHTML += `
            <tr>
                <td><strong>${nomesDias[diaRel]}</strong></td>
                <td>${info.entradas}</td>
                <td>${info.altas}</td>
                <td style="font-weight:800; color:${meta ? '#16a34a' : '#dc2626'}">${censo}</td>
                <td>${tags || "---"}</td>
            </tr>`;
    }

    let ocupMes = censoTotal.slice(0, 28);
    let media = (ocupMes.reduce((a, b) => a + b, 0) / 28).toFixed(1);
    document.getElementById('media-geral').innerText = media;

    const card = document.getElementById('card-status');
    const status = document.getElementById('status-meta');
    if (media >= 34 && media <= 40) { card.className = "card status-ok"; status.innerText = "META OK"; }
    else if (media > 0) { card.className = "card status-alert"; status.innerText = "FORA DA META"; }
    else { card.className = "card status-neutral"; status.innerText = "SEM DADOS"; }
}

calcularSimulacao();
