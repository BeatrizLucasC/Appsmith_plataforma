export default {
  // 1️⃣ Get only Social questions
  getSocialQuestions: () => {
    const data = Qry_getQuestions.data || [];
    return data.filter(row => {
      const d = String(row.dominio || "").trim().toLowerCase();
      return d === "social";
    });
  },

  // 2️⃣ Control visibility of each question
  visibleForItem: (row) => {
    if (!row) return false;
    const answers = appsmith.store.answers || {};
    const id = String(row.id_pergunta);

    // Example rule: show P51 only if P50 = "Sim"
    if (id === "p51") {
      return answers["p50"] === "Sim";
    }

    return true;
  },

  // 3️⃣ Build question label text
  questionLabel: (row) => {
    if (!row) return "";
    return (row.numero_ind ? row.numero_ind + " — " : "") + row.pergunta;
  },

  // 4️⃣ Return options for RadioGroup
  radioOptions: () => [
    { label: "NA", value: "NA" },
    { label: "Sim", value: "Sim" },
    { label: "Não", value: "Não" }
  ],

  // 5️⃣ Get default selected value for RadioGroup
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

    // Business rule: if P50 changed and not "Sim", clear P51 (set to null)
    if (id === "p50" && selectedValue !== "Sim") {
      next["p51"] = null;
    }

    storeValue("answers", next);
  },

  // 7️⃣ Prepare Social answers for saving (include nulls)
  prepareSocialAnswers: (answers) => {
    const allQuestions = Qry_getQuestions.data || [];
    const userEmail = appsmith.user.email || "unknown_user";

    // Keep only Social questions
    const socialQs = allQuestions.filter(
      q => String(q.dominio || "").trim().toLowerCase() === "social"
    );

    // Map all Social questions — even if the answer is null
    return socialQs.map(q => {
      const val = answers[q.id_pergunta];
      return {
        id_resposta: `${userEmail}_${q.id_pergunta}`,
        id_pergunta: q.id_pergunta,
        id_utilizador: userEmail,
        resposta:
          val === undefined || val === "" ? null : String(val).trim()
      };
    });
  },

  // 8️⃣ Build SQL values string safely (handles NULLs and quotes)
  buildSocialValues: (answers) => {
    const prepared = JS_regrasSocial.prepareSocialAnswers(answers);

    if (!prepared || prepared.length === 0) {
      // Prevent SQL crash when no rows
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

  // 9️⃣ Handle submission with confirmation modal
  onSubmitSocial: async () => {
    const userEmail = appsmith.user.email || "unknown_user";
    const answers = appsmith.store.answers || {};

    if (!userEmail) {
      showAlert("No Appsmith user email found.", "error");
      return;
    }

    // ⚠️ Make sure Qry_checkExistingSocial filters dominio = 'social'
    await Qry_checkExistingSocial.run();
    const hasExisting = (Qry_checkExistingSocial.data || []).length > 0;

    if (hasExisting) {
      showAlert(
        "You already have saved Social answers. Are you sure you want to replace them?",
        "warning"
      );
      showModal("Modal_ConfirmReplaceSocial");
    } else {
      // Save directly if no previous answers
      await Qry_saveAnswersSocial.run();
      showAlert("Social answers submitted successfully!", "success");
    }
  },

  // 🔟 Called when user confirms replacement
  confirmReplaceSocial: async () => {
    await Qry_saveAnswersSocial.run();
    closeModal("Modal_ConfirmReplaceSocial");
    showAlert("Previous Social answers replaced successfully!", "success");
  },

  // 1️⃣1️⃣ Called when user cancels replacement
  cancelReplaceSocial: () => {
    closeModal("Modal_ConfirmReplaceSocial");
    showAlert("Submission cancelled.", "info");
  }
};
