export default {
  answers: {},

  // 1️⃣ Get Ambiental questions
  getAmbientalQuestions: () => {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => String(q.Domínio || "").trim().toLowerCase() === "ambiental"
    );
  },

  // 2️⃣ Filter Ambiental questions based on widgets
  filterAmbientalQuestions: () => {
    const all = JS_regrasAmbiental.getAmbientalQuestions();
    if (!all.length) return [];

    const selectedCert = Multiselect_Certificacao.selectedOptionValues || [];
    const selectedSP = Multiselect_SistemaProducao.selectedOptionValues || [];
    const selectedDE = Select_Dimensao.selectedOptionValue || "";

    return all.filter(q => {
      const certMatch =
        selectedCert.length === 0 ||
        selectedCert.some(col => q[col] === "S");

      const spMatch =
        selectedSP.length === 0 ||
        selectedSP.some(col => q[col] === "S");

      const deMatch =
        !selectedDE || q[selectedDE] === "S";

      return certMatch && spMatch && deMatch;
    });
  },

  // 3️⃣ Compute the visible sequence dynamically
  getVisibleAmbientalQuestions: () => {
    const all = JS_regrasAmbiental.filterAmbientalQuestions();
    const answers = JS_regrasAmbiental.answers || {};
    if (!all.length) return [];

    const byId = {};
    all.forEach(q => {
      byId[String(q.Código)] = q;
    });

    const visible = [];
    let current = all[0];

    while (current) {
      visible.push(current);
      const id = String(current.Código);
      const ans = answers[id];

      let nextId = null;

      if (ans === "Sim" && current["Condição SIM"])
        nextId = String(current["Condição SIM"]);
      else if (ans === "Não" && current["Condição NÃO"])
        nextId = String(current["Condição NÃO"]);
      else if (ans === "NA" && current["Condição NA"])
        nextId = String(current["Condição NA"]);

      if (!nextId) {
        const idx = all.findIndex(q => String(q.Código) === id);
        if (idx >= 0 && idx + 1 < all.length) {
          nextId = String(all[idx + 1].Código);
        } else {
          nextId = null;
        }
      }

      if (!nextId || !byId[nextId]) break;
      if (visible.some(q => String(q.Código) === nextId)) break;

      current = byId[nextId];
    }

    return visible;
  },

  // 4️⃣ Build label
  questionLabel: (row) =>
    row ? `${row.Código || ""} — ${row.Pergunta || ""}` : "",

  // 5️⃣ Radio options
  radioOptions: () => [
    { label: "NA", value: "NA" },
    { label: "Sim", value: "Sim" },
    { label: "Não", value: "Não" }
  ],

  // 6️⃣ Selected value
  selectedValue: (row) => {
    const answers = JS_regrasAmbiental.answers || {};
    return answers[row.Código] || "";
  },

  // 7️⃣ Handle user answer change
  onSelectionChange: (row, selectedValue) => {
    if (!row) return;
    const id = String(row.Código);

    const updated = {
      ...JS_regrasAmbiental.answers,
      [id]: selectedValue
    };

    JS_regrasAmbiental.answers = updated;
  },

  // 8️⃣ Prepare answers for saving
  prepareAmbientalAnswers: () => {
    const all = JS_regrasAmbiental.getVisibleAmbientalQuestions();
    const userEmail = appsmith.user.email || "unknown_user";
    const answers = JS_regrasAmbiental.answers || {};
    const year = new Date().getFullYear();

    return all.map(q => ({
      id_resposta: `${userEmail}_${year}_${q.Código}`,
      id_pergunta: q.Código,
      id_utilizador: userEmail,
      resposta:
        answers[q.Código] === undefined || answers[q.Código] === ""
          ? null
          : String(answers[q.Código]).trim()
    }));
  },

  // 9️⃣ SQL builder
  buildAmbientalValues: () => {
    const prepared = JS_regrasAmbiental.prepareAmbientalAnswers();
    if (!prepared.length) return "('none','none','none',NULL,NOW())";

    return prepared
      .map(ans => {
        const safeVal =
          ans.resposta === null
            ? "NULL"
            : `'${ans.resposta.replace(/'/g, "''")}'`;
        return `('${ans.id_resposta}','${ans.id_pergunta}','${ans.id_utilizador}',${safeVal},NOW())`;
      })
      .join(", ");
  },

  // 🔟 Verifica se todas as perguntas visíveis foram respondidas
  isAmbientalReadyToSubmit: () => {
    const visibleQuestions = JS_regrasAmbiental.getVisibleAmbientalQuestions();
    const answers = JS_regrasAmbiental.answers || {};

    return visibleQuestions.every(q => {
      const resposta = answers[q.Código];
      return resposta === "Sim" || resposta === "Não" || resposta === "NA";
    });
  },

  // 1️⃣1️⃣ Submit handler com validação
  onSubmitAmbiental: async () => {
    const userEmail = appsmith.user.email || "unknown_user";
    if (!userEmail) {
      showAlert("Não foi possível identificar o utilizador.", "error");
      return;
    }

    const ready = JS_regrasAmbiental.isAmbientalReadyToSubmit();
    if (!ready) {
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

  // 1️⃣2️⃣ Confirma substituição
  confirmReplaceAmbiental: async () => {
    await Qry_saveAnswersAmbiental.run();
    closeModal("Modal_ConfirmReplace");
    showAlert("Respostas anteriores substituídas com sucesso!", "success");
  },

  // 1️⃣3️⃣ Cancela substituição
  cancelReplaceAmbiental: () => {
    closeModal("Modal_ConfirmReplace");
    showAlert("Submissão cancelada.", "info");
  }
};