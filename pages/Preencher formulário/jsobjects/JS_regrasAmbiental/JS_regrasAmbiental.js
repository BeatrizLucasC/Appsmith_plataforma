export default {
  // Store user answers
  answers: {},

  // 1️⃣ Get questions for the "Ambiental" domain
  getAmbientalQuestions() {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => String(q.Domínio || "").trim().toLowerCase() === "ambiental"
    );
  },

  // 2️⃣ Filter questions based on selected widgets
  filterAmbientalQuestions() {
    const all = this.getAmbientalQuestions();
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

  // 3️⃣ Determine visible question sequence based on responses
  getVisibleAmbientalQuestions() {
    const all = this.filterAmbientalQuestions();
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
  questionLabel: row => (row ? `${row.Código || ""} — ${row.Pergunta || ""}` : ""),

  // 5️⃣ Radio button options
  radioOptions: () => [
    { label: "NA", value: "NA" },
    { label: "Sim", value: "Sim" },
    { label: "Não", value: "Não" }
  ],

  // 6️⃣ Get selected answer value
  selectedValue(row) {
    return this.answers?.[row.Código] || "";
  },

  // 7️⃣ Update answer when user selects an option
  onSelectionChange(row, selectedValue) {
    if (!row) return;
    this.answers = { ...this.answers, [String(row.Código)]: selectedValue };
  },

  // 8️⃣ Prepare answers for saving
	prepareAmbientalAnswers() {
		const all = this.getVisibleAmbientalQuestions();
		const userEmail = appsmith.user.email || "unknown_user";
		const year = new Date().getFullYear();
		const answers = this.answers || {};

		return all.map(q => ({
			id_resposta: `${userEmail}_${year}_${q.Código}`,
			id_pergunta: q.Código,
			dominio: q.Domínio || "unknown",
			id_utilizador: userEmail,
			resposta:
				answers[q.Código] === undefined || answers[q.Código] === ""
					? null
					: String(answers[q.Código]).trim()
		}));
	},

	// 9️⃣ Build SQL values for insertion
	buildAmbientalValues() {
		const prepared = this.prepareAmbientalAnswers();
		if (!prepared.length) return "('none','none','unknown','unknown',NULL,NOW())";

		return prepared
			.map(ans => {
				const safeVal = ans.resposta === null ? "NULL" : `'${ans.resposta.replace(/'/g, "''")}'`;
				const safeDom = `'${ans.dominio.replace(/'/g, "''")}'`;
				return `('${ans.id_resposta}','${ans.id_pergunta}',${safeDom},'${ans.id_utilizador}',NOW(),${safeVal})`;
				//                          ^ dominio ^        ^ id_utilizador ^  ^ data_hora_submissao ^ ^ resposta ^
			})
			.join(", ");
	},

  // 🔟 Verify that all visible questions are answered
  isAmbientalReadyToSubmit() {
    const visibleQuestions = this.getVisibleAmbientalQuestions();
    return visibleQuestions.every(q => {
      const resposta = this.answers?.[q.Código];
      return ["Sim", "Não", "NA"].includes(resposta);
    });
  },

  // 1️⃣1️⃣ Submit answers (with existing-check)
  async onSubmitAmbiental() {
    const userEmail = appsmith.user.email || "unknown_user";
    if (!userEmail) {
      showAlert("Não foi possível identificar o utilizador.", "error");
      return;
    }

    if (!this.isAmbientalReadyToSubmit()) {
      showAlert("Por favor, responda a todas as perguntas visíveis antes de submeter.", "warning");
      return;
    }

    await Qry_checkExistingAmbiental.run();
    const hasExisting = (Qry_checkExistingAmbiental.data || []).length > 0;

    if (hasExisting) {
      showModal("Modal_ConfirmReplace");
    } else {
      await Qry_saveAnswersAmbiental.run();
      showAlert("Respostas submetidas com sucesso!", "success");
    }
  },

  // 1️⃣2️⃣ Confirm replacing existing answers
  async confirmReplaceAmbiental() {
    await Qry_saveAnswersAmbiental.run();
    closeModal("Modal_ConfirmReplace");
    showAlert("Respostas anteriores substituídas com sucesso!", "success");
  },

  // 1️⃣3️⃣ Cancel replacement
  cancelReplaceAmbiental() {
    closeModal("Modal_ConfirmReplace");
    showAlert("Submissão cancelada.", "info");
  },
};
