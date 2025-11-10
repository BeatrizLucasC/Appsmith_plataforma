export default {
  // Recebe SEMPRE um objeto pergunta (linha da query)
  isAmbiental: (row) => {
    if (!row) return false; // evita 'q undefined'
    const d = String(row.dominio || "").trim().toLowerCase();
    return d === "ambiental";
  },

  // Controla visibilidade de cada item do List
  visibleForItem: (row, answers) => {
    if (!row) return false; // evita 'item undefined'
    // Se a linha for P3, só mostra quando P2 = "Sim"
    if (String(row.id_pergunta) === "p3") {
      return (answers?.["p2"] === "Sim");
    }
    // Caso contrário, mostra
    return true;
  }
};

