// public/js/app.js

// ───────── UTILITARIOS ─────────
function goto(url) {
  window.location.href = url;
}
function toast(msg, ok = true) {
  alert(msg);
}

// ───────── INIT FUNCTIONS ─────────

// 1) Registro de Paciente con código
async function initCrearCuenta() {
  const form        = document.getElementById('frmCrear');
  if (!form) return;

  const inputNombre = form.nombre;
  const inputEmail  = form.email;
  const inputPass   = form.pass;
  const inputRepass = form.repass;
  const inputCode   = document.getElementById('code');
  const btnValidate = document.getElementById('btnValidate');
  const btnSubmit   = document.getElementById('btnSubmit');

  let codeValidated = false;

  // Validar código de invitación
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

  // Envío del formulario
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
        headers: { 'Content-Type': 'application/json' },
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

// 2) Login de Paciente y Médico
function initLogin() {
  // Paciente
  const formP = document.getElementById('iniciarSesionPacienteForm');
  if (formP) {
    formP.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = formP.emailPaciente.value.trim();
      const password = formP.passwordPaciente.value;
      try {
        const res = await fetch('/api/auth/iniciar-sesion-paciente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('tokenPaciente', data.token);
          goto('/dashboard-paciente.html');
        } else {
          toast(data.msg, false);
        }
      } catch {
        toast('Error de servidor', false);
      }
    });
  }

  // Médico
  const formM = document.getElementById('iniciarSesionMedicoForm');
  if (formM) {
    formM.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = formM.emailMedico.value.trim();
      const password = formM.passwordMedico.value;
      try {
        const res = await fetch('/api/auth/iniciar-sesion-medico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('tokenMedico', data.token);
          goto('/panel-medico.html');
        } else {
          toast(data.msg, false);
        }
      } catch {
        toast('Error de servidor', false);
      }
    });
  }
}

// 3) Registro de Médico
async function initRegistroMedico() {
  const form = document.getElementById('frmMedRegistro');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nombre    = form.nombre.value.trim();
    const email     = form.email.value.trim();
    const password  = form.pass.value;
    const tel       = form.tel.value.trim();
    const esp       = form.esp.value.trim();
    const matricula = form.matricula.value.trim().toUpperCase();

    if (!nombre||!email||!password||!tel||!esp||!matricula) {
      return toast('Completá todos los campos', false);
    }
    if (!/^MP-\d{5}$/i.test(matricula)) {
      return toast('Formato de matrícula inválido (MP-12345)', false);
    }

    try {
      const res = await fetch('/api/auth/register-medico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, tel, esp, matricula })
      });
      const data = await res.json();
      if (res.ok) {
        toast('Médico registrado con éxito');
        goto('/iniciar-sesion-medico.html');
      } else {
        toast(data.msg, false);
      }
    } catch {
      toast('Error de servidor', false);
    }
  });
}

// 4) Validar matrícula en registro médico (Local)
function initMedStep1() {
  const form = document.getElementById('frmMatricula');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const matRaw = form.matricula.value;
    const mat    = matRaw.trim().toUpperCase();
    if (!/^MP-\d{5}$/i.test(mat)) {
      return toast('Formato de matrícula: MP-12345', false);
    }
    const num = Number(mat.split('-')[1]);
    if (isNaN(num) || num < 1 || num > 207475) {
      return goto('/matricula-invalida.html');
    }
    sessionStorage.setItem('matriculaTmp', mat);
    goto('/registro-medico-form.html');
  });
}

async function initPanelMedico() {
  const pCodigo = document.getElementById('codigo');
  const btnGen  = document.getElementById('btnGen');
  const btnCopy = document.getElementById('btnCopiar');
  const msgCopy = document.getElementById('copiado');
  const pacienteCount = document.getElementById('pacienteCount');
  const token   = localStorage.getItem('tokenMedico');
  const tableB  = document.querySelector('#invitesTable tbody');

  if (!pCodigo || !btnGen || !tableB) {
    console.warn('Elementos del panel médico no encontrados');
    return;
  }

  if (!token) {
    toast('Tu sesión expiró. Iniciá sesión nuevamente.', false);
    return goto('/iniciar-sesion-medico.html');
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Función para recargar la tabla
  async function loadInvites() {
    try {
      const res = await fetch('/api/auth/invitations/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'No se pudieron cargar las invitaciones');
      }

      tableB.innerHTML = '';

      if (!Array.isArray(data) || data.length === 0) {
        tableB.innerHTML = '<tr><td colspan="5">Sin invitaciones aún.</td></tr>';
        if (pacienteCount) {
          pacienteCount.textContent = '0 pacientes vinculados';
        }
      } else {
        let usedCount = 0;
        data.forEach(inv => {
          if (inv.used) usedCount += 1;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${inv.code}</td>
            <td>${formatDate(inv.createdAt)}</td>
            <td>${inv.used ? 'Usado' : 'Pendiente'}</td>
            <td>${inv.paciente?.nombre || '-'}</td>
            <td>${inv.paciente?.email  || '-'}</td>
          `;
          tableB.appendChild(tr);
        });
        if (pacienteCount) {
          const label = usedCount === 1 ? 'paciente vinculado' : 'pacientes vinculados';
          pacienteCount.textContent = `${usedCount} ${label}`;
        }
      }
    } catch (e) {
      console.error('[loadInvites]', e);
      tableB.innerHTML = '<tr><td colspan="5">No se pudieron cargar las invitaciones.</td></tr>';
      toast(e.message || 'Error al cargar invitaciones', false);
    }
  }

  // 1) Generar código (ya lo tenías)
  btnGen.addEventListener('click', async () => {
    btnGen.disabled = true;
    try {
      const res = await fetch('/api/auth/invitations/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.code) {
        throw new Error(data.msg || 'No se pudo generar el código');
      }
      pCodigo.textContent = data.code;
      toast('Código generado');
      await loadInvites();
    } catch (err) {
      console.error('[createInvite]', err);
      toast(err.message || 'Error al generar el código', false);
    } finally {
      btnGen.disabled = false;
    }
  });

  if (btnCopy && navigator.clipboard) {
    btnCopy.addEventListener('click', async () => {
      const code = pCodigo.textContent?.trim();
      if (!code || code === '---') return;
      try {
        await navigator.clipboard.writeText(code);
        if (msgCopy) {
          msgCopy.style.display = 'inline';
          setTimeout(() => { msgCopy.style.display = 'none'; }, 2000);
        }
      } catch (err) {
        console.error('[copyCode]', err);
        toast('No se pudo copiar el código', false);
      }
    });
  } else if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      toast('Copiar no es compatible con este navegador', false);
    });
  }

  // 3) Al abrir la página, carga la tabla inicialmente
  await loadInvites();
}


// ───────── DASHBOARD PACIENTE ─────────
async function initDashboardPaciente() {
  const token = localStorage.getItem('tokenPaciente');
  if (!token) {
    // si no hay token, lo mandamos a login
    return goto('/iniciar-sesion-paciente.html');
  }

  try {
    const res = await fetch('/api/auth/paciente/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || 'Error al cargar perfil');
    }

    // Pinta los datos en el HTML
    document.getElementById('miNombre').textContent  = data.nombre;
    document.getElementById('miEmail').textContent   = data.email;
    if (data.medico) {
      document.getElementById('medNombre').textContent = data.medico.nombre;
      document.getElementById('medEmail').textContent  = data.medico.email;
    } else {
      document.getElementById('medNombre').textContent = '—';
      document.getElementById('medEmail').textContent  = '—';
    }
  } catch (err) {
    console.error('[dashboard-paciente]', err);
    toast(err.message || 'Error de servidor', false);
  }
}

// ───────── MONTAJE PRINCIPAL ─────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  switch (page) {
    case 'crear-cuenta':
      initCrearCuenta();
      break;
    case 'login':
      initLogin();
      break;
    case 'registro-medico':
      initRegistroMedico();
      break;
    case 'med-step1':
      initMedStep1();
      break;
    case 'panel-medico':
      initPanelMedico();
      break;
    case 'dashboard-paciente':
      initDashboardPaciente();
      break;
  }
});
