// Referencias
const cursoForm = document.getElementById("curso-form");
const cursosContainer = document.getElementById("cursos-container");

// Cargar desde localStorage
let cursos = JSON.parse(localStorage.getItem("misCursos")) || [];

// Guardar cursos en localStorage
function guardarCursos() {
  localStorage.setItem("misCursos", JSON.stringify(cursos));
}

// Calcular porcentaje completado
function calcularProgreso(tareas) {
  if (tareas.length === 0) return 0;
  const completadas = tareas.filter(t => t.completada).length;
  return Math.round((completadas / tareas.length) * 100);
}

// Renderizar cursos
function renderCursos() {
  cursosContainer.innerHTML = "";
  if (cursos.length === 0) {
    cursosContainer.innerHTML = "<p>No hay cursos agregados aún.</p>";
    return;
  }

  cursos.forEach((curso, index) => {
    const cursoDiv = document.createElement("div");
    cursoDiv.classList.add("curso");

    // Header
    const header = document.createElement("div");
    header.classList.add("curso-header");
    header.innerHTML = `
      <div>
        <div class="curso-nombre">
          ${curso.url ? `<a href="${curso.url}" target="_blank">${curso.nombre}</a>` : curso.nombre}
        </div>
        <div class="curso-categoria">${curso.categoria || ""}</div>
      </div>
      <button aria-label="Eliminar curso" title="Eliminar curso" data-index="${index}">❌</button>
    `;
    cursoDiv.appendChild(header);

    // Fechas
    const fechas = document.createElement("div");
    fechas.classList.add("curso-fechas");
    fechas.textContent = `${curso.fechaInicio ? "Inicio: " + curso.fechaInicio : ""}${curso.fechaInicio && curso.fechaFin ? " | " : ""}${curso.fechaFin ? "Fin: " + curso.fechaFin : ""}`;
    cursoDiv.appendChild(fechas);

    // Editar fecha fin
    const editarFecha = document.createElement("div");
    editarFecha.classList.add("curso-editar-fecha");
    editarFecha.innerHTML = `
      <input type="date" value="${curso.fechaFin || ""}" />
      <button data-index="${index}" class="guardar-fecha">Guardar nueva fecha</button>
    `;
    cursoDiv.appendChild(editarFecha);

    // Tareas
    const ul = document.createElement("ul");
    ul.classList.add("tareas");
    curso.tareas.forEach((tarea, tareaIndex) => {
      const li = document.createElement("li");
      li.classList.add("tarea");
      li.innerHTML = `
        <input type="checkbox" id="c-${index}-t-${tareaIndex}" ${tarea.completada ? "checked" : ""}>
        <label for="c-${index}-t-${tareaIndex}">${tarea.nombre}</label>
        <button data-curso="${index}" data-tarea="${tareaIndex}" title="Eliminar tarea">🗑️</button>
      `;
      ul.appendChild(li);
    });
    cursoDiv.appendChild(ul);

    // Agregar tarea
    const nuevaTarea = document.createElement("div");
    nuevaTarea.classList.add("agregar-tarea");
    nuevaTarea.innerHTML = `
      <input type="text" placeholder="Nueva tarea">
      <button>Agregar</button>
    `;
    cursoDiv.appendChild(nuevaTarea);

    // Progreso
    const progreso = document.createElement("div");
    progreso.classList.add("progreso");
    progreso.textContent = `Progreso: ${calcularProgreso(curso.tareas)}%`;
    cursoDiv.appendChild(progreso);

    cursosContainer.appendChild(cursoDiv);
  });
}

// Evento submit
cursoForm.addEventListener("submit", e => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;
  const url = document.getElementById("url").value.trim();

  if (!nombre) return alert("El nombre del curso es obligatorio");

  cursos.push({ nombre, categoria, fechaInicio, fechaFin, url, tareas: [] });
  guardarCursos();
  renderCursos();
  cursoForm.reset();
});

// Delegación de eventos
cursosContainer.addEventListener("click", e => {
  const target = e.target;

  // Eliminar curso
  if (target.tagName === "BUTTON" && target.textContent === "❌") {
    const idx = target.dataset.index;
    cursos.splice(idx, 1);
    guardarCursos();
    renderCursos();
    return;
  }

  // Eliminar tarea
  if (target.tagName === "BUTTON" && target.textContent === "🗑️") {
    const cursoIdx = target.dataset.curso;
    const tareaIdx = target.dataset.tarea;
    cursos[cursoIdx].tareas.splice(tareaIdx, 1);
    guardarCursos();
    renderCursos();
    return;
  }

  // Agregar tarea
  if (target.tagName === "BUTTON" && target.textContent === "Agregar") {
    const input = target.previousElementSibling;
    const nombreTarea = input.value.trim();
    if (!nombreTarea) return alert("El nombre de la tarea es obligatorio");
    const cursoDiv = target.closest(".curso");
    const cursoIdx = Array.from(cursosContainer.children).indexOf(cursoDiv);
    cursos[cursoIdx].tareas.push({ nombre: nombreTarea, completada: false });
    guardarCursos();
    renderCursos();
    return;
  }

  // Guardar nueva fecha fin
  if (target.classList.contains("guardar-fecha")) {
    const index = target.dataset.index;
    const nuevaFecha = target.previousElementSibling.value;
    cursos[index].fechaFin = nuevaFecha;
    guardarCursos();
    renderCursos();
  }
});

// Marcar tarea como completada
cursosContainer.addEventListener("change", e => {
  const target = e.target;
  if (target.type === "checkbox") {
    const cursoDiv = target.closest(".curso");
    const cursoIdx = Array.from(cursosContainer.children).indexOf(cursoDiv);
    const tareaIdx = Array.from(target.parentElement.parentElement.children).indexOf(target.parentElement);
    cursos[cursoIdx].tareas[tareaIdx].completada = target.checked;
    guardarCursos();
    renderCursos();
  }
});

// Render inicial
renderCursos();

// Exportar cursos a archivo JSON
document.getElementById("exportar-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(cursos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mis-cursos.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Importar cursos desde archivo JSON
document.getElementById("importar-input").addEventListener("change", (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = function (e) {
    try {
      const datosImportados = JSON.parse(e.target.result);
      if (!Array.isArray(datosImportados)) throw new Error("Formato incorrecto");
      cursos = datosImportados;
      guardarCursos();
      renderCursos();
      alert("Cursos importados correctamente");
    } catch (err) {
      alert("Error al importar el archivo. Asegúrate de que sea un .json válido.");
    }
  };
  lector.readAsText(archivo);
});
