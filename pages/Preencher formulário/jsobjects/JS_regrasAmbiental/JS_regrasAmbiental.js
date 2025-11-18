export default {
  // Store user answers
  answers: {},

  // 1️⃣ Obter todas as perguntas do domínio "Ambiental"
  getQuestions() {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => String(q.Domínio || "").trim().toLowerCase() === "ambiental"
    );
  },

  // 2️⃣ Filtrar perguntas com base nos widgets de seleção
  filterQuestions() {
    const all = this.getQuestions();
    if (!all.length) return [];

    const selectedCert = Multiselect_Certificacao.selectedOptionValues || [];
    const selectedSP = Multiselect_SistemaProducao.selectedOptionValues || [];
    const selectedDE = Select_Dimensao.selectedOptionValue || "";

    return all.filter(q => {
      const certMatch =
        selectedCert.length === 0 || selectedCert.some(col => q[col] === "S");
      const spMatch =
        selectedSP.length === 0 || selectedSP.some(col => q[col] === "S");
      const deMatch = !selectedDE || q[selectedDE] === "S";

      return certMatch && spMatch && deMatch;
    });
  },

  // 3️⃣ Determinar perguntas visíveis com base nas respostas anteriores
  getVisibleQuestions() {
    const all = this.filterQuestions();
    const answers = this.answers || {};
    if (!all.length) return [];

    const byId = Object.fromEntries(all.map(q => [String(q.Código), q]));
    const visible = [];
    let current = all[0];

    while (current) {
      visible.push(current);
      const id = String(current.Código);
      const ans = answers[id];

      let nextId =
        (ans === "Sim" && current["Condição SIM"]) ||
        (ans === "Não" && current["Condição NÃO"]) ||
        (ans === "NA" && current["Condição NA"]) ||
        null;

      if (!nextId) {
        const idx = all.findIndex(q => String(q.Código) === id);
        nextId = idx >= 0 && idx + 1 < all.length ? String(all[idx + 1].Código) : null;
      }

      if (!nextId || !byId[nextId] || visible.some(q => String(q.Código) === nextId)) break;
      current = byId[nextId];
    }

    return visible;
  },

  // 4️⃣ Construir label da pergunta
  questionLabel: row => (row ? `${row.Código || ""} — ${row.Pergunta || ""}` : ""),

  // 5️⃣ Opções do RadioGroup
  radioOptions: () => [
    { label: "NA", value: "NA" },
    { label: "Sim", value: "Sim" },
    { label: "Não", value: "Não" }
  ],

  // 6️⃣ Obter resposta selecionada
  selectedValue(row) {
    return this.answers?.[row.Código] || "";
  },

  // 7️⃣ Atualizar resposta quando o utilizador seleciona uma opção
  onSelectionChange(row, selectedValue) {
    if (!row) return;
    this.answers = { ...this.answers, [String(row.Código)]: selectedValue };
  },

  // 8️⃣ Preparar respostas para guardar
  prepareAnswers() {
    const all = this.getVisibleQuestions();
    const userEmail = appsmith.user.email || "unknown_user";
    const year = new Date().getFullYear();
    const answers = this.answers || {};
    const dominio = "ambiental";

    return all.map(q => ({
      id_resposta: `${userEmail}_${year}_${q.Código}`,
      id_pergunta: q.Código,
      id_utilizador: userEmail,
      resposta:
        answers[q.Código] != null && answers[q.Código] !== ""
          ? String(answers[q.Código]).trim()
          : null,
      ano: year,
      dominio: dominio
    }));
  },

  // 9️⃣ Construir valores SQL para inserção
  buildValues() {
    const prepared = this.prepareAnswers();
    if (!prepared.length) return "('none','none','none',NULL,NOW(),0,'ambiental')";

    return prepared
      .map(ans => {
        const safeVal =
          ans.resposta === null ? "NULL" : `'${ans.resposta.replace(/'/g, "''")}'`;
        return `('${ans.id_resposta}', '${ans.id_pergunta}', '${ans.id_utilizador}', ${safeVal}, NOW(), ${ans.ano}, '${ans.dominio}')`;
      })
      .join(", ");
  },

  // 🔟 Verificar se todas as perguntas visíveis foram respondidas
  isReadyToSubmit() {
    const visibleQuestions = this.getVisibleQuestions();
    return visibleQuestions.every(q => {
      const resposta = this.answers?.[q.Código];
      return ["Sim", "Não", "NA"].includes(resposta);
    });
  },

  // 1️⃣1️⃣ Submeter respostas
  async onSubmit() {
    const userEmail = appsmith.user.email || "unknown_user";
    if (!userEmail) {
      showAlert("Não foi possível identificar o utilizador.", "error");
      return;
    }

    if (!this.isReadyToSubmit()) {
      showAlert("É necessário responder a todas as perguntas para submeter as respostas.", "warning");
      return;
    }

    await Qry_checkExistingAmbiental.run();

    const result = Qry_checkExistingAmbiental.data;
    const hasExisting = Array.isArray(result) && result.length > 0;

    if (hasExisting) {
      showModal("Modal_ConfirmAmbiental");
    } else {
      await Qry_saveAnswersAmbiental.run();
      showAlert("Respostas do domínio ambiental submetidas com sucesso!", "success");
    }
  },

  // 1️⃣2️⃣ Confirmar substituição de respostas existentes
  async confirmReplace() {
    await Qry_saveAnswersAmbiental.run();
    closeModal("Modal_ConfirmAmbiental");
    showAlert("Respostas substituídas com sucesso!", "success");
  },

  // 1️⃣3️⃣ Cancelar substituição
  cancelReplace() {
    closeModal("Modal_ConfirmAmbiental");
    showAlert("Substituição cancelada. As respostas anteriores foram mantidas.", "info");
  },

  // 1️⃣4️⃣ Carregar respostas anteriores do utilizador
  loadPreviousAnswers() {
    const data = Qry_getAnswersAmbiental.data || [];
    const mapped = {};

    data.forEach(row => {
      if (row.id_pergunta && row.resposta) {
        mapped[String(row.id_pergunta)] = row.resposta;
      }
    });

    this.answers = mapped;
  },

  // 1️⃣5️⃣ Aplicar filtros e carregar respostas anteriores
  async aplicarFiltrosECarregarRespostas() {
    const perguntas = this.getVisibleQuestions();
    if (perguntas.length > 0) {
      await Qry_getAnswersAmbiental.run();
      this.loadPreviousAnswers();
    }
  }
};