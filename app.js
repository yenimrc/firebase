// Importar Firebase desde la CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
getFirestore,
collection,
addDoc,
onSnapshot,
getDocs,
doc,
updateDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

//--------- Configuración de Firebase ------------

const firebaseConfig = {
  apiKey: "AIzaSyCn9-hDNVJgV2EcT7zaNkvnPDMpXHiZrvo",
  authDomain: "crud-estuduantes.firebaseapp.com",
  projectId: "crud-estuduantes",
  storageBucket: "crud-estuduantes.firebasestorage.app",
  messagingSenderId: "1049566034316",
  appId: "1:1049566034316:web:524a79e0d5ccb93a473ea9",
  measurementId: "G-9MBSECVP69"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Colección de estudiantes
const estudiantesCol = collection(db, "estudiantes");
// Referencias al DOM
const estudianteForm = document.getElementById("estudianteForm");
const estudianteIdInput = document.getElementById("estudianteId");
const nombreInput = document.getElementById("nombre");
const semestreInput = document.getElementById("semestre");
const grupoInput = document.getElementById("grupo");
const examen1Input = document.getElementById("examen1");
const examen2Input = document.getElementById("examen2");
const examen3Input = document.getElementById("examen3");
const examen4Input = document.getElementById("examen4");
const btnCancelar = document.getElementById("btnCancelar");
const tbodyEstudiantes = document.getElementById("tbodyEstudiantes");
const graficaTitulo = document.getElementById("graficaTitulo");
const canvas = document.getElementById("graficaProgreso");
let editando = false;
let grafica = null;
console.log("Firebase inicializado correctamente", app);
// LISTAR EN TIEMPO REAL
onSnapshot(estudiantesCol, (snapshot) => {
tbodyEstudiantes.innerHTML = "";
snapshot.forEach((docSnap) => {
const est = docSnap.data();
const tr = document.createElement("tr");
const promedio =
typeof est.promedio === "number"
? est.promedio.toFixed(2)
: est.promedio || "-";
tr.innerHTML = `
<td>${est.nombre}</td>
<td>${est.semestre}</td>
<td>${est.grupo || ""}</td>
<td>${promedio}</td>
<td>
<button class="btn btn-table btn-progreso" data-id="${docSnap.id}">Progreso</button>
<button class="btn btn-table btn-editar" data-id="${docSnap.id}">Editar</button>
<button class="btn btn-table btn-eliminar" data-id="${docSnap.id}">Eliminar</button>
</td>
`;
tbodyEstudiantes.appendChild(tr);
});
document.querySelectorAll(".btn-progreso").forEach((btn) => {
btn.addEventListener("click", () => mostrarProgreso(btn.dataset.id));
});
document.querySelectorAll(".btn-editar").forEach((btn) => {
btn.addEventListener("click", () => cargarEstudianteEnFormulario(btn.dataset.id));
});
document.querySelectorAll(".btn-eliminar").forEach((btn) => {
btn.addEventListener("click", () => borrarEstudiante(btn.dataset.id));
});
});
// GUARDAR / ACTUALIZAR
estudianteForm.addEventListener("submit", async (e) => {
e.preventDefault();
const examen1 = Number(examen1Input.value);
const examen2 = Number(examen2Input.value);
const examen3 = Number(examen3Input.value);
const examen4 = Number(examen4Input.value);
const promedio = (examen1 + examen2 + examen3 + examen4) / 4;
const grupoNumero = grupoInput.value.trim();
const estudianteData = {
nombre: nombreInput.value.trim(),
semestre: semestreInput.value.trim(),
grupo: grupoNumero ? "ICO " + grupoNumero : "",
examen1,
examen2,
examen3,
examen4,
promedio
};
if (!estudianteData.nombre || !estudianteData.semestre || !grupoNumero) {
alert("Nombre, semestre y grupo (número) son obligatorios");
return;
}
try {
if (!editando) {
await addDoc(estudiantesCol, estudianteData);
} else {
const id = estudianteIdInput.value;
const ref = doc(db, "estudiantes", id);
await updateDoc(ref, estudianteData);
}
limpiarFormulario();
} catch (error) {
console.error("Error al guardar:", error);
alert("Ocurrió un error al guardar");
}
});
//EDITAR
async function cargarEstudianteEnFormulario(id) {
const docsSnap = await getDocs(estudiantesCol);
docsSnap.forEach((docSnap) => {
if (docSnap.id === id) {
const est = docSnap.data();
estudianteIdInput.value = id;
nombreInput.value = est.nombre;
semestreInput.value = est.semestre;
grupoInput.value = est.grupo ? est.grupo.replace("ICO ", "") : "";
examen1Input.value = est.examen1;
examen2Input.value = est.examen2;
examen3Input.value = est.examen3;
examen4Input.value = est.examen4;
editando = true;
}
});
}
// BORRAR
async function borrarEstudiante(id) {
if (!confirm("¿Seguro que deseas eliminar este estudiante?")) return;
try {
const ref = doc(db, "estudiantes", id);
await deleteDoc(ref);
} catch (error) {
console.error("Error al borrar:", error);
alert("Ocurrió un error al borrar");
}
}
// LIMPIAR FORMULARIO
btnCancelar.addEventListener("click", () => limpiarFormulario());
function limpiarFormulario() {
estudianteForm.reset();
estudianteIdInput.value = "";
editando = false;
}
// GRÁFICA DE PROGRESO
async function mostrarProgreso(id) {
const docsSnap = await getDocs(estudiantesCol);
let est = null;
docsSnap.forEach((docSnap) => {
if (docSnap.id === id) {
est = docSnap.data();
}
});
if (!est) return;
graficaTitulo.textContent = `Progreso de ${est.nombre} (Semestre ${est.semestre})`;
const labels = ["Examen 1", "Examen 2", "Examen 3", "Examen 4"];
const data = [est.examen1, est.examen2, est.examen3, est.examen4];
if (grafica) {
grafica.destroy();
}
grafica = new Chart(canvas, {
type: "line",
data: {
labels,
datasets: [
{
label: "Calificación",
data,
tension: 0.3
}
]
},
options: {
responsive: true,
scales: {
y: {
suggestedMin: 0,
suggestedMax: 100
}
}
}
});
}
