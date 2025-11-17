export default {
  // Store user answers
  answers: {},

  // 1️⃣ Get all questions for the "Económico" domain
  // Returns an array of questions filtered by the "Económico" domain
  getQuestions() {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => String(q.Domínio || "").trim().toLowerCase() === "económico"
    );
  },

  // 2️⃣ Filter questions based on widget selections
  // Returns only questions that match selected certifications, production systems, and dimensions
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

  // 3️⃣ Determine visible questions based on previous answers
  // Handles conditional visibility: some questions appear only if previous answers match certain conditions
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

  // 4️⃣ Build question label
  // Returns a human-readable label combining code and question text
  questionLabel: row => (row ? `${row.Código || ""} — ${row.Pergunta || ""}` : ""),

  // 5️⃣ Radio options
  // Returns the possible answers for each question
  radioOptions: () => [
    { label: "NA", value: "NA" },
    { label: "Sim", value: "Sim" },
    { label: "Não", value: "Não" }
  ],

  // 6️⃣ Get selected answer
  // Returns the currently selected answer for a question
  selectedValue(row) {
    return this.answers?.[row.Código] || "";
  },

  // 7️⃣ Update answer when user selects an option
  // Updates the local answers object
  onSelectionChange(row, selectedValue) {
    if (!row) return;
    this.answers = { ...this.answers, [String(row.Código)]: selectedValue };
  },

  // 8️⃣ Prepare answers for saving
  // Adds metadata (user, year) and ensures all values are strings or null
	prepareAnswers() {
		const all = this.getVisibleQuestions();
		const userEmail = appsmith.user.email || "unknown_user";
		const year = new Date().getFullYear();
		const answers = this.answers || {};
		const dominio = "económico"; // hardcoded domain

		return all.map(q => ({
			id_resposta: `${userEmail}_${year}_${q.Código}`, // primary key
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

	// 9️⃣ Build SQL values for insertion
	// Converts prepared answers into a SQL-friendly string for insertion
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
	
  // 🔟 Check if all visible questions have been answered
  isReadyToSubmit() {
    const visibleQuestions = this.getVisibleQuestions();
    return visibleQuestions.every(q => {
      const resposta = this.answers?.[q.Código];
      return ["Sim", "Não", "NA"].includes(resposta);
    });
  },

  // 1️⃣1️⃣ Submit answers
  // Checks if previous answers exist, shows modal if needed, otherwise saves
  async onSubmit() {
    const userEmail = appsmith.user.email || "unknown_user";
    if (!userEmail) {
      showAlert("Não foi possível identificar o utilizador.", "error");
      return;
    }

    if (!this.isReadyToSubmit()) {
      showAlert("Por favor, responda a todas as perguntas visíveis antes de submeter.", "warning");
      return;
    }

    await Qry_checkExistingEconomico.run();

    const result = Qry_checkExistingEconomico.data;
    const hasExisting = Array.isArray(result) && result.length > 0;

    if (hasExisting) {
      showModal("Modal_ConfirmEconomico");
    } else {
      await Qry_saveAnswersEconomico.run();
      showAlert("Respostas submetidas com sucesso!", "success");
    }
  },

  // 1️⃣2️⃣ Confirm replacing existing answers
  // Called from modal to overwrite old answers
  async confirmReplace() {
    await Qry_saveAnswersEconomico.run();
    closeModal("Modal_ConfirmEconomico");
    showAlert("Respostas anteriores substituídas com sucesso!", "success");
  },

  // 1️⃣3️⃣ Cancel replacement
  // Called from modal to cancel overwrite
  cancelReplace() {
    closeModal("Modal_ConfirmEconomico");
    showAlert("Submissão cancelada.", "info");
  },

  // 1️⃣4️⃣ Carregar respostas anteriores do utilizador
  loadPreviousAnswers() {
    const data = Qry_getAnswersEconomico.data || [];
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
      await Qry_getAnswersEconomico.run();
      this.loadPreviousAnswers();
    }
  }
};
