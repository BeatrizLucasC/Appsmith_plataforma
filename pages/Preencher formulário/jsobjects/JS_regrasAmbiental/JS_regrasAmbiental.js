export default {
  // 1️⃣ Filter only Ambiental questions
  getAmbientalQuestions: () => {
    const data = Qry_getQuestions.data || [];
    return data.filter(row => {
      const d = String(row.dominio || "").trim().toLowerCase();
      return d === "ambiental";
    });
  },

  // 2️⃣ Control visibility of each question
  visibleForItem: (row) => {
    if (!row) return false;
    const answers = appsmith.store.answers || {};
    const id = String(row.id_pergunta);

    // Example rule: show P3 only if P2 = "Sim"
    if (id === "p3") {
      return answers["p2"] === "Sim";
    }

    return true;
  },

  // 3️⃣ Build question label text
  questionLabel: (row) => {
    if (!row) return "";
    return (row.numero_ind ? row.numero_ind + " — " : "") + row.pergunta;
  },

  // 4️⃣ Return options for radio group
  radioOptions: () => [
    { label: "NA", value: "NA" },
    { label: "Sim", value: "Sim" },
    { label: "Não", value: "Não" }
  ],

  // 5️⃣ Get default selected value for radio
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

    // Business rule: if P2 changed and not "Sim", clear P3
    if (id === "p2" && selectedValue !== "Sim") {
      next["p3"] = "";
    }

    storeValue("answers", next);
  },

  // 7️⃣ Prepare Ambiental answers for saving
  prepareAmbientalAnswers: (answers) => {
    const userEmail = appsmith.user.email; // use Appsmith account email
    const allQuestions = Qry_getQuestions.data || [];

    const ambientalQs = allQuestions.filter(q =>
      String(q.dominio || "").trim().toLowerCase() === "ambiental"
    );

    // Only include Ambiental answers that exist
    const prepared = ambientalQs
      .filter(q => answers[q.id_pergunta] !== undefined && answers[q.id_pergunta] !== "")
      .map(q => ({
        id_resposta: `${userEmail}_${q.id_pergunta}`,  // composite key
        id_pergunta: q.id_pergunta,
        id_utilizador: userEmail,
        resposta: answers[q.id_pergunta]
      }));

    return prepared;
  },

  // 8️⃣ Handle submission logic — show modal if replacement risk
  onSubmitAmbiental: async () => {
    const userEmail = appsmith.user.email;
    const answers = appsmith.store.answers || {};

    if (!userEmail) {
      showAlert("No Appsmith user email found.", "error");
      return;
    }

    // Ensure the check query name matches exactly
    await Qry_checkExisting.run();
    const hasExisting = (Qry_checkExisting.data || []).length > 0;

    if (hasExisting) {
      // Open the modal that contains "Yes / Cancel" buttons
      showAlert("You already have saved answers. Please confirm replacement in the dialog.", "warning");
      showModal("Modal_ConfirmReplace");
    } else {
      // No previous answers => save directly
      await Qry_saveAnswers.run();
      showAlert("Answers submitted successfully!", "success");
    }
  },

  // 9️⃣ Called when user confirms replacing answers (Yes button in modal)
  confirmReplaceAmbiental: async () => {
    // Run the save query (ensure prepared statements OFF for Qry_saveAnswers)
    await Qry_saveAnswers.run();
    closeModal("Modal_ConfirmReplace");
    showAlert("Previous answers replaced successfully!", "success");
  },

  // 🔟 Called when user cancels replacement (Cancel button in modal)
  cancelReplace: () => {
    closeModal("Modal_ConfirmReplace");
    showAlert("Submission canceled.", "info");
  }
};
