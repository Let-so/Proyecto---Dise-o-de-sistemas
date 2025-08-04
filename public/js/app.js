
//app.js
// ───────── UTILITARIOS ─────────
function goto(url) {
  window.location.href = url;
}

function toast(msg, ok = true) {
  alert(msg);
}

// ───────── RUTAS POR PÁGINA ─────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  switch (page) {
    case 'crear-cuenta':
      initCrearCuenta();
      break;
    case 'login':
      initLogin();
      break;
    case 'med-step1':
      initMedStep1();
      break;
    case 'med-step2':
      initMedStep2();
      break;
    case 'panel-medico':
      initPanelMedico();
      break;
    case 'dashboard-paciente':
      initDashboardPaciente();
      break;
  }
});

async function initPanelMedico() {
  const pCodigo = document.getElementById('codigo');
  const btnGen  = document.getElementById('btnGen');
  const btnCop  = document.getElementById('btnCopiar');
  const token   = localStorage.getItem('tokenMedico');

  btnGen.addEventListener('click', async () => {
  const token = localStorage.getItem('tokenMedico');
  const res   = await fetch('/api/auth/invitations/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { code } = await res.json();
  pCodigo.textContent = code;
  toast('Código generado');
});
}

// ───────── PACIENTE – REGISTRO CON CÓDIGO ─────────
async function initCrearCuenta() {
  const form        = document.getElementById('frmCrear');
  const inputNombre = form.nombre;
  const inputEmail  = form.email;
  const inputPass   = form.pass;
  const inputRepass = form.repass;
  const inputCode   = document.getElementById('code');
  const btnValidate = document.getElementById('btnValidate');
  const btnSubmit   = document.getElementById('btnSubmit');

  let codeValidated = false;

  // 1) Validar código contra la API
  btnValidate.addEventListener('click', async () => {
    const code = inputCode.value.trim();
    if (!code) return toast('Ingresá un código', false);

    try {
      const res  = await fetch(
        `/api/auth/invitations/validate?code=${encodeURIComponent(code)}`
      );
      const data = await res.json();

      if (res.ok && data.valid) {
        toast('Código válido');
        codeValidated            = true;
        btnValidate.textContent  = '✅ Validado';
        inputCode.readOnly       = true;
        btnSubmit.disabled       = false;
      } else {
        toast(data.msg || 'Código inválido', false);
      }
    } catch {
      toast('Error de conexión', false);
    }
  });

  // 2) Enviar formulario solo si el código ya fue validado
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!codeValidated) return toast('Primero validá el código', false);

    const nombre   = inputNombre.value.trim();
    const email    = inputEmail.value.trim();
    const password = inputPass.value;
    const repass   = inputRepass.value;
    const code     = inputCode.value.trim();

    if (!nombre || !email || !password || !repass) {
      return toast('Completá todos los campos', false);
    }
    if (password !== repass) {
      return toast('Las contraseñas no coinciden', false);
    }

    try {
      const res2 = await fetch('/api/auth/register-paciente', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ nombre, email, password, code })
      });
      const data2 = await res2.json();

      if (res2.ok) {
        toast('Registro exitoso');
        goto('/iniciar-sesion-paciente.html');
      } else {
        toast(data2.msg, false);
      }
    } catch {
      toast('Error de servidor', false);
    }
  });
}

// Código para Paciente
const formP = document.getElementById('iniciarSesionPacienteForm');
if (formP) {
  formP.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('emailPaciente').value;
    const password = document.getElementById('passwordPaciente').value;

    const res = await fetch('/api/auth/iniciar-sesion-paciente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('tokenPaciente', data.token);
      window.location = '/dashboard-paciente.html';
    } else {
      alert(data.msg);
    }
  });
}

// Código para Médico
const formM = document.getElementById('iniciarSesionMedicoForm');
if (formM) {
  formM.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('emailMedico').value;
    const password = document.getElementById('passwordMedico').value;

    const res = await fetch('/api/auth/Iniciar-sesion-medico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('tokenMedico', data.token);
      window.location = '/dashboard-medico.html';
    } else {
      alert(data.msg);
    }
  });
}
// ───────── MÉDICO – VALIDAR MATRÍCULA (solo formato + rango real) ─────────
function initMedStep1() {
  const form = document.getElementById('frmMatricula');
  if (!form) return;  // Si no existe el formulario, no hace nada

  form.addEventListener('submit', e => {
    e.preventDefault();

    const matRaw = form.matricula.value;
    const mat    = matRaw.trim().toUpperCase();

    // 1) Validación de formato: MP-12345
    if (!/^MP-\d{5}$/i.test(mat)) {
      return toast('Formato de matrícula: MP-12345', false);
    }

    // 2) Validación por rango real (1–207 475)
    const numero = Number(mat.split('-')[1]);
    if (Number.isNaN(numero) || numero < 1 || numero > 207475) {
      // Número fuera de rango → página de matrícula inválida
      window.location.href = '/matricula-invalida.html';
      return;
    }

    // 3) Matrícula OK: guardamos y avanzamos
    sessionStorage.setItem('matriculaTmp', mat);
    window.location.href = '/registro-medico-form.html';
  });
}

// Al cargarse el DOM, detecta la página y llama solo al init correspondiente
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'med-step1') {
    initMedStep1();
  }
  // Más inits para otras páginas en el futuro...
});


// ───────── MÉDICO – REGISTRAR DATOS ─────────
function initMedStep2() {
  const form = document.getElementById('frmMedDatos');
  form.addEventListener('submit', e => {
    e.preventDefault();

    const data = {
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      tel: form.tel.value.trim(),
      pass: form.pass.value,
      esp: form.esp.value.trim(),
      matricula: sessionStorage.getItem('matriculaTmp')
    };

    if (Object.values(data).some(v => !v))
      return goto("datos-medico-invalidos.html");

    db.addUser({
      email: data.email,
      pass: data.pass,
      role: 'medico',
      nombre: data.nombre,
      tel: data.tel,
      esp: data.esp,
      matricula: data.matricula
    });

    toast("Registro exitoso");
    goto("panel-medico.html");
  });
}

// ───────── PANEL MÉDICO – GENERAR Y GUARDAR CÓDIGO ─────────
function initPanelMedico() {
  const pCodigo   = document.getElementById('codigo');
  const btnGen    = document.getElementById('btnGen');
  const btnCopiar = document.getElementById('btnCopiar');
  const spanOk    = document.getElementById('copiado');

  const medico = JSON.parse(localStorage.getItem('logged'));

  btnGen.addEventListener('click', () => {
    const nuevo = Math.floor(100000 + Math.random() * 900000).toString();
    pCodigo.textContent = nuevo;

    let vinculos = JSON.parse(localStorage.getItem("vinculos") || "[]");
    vinculos.push({
      codigo: nuevo,
      medicoEmail: medico.email,
      pacienteEmail: null,
      estado: "pendiente"
    });
    localStorage.setItem("vinculos", JSON.stringify(vinculos));
    toast("Código generado y guardado");
  });

  btnCopiar.addEventListener('click', () => {
    navigator.clipboard.writeText(pCodigo.textContent).then(() => {
      spanOk.style.display = 'inline';
      setTimeout(() => spanOk.style.display = 'none', 1200);
    });
  });
}

// ───────── DASHBOARD PACIENTE (VACÍO DE MOMENTO) ─────────
function initDashboardPaciente() {
  // Para mostrar vínculos en el futuro
}


