const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCB9WLqRrbMOwIp_naOA1YTZHHu9YCzq8IRPCcpk1OmGFrqr8zPQSvKAeV2b-0CdOO/exec';

function fetchJsonp(params) {
  return new Promise((resolve, reject) => {
    const cbName = '_cb_' + Date.now();
    const base   = Object.entries(params).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const url    = `${APPS_SCRIPT_URL}?${base}&callback=${cbName}`;
    const script = document.createElement('script');
    const timer  = setTimeout(() => { cleanup(); reject(new Error('Timeout')); }, 10000);

    window[cbName] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error('Erro de rede')); };
    script.src = url;
    document.head.appendChild(script);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      script.remove();
    }
  });
}

document.getElementById('year').textContent = new Date().getFullYear();

const form       = document.getElementById('formSeminario');
const successMsg = document.getElementById('successMsg');
const btnSubmit  = form.querySelector('button[type="submit"]');


function sanitize(str) {
  return String(str).replace(/[<>"'`]/g, '').trim().slice(0, 500);
}

function setError(id, msg) {
  const el    = document.getElementById('err-' + id);
  const input = document.getElementById(id);
  if (el)    el.textContent = msg;
  if (input) input.classList.toggle('invalid', !!msg);
}

// Mostrar/ocultar campo de chegada conforme resposta de acampamento
document.querySelectorAll('input[name="acampado"]').forEach(el => {
  el.addEventListener('change', function () {
    document.getElementById('field-chegada').style.display = this.value === 'Sim' ? '' : 'none';
  });
});

function clearErrors() {
  ['nomeCompleto', 'registroUEB', 'regiaoEscoteira', 'religiao', 'acampado', 'refeicao', 'refeicaoJantar']
    .forEach(id => setError(id, ''));
}

function validate(data) {
  let ok = true;
  if (!data.nomeCompleto || data.nomeCompleto.length < 5) {
    setError('nomeCompleto', 'Informe seu nome completo.'); ok = false;
  }
  if (!data.registroUEB || data.registroUEB.length < 2) {
    setError('registroUEB', 'Informe seu registro UEB.'); ok = false;
  }
  if (!data.regiaoEscoteira || data.regiaoEscoteira.length < 2) {
    setError('regiaoEscoteira', 'Informe sua região escoteira.'); ok = false;
  }
  if (!data.religiao || data.religiao.length < 2) {
    setError('religiao', 'Informe sua religião ou tradição espiritual.'); ok = false;
  }
  if (!data.acampado) {
    setError('acampado', 'Selecione uma opção.'); ok = false;
  }
  if (!data.refeicao) {
    setError('refeicao', 'Selecione uma opção de refeição para o almoço.'); ok = false;
  }
  if (!data.refeicaoJantar) {
    setError('refeicaoJantar', 'Selecione uma opção de refeição para o jantar.'); ok = false;
  }
  return ok;
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  clearErrors();

  const acampadoEl      = form.querySelector('input[name="acampado"]:checked');
  const refeicaoEl      = form.querySelector('input[name="refeicao"]:checked');
  const refeicaoJantarEl = form.querySelector('input[name="refeicaoJantar"]:checked');

  const data = {
    nomeCompleto:    sanitize(document.getElementById('nomeCompleto').value),
    registroUEB:     sanitize(document.getElementById('registroUEB').value),
    regiaoEscoteira: sanitize(document.getElementById('regiaoEscoteira').value),
    religiao:        sanitize(document.getElementById('religiao').value),
    expectativas:    sanitize(document.getElementById('expectativas').value),
    acampado:        acampadoEl ? acampadoEl.value : '',
    chegada:         sanitize(document.getElementById('chegada').value),
    refeicao:        refeicaoEl ? refeicaoEl.value : '',
    refeicaoJantar:  refeicaoJantarEl ? refeicaoJantarEl.value : '',
  };

  if (!validate(data)) return;

  btnSubmit.disabled    = true;
  btnSubmit.textContent = 'Enviando...';

  try {
    fetchJsonp({ action: 'submit', ...data });
    setTimeout(() => {
      form.classList.add('hidden');
      successMsg.classList.remove('hidden');
    }, 1500);
  } finally {
    btnSubmit.disabled    = false;
    btnSubmit.textContent = 'Confirmar Inscrição';
  }
});
