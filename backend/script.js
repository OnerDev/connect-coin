const URL_API = "https://script.google.com/macros/s/AKfycbwtFIhdPC_BQxtfCbG_iGOXGJtvZ4f6XdS0FqsrbKYzCnTlW4_FWtFzW2MoB-BpHIzH/exec";
let listaUsuarios = [];

/* ================== INIT ================== */
window.onload = async () => {
    try {
        const res = await fetch(URL_API);
        const dados = await res.json();

        if (dados.config) {
            document.getElementById('txt-temporada').innerText = `"${dados.config.tema}"`;
            document.documentElement.style.setProperty('--primary', dados.config.cor);
            document.documentElement.style.setProperty('--bg-page', dados.config.cor);
        }
    } catch (e) {
        document.getElementById('txt-temporada').innerText = "Erro ao carregar tema";
    }
};

/* ================== AUTH ================== */
function logout() {
    location.reload();
}

function mostrarCadastro() {
    document.getElementById('tela-login').classList.add('hidden');
    document.getElementById('tela-auto-cadastro').classList.remove('hidden');
}

function mostrarLogin() {
    document.getElementById('tela-auto-cadastro').classList.add('hidden');
    document.getElementById('tela-login').classList.remove('hidden');
}

/* ================== LOGIN ================== */
async function executarLogin() {
    const btn = document.querySelector('.btn-login');
    btn.innerText = "Entrando...";

    try {
        const res = await fetch(URL_API);
        const dados = await res.json();
        listaUsuarios = dados.usuarios;

        const email = document.getElementById('email').value.trim().toLowerCase();
        const senha = document.getElementById('senha').value;

        const user = listaUsuarios.find(
            u => u.email.toLowerCase() === email && String(u.senha) === senha
        );

        if (!user) {
            alert("Usuário ou senha incorretos!");
            btn.innerText = "Acessar Sistema";
            return;
        }

        document.getElementById('tela-login').classList.add('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        document.querySelectorAll('.u-name').forEach(el => el.innerText = user.nome);

        renderizarRankings();

        if (user.tipo === 'jovem') {
            document.getElementById('painel-jovem').classList.remove('hidden');
            document.getElementById('meu-saldo').innerText = user.saldo + " CC";
        }

        if (user.tipo === 'lider') {
            document.getElementById('painel-lider').classList.remove('hidden');
            carregarLider();
        }

        if (user.tipo === 'adm') {
            document.getElementById('painel-adm').classList.remove('hidden');
            document.getElementById('cfg-color-main').value = dados.config.cor;
            document.getElementById('cfg-txt-tema').value = dados.config.tema;
        }

    } catch (e) {
        alert("Erro de conexão com o servidor!");
    } finally {
        btn.innerText = "Acessar Sistema";
    }
}

/* ================== ATUALIZA DADOS ================== */
async function atualizarDadosLocais() {
    try {
        const res = await fetch(URL_API);
        const dados = await res.json();
        listaUsuarios = dados.usuarios;
        renderizarRankings();

        const emailLogado = document.getElementById('email').value.trim().toLowerCase();
        const user = listaUsuarios.find(u => u.email.toLowerCase() === emailLogado);

        if (user && user.tipo === 'jovem') {
            document.getElementById('meu-saldo').innerText = user.saldo + " CC";
        }
    } catch (e) {
        console.error("Erro ao atualizar dados:", e);
    }
}

/* ================== PRESENÇA ================== */
async function enviarPresenca() {
    const btn = document.querySelector('.btn-presenca');
    const originalText = btn.innerText;
    btn.innerText = "Registrando...";
    btn.disabled = true;

    const email = document.getElementById('lista-jovens').value;
    const atividade = document.getElementById('tipo-ativ').value;

    if (!email) {
        alert("Selecione um jovem.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    try {
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ acao: 'presenca', email, atividade })
        });

        alert("Presença registrada com sucesso!");
        await atualizarDadosLocais();

    } catch {
        alert("Erro ao salvar presença.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

/* ================== BÔNUS ================== */
async function enviarPontosExtras() {
    const btn = document.querySelector('.btn-bonus');
    const select = document.getElementById('lista-jovens');
    const email = select.value;

    if (!email) {
        alert("Selecione um jovem na lista acima primeiro.");
        return;
    }

    const nomeJovem = select.options[select.selectedIndex].text;

    if (!confirm(`ATENÇÃO:\nDeseja realmente dar +10 pontos extras para: ${nomeJovem}?`)) {
        return;
    }

    const originalText = btn.innerText;
    btn.innerText = "Enviando bônus...";
    btn.disabled = true;

    try {
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                acao: 'pontos_extras',
                email,
                valor: 10
            })
        });

        alert(`Sucesso! +10 pontos enviados para ${nomeJovem}.`);
        await atualizarDadosLocais();

    } catch (e) {
        alert("Erro ao enviar pontos extras.");
        console.error(e);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

/* ================== AUTO CADASTRO ================== */
async function enviarAutoCadastro() {
    const btn = document.querySelector('#tela-auto-cadastro .btn-presenca');
    const nome = document.getElementById('self-nome').value.trim();
    const email = document.getElementById('self-email').value.trim().toLowerCase();
    const senha = document.getElementById('self-senha').value;

    if (!nome || !email || !senha) {
        alert("Por favor, preencha todos os campos!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Criando conta... aguarde";

    try {
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                acao: 'cadastrar',
                nome,
                email,
                senha,
                tipo: 'jovem'
            })
        });

        alert("Conta criada com sucesso! Agora você pode fazer login.");
        mostrarLogin();

        document.getElementById('self-nome').value = "";
        document.getElementById('self-email').value = "";
        document.getElementById('self-senha').value = "";

    } catch (e) {
        alert("Erro ao realizar cadastro. Tente novamente.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Finalizar Cadastro";
    }
}

/* ================== ADM ================== */
async function salvarDesignPermanente() {
    const btn = document.querySelector('.btn-adm');
    btn.innerText = "Salvando...";
    btn.disabled = true;

    const cor = document.getElementById('cfg-color-main').value;
    const tema = document.getElementById('cfg-txt-tema').value;

    try {
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ acao: 'salvarDesign', cor, tema })
        });

        alert("Design salvo com sucesso!");
        document.documentElement.style.setProperty('--primary', cor);
        document.documentElement.style.setProperty('--bg-page', cor);

    } catch {
        alert("Erro ao salvar");
    } finally {
        btn.innerText = "Salvar para Todos";
        btn.disabled = false;
    }
}

/* ================== RANKING ================== */
function renderizarRankings() {
    const ranking = [...listaUsuarios]
        .filter(u => u.tipo === 'jovem')
        .sort((a, b) => b.saldo - a.saldo);

    const html = ranking
        .map((u, i) =>
            `<tr>
                <td>${i + 1}º</td>
                <td>${u.nome}</td>
                <td><strong>${u.saldo}</strong> CC</td>
            </tr>`
        )
        .join('');

    document.querySelectorAll('.rank-body')
        .forEach(tb => tb.innerHTML = html);
}

/* ================== LÍDER ================== */
function carregarLider() {
    const select = document.getElementById('lista-jovens');

    let options = '<option value="" disabled selected>Selecione um Jovem...</option>';
    options += listaUsuarios
        .filter(u => u.tipo === 'jovem')
        .map(j => `<option value="${j.email}">${j.nome}</option>`)
        .join('');

    select.innerHTML = options;
}
