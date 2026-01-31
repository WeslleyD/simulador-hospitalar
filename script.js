// Carrega dados salvos ou inicia vazio
let baseDeDados = JSON.parse(localStorage.getItem('hospitalData')) || [];
let semanaAtualView = 0;

function salvarLocal() {
    localStorage.setItem('hospitalData', JSON.stringify(baseDeDados));
}

function adicionarEntrada() {
    const semana = parseInt(document.getElementById('select-semana').value);
    const dia = parseInt(document.getElementById('select-dia').value);
    const classe = document.getElementById('select-classe').value;
    const qtd = parseInt(document.getElementById('input-qtd').value);
    const duracao = parseInt(document.getElementById('select-duracao').value);

    if (!qtd || qtd <= 0) return;

    let diaEntradaAbsoluto = (semana * 7) + dia;
    let diaAltaAbsoluto = (dia === 0 && duracao === 7) ? (semana * 7) + 4 : diaEntradaAbsoluto + duracao;

    baseDeDados.push({
        id: Date.now(),
        inicio: diaEntradaAbsoluto,
        fim: diaAltaAbsoluto,
        classe, qtd, semana, diaOriginal: dia
    });

    salvarLocal();
    calcularSimulacao();
}

function excluirRegistro(id) {
    baseDeDados = baseDeDados.filter(item => item.id !== id);
    salvarLocal();
    calcularSimulacao();
}

function mudarSemana(s) {
    semanaAtualView = s;
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach((b, idx) => b.classList.toggle('active', idx === s));
    document.getElementById('titulo-semana').innerText = s < 4 ? `Mês Atual - S${s+1}` : `Mês Seg. - S${s-3}`;
    calcularSimulacao();
}

function limparTudo() {
    if(confirm("Apagar todos os dados permanentemente?")) {
        baseDeDados = [];
        localStorage.removeItem('hospitalData');
        calcularSimulacao();
    }
}

function calcularSimulacao() {
    const nomesDias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    const nomesSemanas = ["S1", "S2", "S3", "S4", "MS1", "MS2"];
    const tbody = document.getElementById('table-body');
    const listaHtml = document.getElementById('lista-registros');
    
    tbody.innerHTML = "";
    listaHtml.innerHTML = "";

    baseDeDados.forEach(reg => {
        listaHtml.innerHTML += `
            <div class="item-reg">
                ${nomesSemanas[reg.semana]}: ${reg.classe} (${reg.qtd}) 
                <button class="btn-del" onclick="excluirRegistro(${reg.id})">✕</button>
            </div>`;
    });

    let censoTotal = Array(42).fill(0);
    let detalheTotal = Array.from({ length: 42 }, () => ({ entradas: 0, altas: 0, classes: {} }));

    baseDeDados.forEach(reg => {
        if (reg.inicio < 42) detalheTotal[reg.inicio].entradas += reg.qtd;
        if (reg.fim < 42) detalheTotal[reg.fim].altas += reg.qtd;
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
        const isMeta = censo >= 34 && censo <= 40;
        let tags = Object.entries(info.classes).map(([n, q]) => `<span class="tag">${n}:${q}</span>`).join("");

        tbody.innerHTML += `
            <tr>
                <td><strong>${nomesDias[diaRel]}</strong></td>
                <td>${info.entradas}</td>
                <td>${info.altas}</td>
                <td style="font-weight:bold; color:${isMeta ? '#16a34a' : '#dc2626'}">${censo}</td>
                <td>${tags || "---"}</td>
            </tr>`;
    }

    let diasComDados = censoTotal.filter(v => v > 0).length || 1;
    let media = (censoTotal.reduce((a, b) => a + b, 0) / diasComDados).toFixed(1);
    document.getElementById('media-geral').innerText = media;

    const card = document.getElementById('card-status');
    const status = document.getElementById('status-meta');
    if (media >= 34 && media <= 40) { card.className = "card status-ok"; status.innerText = "META OK"; }
    else if (media > 0) { card.className = "card status-alert"; status.innerText = "FORA DA META"; }
    else { card.className = "card status-neutral"; status.innerText = "VAZIO"; }
}

// Inicia o cálculo ao abrir a página
calcularSimulacao();