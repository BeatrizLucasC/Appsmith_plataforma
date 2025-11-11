export default {
  answers: {},

  // 1️⃣ Get Ambiental questions
  getAmbientalQuestions: () => {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => String(q.Domínio || "").trim().toLowerCase() === "ambiental"
    );
  },

  // 2️⃣ Compute the visible sequence dynamically based on answers and condition columns
  getVisibleAmbientalQuestions: () => {
    const all = JS_regrasAmbiental.getAmbientalQuestions();
    const answers = JS_regrasAmbiental.answers || {};
    if (!all.length) return [];

    // Create a lookup by Código
    const byId = {};
    all.forEach(q => {
      byId[String(q.Código)] = q;
    });

    const visible = [];
    let current = all[0]; // start with first question

    while (current) {
      visible.push(current);
      const id = String(current.Código);
      const ans = answers[id];

      // Determine next question ID based on condition
      let nextId = null;

      if (ans === "Sim" && current["Condição SIM"])
        nextId = String(current["Condição SIM"]);
      else if (ans === "Não" && current["Condição NÃO"])
        nextId = String(current["Condição NÃO"]);
      else if (ans === "NA" && current["Condição NA"])
        nextId = String(current["Condição NA"]);

      // If no condition provided → go to next in list
      if (!nextId) {
        const idx = all.findIndex(q => String(q.Código) === id);
        if (idx >= 0 && idx + 1 < all.length) {
          nextId = String(all[idx + 1].Código);
        } else {
          nextId = null;
        }
      }

      // If no nextId found or invalid → stop
      if (!nextId || !byId[nextId]) break;

      // If next question already visible → avoid infinite loop
      if (visible.some(q => String(q.Código) === nextId)) break;

      current = byId[nextId];
    }

    return visible;
  },

  // 3️⃣ Build label
  questionLabel: (row) =>
    row ? `${row.Código || ""} — ${row.Pergunta || ""}` : "",

  // 4️⃣ Radio options
  radioOptions: () => [
    { label: "NA", value: "NA" },
    { label: "Sim", value: "Sim" },
    { label: "Não", value: "Não" }
  ],

  // 5️⃣ Selected value
  selectedValue: (row) => {
    const answers = JS_regrasAmbiental.answers || {};
    return answers[row.Código] || "";
  },

  // 6️⃣ Handle user answer change
  onSelectionChange: (row, selectedValue) => {
    if (!row) return;
    const id = String(row.Código);

    const updated = {
      ...JS_regrasAmbiental.answers,
      [id]: selectedValue
    };

    JS_regrasAmbiental.answers = updated;
  },

  // 7️⃣ Prepare answers for saving
  prepareAmbientalAnswers: () => {
    const all = JS_regrasAmbiental.getAmbientalQuestions();
    const userEmail = appsmith.user.email || "unknown_user";
    const answers = JS_regrasAmbiental.answers || {};

    return all.map(q => ({
      id_resposta: `${userEmail}_${q.Código}`,
      id_pergunta: q.Código,
      id_utilizador: userEmail,
      resposta:
        answers[q.Código] === undefined || answers[q.Código] === ""
          ? null
          : String(answers[q.Código]).trim()
    }));
  },

  // 8️⃣ SQL builder
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

  // 9️⃣ Submit handler
  onSubmitAmbiental: async () => {
    const userEmail = appsmith.user.email || "unknown_user";
    if (!userEmail) {
      showAlert("No Appsmith user email found.", "error");
      return;
    }

    await Qry_checkExistingAmbiental.run();
    const hasExisting = (Qry_checkExistingAmbiental.data || []).length > 0;

    if (hasExisting) {
      showModal("Modal_ConfirmReplace");
    } else {
      await Qry_saveAnswersAmbiental.run();
      showAlert("Answers submitted successfully!", "success");
    }
  },

  confirmReplaceAmbiental: async () => {
    await Qry_saveAnswersAmbiental.run();
    closeModal("Modal_ConfirmReplace");
    showAlert("Previous answers replaced successfully!", "success");
  },

  cancelReplaceAmbiental: () => {
    closeModal("Modal_ConfirmReplace");
    showAlert("Submission cancelled.", "info");
  }
};
