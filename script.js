// Referencias
const cursoForm = document.getElementById("curso-form");
const cursosContainer = document.getElementById("cursos-container");
const cursosCompletados = document.getElementById("cursos-completados");
const contadorCursos = document.getElementById("contador-cursos");
const buscador = document.getElementById("buscador");

// Cargar
let cursos = JSON.parse(localStorage.getItem("misCursos")) || [];

// Guardar
function guardarCursos() {
    localStorage.setItem("misCursos", JSON.stringify(cursos));
}

// Progreso
function calcularProgreso(t) {
    if (t.length === 0) return 0;
    return Math.round((t.filter(x => x.completada).length / t.length) * 100);
}

// Renderizar
function renderCursos() {
    cursosContainer.innerHTML = "";
    cursosCompletados.innerHTML = "";

    // Filtrar por buscador
    const texto = buscador.value.toLowerCase();

    let countCompletados = 0;

    cursos.forEach((curso, index) => {
        const progreso = calcularProgreso(curso.tareas);
        const completado = progreso === 100;

        // No coincide con búsqueda
        if (!curso.nombre.toLowerCase().includes(texto) &&
            !curso.categoria.toLowerCase().includes(texto)) return;

        const cursoDiv = document.createElement("div");
        cursoDiv.classList.add("curso");

        // NUMERACIÓN
        cursoDiv.innerHTML = `
            <div class="curso-header">
                <div>
                    <div class="curso-nombre">
                        ${curso.url ? `<a href="${curso.url}" target="_blank">${index + 1}. ${curso.nombre}</a>`
                                     : `${index + 1}. ${curso.nombre}`}
                    </div>
                    <div class="curso-categoria">${curso.categoria || ""}</div>
                </div>
                <button class="eliminar" data-index="${index}">❌</button>
            </div>

            <div class="curso-fechas">
                ${curso.fechaInicio ? "Inicio: " + curso.fechaInicio : ""}
                ${curso.fechaInicio && curso.fechaFin ? " | " : ""}
                ${curso.fechaFin ? "Fin: " + curso.fechaFin : ""}
            </div>

            <div class="curso-editar-fecha">
                <input type="date" value="${curso.fechaFin || ""}">
                <button class="guardar-fecha" data-index="${index}">Guardar nueva fecha</button>
            </div>

            <ul class="tareas">
                ${
                    curso.tareas.map((t, i) =>
                        `<li class="tarea">
                            <input type="checkbox" ${t.completada ? "checked" : ""} data-curso="${index}" data-tarea="${i}">
                            <label>${t.nombre}</label>
                            <button class="eliminar-tarea" data-curso="${index}" data-tarea="${i}">🗑️</button>
                        </li>`
                    ).join("")
                }
            </ul>

            <div class="agregar-tarea">
                <input type="text" placeholder="Nueva tarea">
                <button class="add-tarea" data-index="${index}">Agregar</button>
            </div>

            <div class="progreso">Progreso: ${progreso}%</div>

            <div class="mover-botones">
                <button class="subir" data-index="${index}">↑</button>
                <button class="bajar" data-index="${index}">↓</button>
            </div>
        `;

        if (completado) {
            cursosCompletados.appendChild(cursoDiv);
            countCompletados++;
        } else {
            cursosContainer.appendChild(cursoDiv);
        }
    });

    contadorCursos.textContent = `Total de cursos: ${cursos.length} | Cursos completados: ${countCompletados}`;
}

// Agregar curso
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

// Delegación general
document.body.addEventListener("click", e => {
    const t = e.target;

    // Eliminar curso
    if (t.classList.contains("eliminar")) {
        cursos.splice(t.dataset.index, 1);
        guardarCursos();
        renderCursos();
        return;
    }

    // Agregar tarea
    if (t.classList.contains("add-tarea")) {
        const input = t.previousElementSibling;
        const nombre = input.value.trim();
        if (!nombre) return alert("La tarea necesita nombre");
        const idx = t.dataset.index;
        cursos[idx].tareas.push({ nombre, completada: false });
        guardarCursos();
        renderCursos();
        return;
    }

    // Eliminar tarea
    if (t.classList.contains("eliminar-tarea")) {
        cursos[t.dataset.curso].tareas.splice(t.dataset.tarea, 1);
        guardarCursos();
        renderCursos();
        return;
    }

    // Guardar nueva fecha
    if (t.classList.contains("guardar-fecha")) {
        const idx = t.dataset.index;
        const nueva = t.previousElementSibling.value;
        cursos[idx].fechaFin = nueva;
        guardarCursos();
        renderCursos();
        return;
    }

    // MOVER ↑
    if (t.classList.contains("subir")) {
        const i = Number(t.dataset.index);
        if (i > 0) {
            [cursos[i - 1], cursos[i]] = [cursos[i], cursos[i - 1]];
            guardarCursos();
            renderCursos();
        }
    }

    // MOVER ↓
    if (t.classList.contains("bajar")) {
        const i = Number(t.dataset.index);
        if (i < cursos.length - 1) {
            [cursos[i + 1], cursos[i]] = [cursos[i], cursos[i + 1]];
            guardarCursos();
            renderCursos();
        }
    }
});

// Checkbox (tarea completada)
document.body.addEventListener("change", e => {
    const t = e.target;
    if (t.type === "checkbox") {
        const curso = t.dataset.curso;
        const tarea = t.dataset.tarea;
        cursos[curso].tareas[tarea].completada = t.checked;
        guardarCursos();
        renderCursos();
    }
});

// Buscador
buscador.addEventListener("input", renderCursos);

// Exportar
document.getElementById("exportar-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(cursos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mis-cursos.json";
    a.click();
    URL.revokeObjectURL(url);
});

// Importar
document.getElementById("importar-input").addEventListener("change", e => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(ev) {
        try {
            cursos = JSON.parse(ev.target.result);
            guardarCursos();
            renderCursos();
            alert("Cursos importados correctamente");
        } catch {
            alert("Archivo no válido");
        }
    };
    lector.readAsText(archivo);
});

// Inicio
renderCursos();
