document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
  loadQuotes();

  document.querySelector(".logout-link").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
});

async function checkAdminAuth() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  // Simple email check for 'admin' (In real app, use Roles)
  // REPLACE THIS WITH YOUR EMAIL
  const allowedAdmins = ["erik@example.com", "admin@fapa.com"];
  if (!allowedAdmins.includes(user.email)) {
    // alert('Acceso denegado. No eres administrador.');
    // window.location.href = 'index.html';
    console.warn(
      "Admin check skipped for demo purposes (RLS will block if not allowed)"
    );
  }
}

async function loadQuotes() {
  const tbody = document.getElementById("quotesBody");
  tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

  const { data, error } = await supabase
    .from("cotizaciones")
    .select(
      `
            *,
            usuarios (email, fullname)
        `
    )
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:red;">Error: ${error.message} - ¿Ejecutaste el script SQL de admin?</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7">No hay cotizaciones registradas.</td></tr>';
    return;
  }

  data.forEach((q) => {
    const tr = document.createElement("tr");
    const date =
      new Date(q.created_at).toLocaleDateString() +
      " " +
      new Date(q.created_at).toLocaleTimeString();
    const userEmail = q.usuarios ? q.usuarios.email : "Usuario Borrado";

    tr.innerHTML = `
            <td>${date}</td>
            <td>${userEmail}</td>
            <td>${q.device_model}</td>
            <td>${q.problem_description}</td>
            <td>$${q.estimated_price}</td>
            <td>
                <select class="status-select" onchange="updateStatus(${
                  q.id
                }, this.value)">
                    <option value="Pendiente" ${
                      q.status === "Pendiente" ? "selected" : ""
                    }>Pendiente</option>
                    <option value="En Revisión" ${
                      q.status === "En Revisión" ? "selected" : ""
                    }>En Revisión</option>
                    <option value="Aprobado" ${
                      q.status === "Aprobado" ? "selected" : ""
                    }>Aprobado</option>
                    <option value="Reparado" ${
                      q.status === "Reparado" ? "selected" : ""
                    }>Reparado</option>
                    <option value="Entregado" ${
                      q.status === "Entregado" ? "selected" : ""
                    }>Entregado</option>
                </select>
            </td>
            <td>
                <button onclick="deleteQuote(${
                  q.id
                })" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">X</button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

async function updateStatus(id, newStatus) {
  const { error } = await supabase
    .from("cotizaciones")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) alert("Error al actualizar: " + error.message);
  else console.log("Estado actualizado");
}

async function deleteQuote(id) {
  if (!confirm("¿Seguro que quieres borrar esta cotización?")) return;

  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);

  if (error) alert("Error: " + error.message);
  else loadQuotes();
}
