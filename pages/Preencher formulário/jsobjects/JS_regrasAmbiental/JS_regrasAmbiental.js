export default {
  // 1️⃣ Get only Ambiental questions
  getAmbientalQuestions: () => {
    const data = Qry_getQuestions.data || [];
    return data.filter(row => {
      const d = String(row.dominio || "").trim().toLowerCase();
      return d === "ambiental";
    });
  },

  // 2️⃣ Get only *visible* Ambiental questions (filters out hidden ones)
  getVisibleAmbientalQuestions: () => {
    const all = JS_regrasAmbiental.getAmbientalQuestions();
    const answers = appsmith.store.answers || {};

    return all.filter(row => {
      const id = String(row.id_pergunta);

      // Example: show p3 only if p2 = "Sim"
      if (id === "p3") {
        return answers["p2"] === "Sim";
      }

      // Add more conditional rules here if needed
      return true;
    });
  },

  // 3️⃣ Build question label text
  questionLabel: (row) => {
    if (!row) return "";
    return (row.numero_ind ? row.numero_ind + " — " : "") + row.pergunta;
  },

  // 4️⃣ RadioGroup options
  radioOptions: () => [
    { label: "NA", value: "NA" },
    { label: "Sim", value: "Sim" },
    { label: "Não", value: "Não" }
  ],

  // 5️⃣ Default selected value for RadioGroup
  selectedValue: (row) => {
    const answers = appsmith.store.answers || {};
    return answers[row.id_pergunta] || "";
  },

  // 6️⃣ Handle onSelectionChange
  onSelectionChange: (row, selectedValue) => {
    if (!row) return;

    const id = String(row.id_pergunta);
    const next = {
      ...(appsmith.store.answers || {}),
      [id]: selectedValue
    };

    // Example rule: if P2 != "Sim", clear P3
    if (id === "p2" && selectedValue !== "Sim") {
      next["p3"] = null;
    }

    storeValue("answers", next);
  },

  // 7️⃣ Prepare Ambiental answers for saving (include nulls)
  prepareAmbientalAnswers: (answers) => {
    const allQuestions = Qry_getQuestions.data || [];
    const userEmail = appsmith.user.email || "unknown_user";

    const ambientalQs = allQuestions.filter(
      q => String(q.dominio || "").trim().toLowerCase() === "ambiental"
    );

    return ambientalQs.map(q => {
      const val = answers[q.id_pergunta];
      return {
        id_resposta: `${userEmail}_${q.id_pergunta}`,
        id_pergunta: q.id_pergunta,
        id_utilizador: userEmail,
        resposta: val === undefined || val === "" ? null : String(val).trim()
      };
    });
  },

  // 8️⃣ Build SQL values string safely (handles NULLs and quotes)
  buildAmbientalValues: (answers) => {
    const prepared = JS_regrasAmbiental.prepareAmbientalAnswers(answers);

    if (!prepared || prepared.length === 0) {
      // Prevent SQL crash if no data
      return "('none', 'none', 'none', NULL, NOW())";
    }

    const rows = prepared.map(ans => {
      const safeValue =
        ans.resposta === null
          ? "NULL"
          : "'" + ans.resposta.replace(/'/g, "''") + "'";

      return (
        "('" +
        ans.id_resposta + "', '" +
        ans.id_pergunta + "', '" +
        ans.id_utilizador + "', " +
        safeValue + ", NOW())"
      );
    });

    return rows.join(", ");
  },

  // 9️⃣ Handle submission (checks if user already has answers)
  onSubmitAmbiental: async () => {
    const userEmail = appsmith.user.email || "unknown_user";
    const answers = appsmith.store.answers || {};

    if (!userEmail) {
      showAlert("No Appsmith user email found.", "error");
      return;
    }

    // Check if answers already exist for this user
    await Qry_checkExistingAmbiental.run();
    const hasExisting = (Qry_checkExistingAmbiental.data || []).length > 0;

    if (hasExisting) {
      showAlert(
        "You already have saved answers. Are you sure you want to replace them?",
        "warning"
      );
      showModal("Modal_ConfirmReplace"); // Open confirmation modal
    } else {
      // No previous answers → save directly
      await Qry_saveAnswersAmbiental.run();
      showAlert("Answers submitted successfully!", "success");
    }
  },

  // 🔟 Called when user confirms replacement
  confirmReplaceAmbiental: async () => {
    await Qry_saveAnswersAmbiental.run();
    closeModal("Modal_ConfirmReplace");
    showAlert("Previous answers replaced successfully!", "success");
  },

  // 1️⃣1️⃣ Called when user cancels replacement
  cancelReplaceAmbiental: () => {
    closeModal("Modal_ConfirmReplace");
    showAlert("Submission cancelled.", "info");
  }
};
