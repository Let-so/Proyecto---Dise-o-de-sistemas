// ───────── BASE DE DATOS SIMULADA ─────────
const db = {
  get users() {
    return JSON.parse(localStorage.getItem('users') || '[]');
  },
  set users(arr) {
    localStorage.setItem('users', JSON.stringify(arr));
  },
  addUser(user) {
    const exist = db.users.some(u => u.email === user.email);
    if (exist) throw new Error('Ya existe un usuario con ese e-mail');
    db.users = [...db.users, user];
  },
  auth(email, pass) {
    return db.users.find(u => u.email === email && u.pass === pass);
  }
};

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

// ───────── PACIENTE – REGISTRO CON CÓDIGO ─────────
function initCrearCuenta() {
  const form = document.getElementById('frmCrear');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.email.value.trim();
    const pass = form.pass.value;
    const code = form.code.value.trim();

    if (!email || !pass || !code)
      return goto("codigo-o-datos-invalidos.html");

    let vinculos = JSON.parse(localStorage.getItem('vinculos') || '[]');
    let vinculo = vinculos.find(v => v.codigo === code && v.estado === "pendiente");

    if (!vinculo) return goto("codigo-o-datos-invalidos.html");

    db.addUser({ email, pass, role: 'paciente', codeVinculo: code });

    vinculo.pacienteEmail = email;
    vinculo.estado = "confirmado";
    localStorage.setItem('vinculos', JSON.stringify(vinculos));

    toast('Registro exitoso');
    goto('dashboard-paciente.html');
  });
}

// ───────── LOGIN ─────────
function initLogin() {
  const form = document.getElementById("frmLogin");
  form.addEventListener("submit", e => {
    e.preventDefault();

    const email = form.email.value.trim();
    const pass = form.pass.value;
    const user = db.auth(email, pass);

    if (!user) return toast("Credenciales incorrectas", false);

    localStorage.setItem('logged', JSON.stringify(user));
    if (user.role === "medico") goto("panel-medico.html");
    else goto("dashboard-paciente.html");
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
